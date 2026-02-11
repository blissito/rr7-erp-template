// @ts-nocheck
import { useState } from "react";
import { Form, useLoaderData, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/acceso";
import { requireUser } from "~/lib/session.server";
import { Member } from "~/models/member.server";
import { MemberMembership } from "~/models/member-membership.server";
import { AccessLog } from "~/models/access-log.server";
import { PageHeader } from "~/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { SearchInput } from "~/components/ui/search-input";
import { Avatar } from "~/components/ui/avatar";
import { Badge, MembershipStatusBadge } from "~/components/ui/badge";
import { Alert } from "~/components/ui/alert";
import { EmptyState } from "~/components/ui/empty-state";
import { formatShortDate, daysUntilExpiration, startOfDay, endOfDay } from "~/lib/utils/dates";

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";

  const today = new Date();
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);

  // Personas adentro (último registro es entrada)
  // @ts-ignore - Drizzle compatibility
  const insideMembers = await AccessLog.aggregate([
    {
      $match: {
        // @ts-ignore - Compatibility
        fecha: { $gte: startOfToday, $lte: endOfToday },
      },
    },
    {
      $sort: { fecha: -1 },
    },
    {
      $group: {
        _id: "$memberId",
        lastType: { $first: "$tipo" },
        lastDate: { $first: "$fecha" },
      },
    },
    {
      $match: { lastType: "entrada" },
    },
  ]);

  // @ts-ignore - Compatibility
  const insideMemberIds = insideMembers.map((m: any) => m.id);

  // Obtener datos de miembros adentro
  const membersInside = await Member.find({
    _id: { $in: insideMemberIds },
    activo: true,
  // @ts-ignore - Drizzle compatibility
  }).lean();

  // Buscar miembros si hay búsqueda
  let searchResults: any[] = [];
  if (search.length >= 2) {
    searchResults = await Member.find({
      activo: true,
      // @ts-ignore - Compatibility
      $or: [
        { nombre: { $regex: search, $options: "i" } },
        { apellidos: { $regex: search, $options: "i" } },
        { numeroMiembro: { $regex: search, $options: "i" } },
        { telefono: { $regex: search, $options: "i" } },
      ],
    })
      // @ts-ignore - Drizzle compatibility
      .limit(10)
      // @ts-ignore - Drizzle compatibility
      .lean();

    // Agregar estado de membresía a resultados
    for (const member of searchResults) {
      const membership = await MemberMembership.findOne({
        // @ts-ignore - Compatibility
        memberId: member.id,
        activa: "activa",
      })
        // @ts-ignore - Drizzle compatibility
        .sort({ fechaFin: -1 })
        // @ts-ignore - Drizzle compatibility
        .lean() as { activa: string; fechaFin: Date } | null;

      (member as any).membership = membership
        ? {
            activa: membership.estado,
            fechaFin: membership.fechaFin.toISOString(),
            daysLeft: daysUntilExpiration(membership.fechaFin),
          }
        : null;

      // Verificar si está adentro
      (member as any).isInside = insideMemberIds.some(
        // @ts-ignore - Compatibility
        (id: any) => id.toString() === member.id.toString()
      );
    }
  }

  // Accesos de hoy
  const todayAccess = await AccessLog.find({
    // @ts-ignore - Compatibility
    fecha: { $gte: startOfToday, $lte: endOfToday },
  })
    // @ts-ignore - Drizzle compatibility
    .populate("memberId")
    // @ts-ignore - Drizzle compatibility
    .sort({ fecha: -1 })
    // @ts-ignore - Drizzle compatibility
    .limit(20)
    // @ts-ignore - Drizzle compatibility
    .lean();

  return {
    search,
    currentOccupancy: membersInside.length,
    // @ts-ignore - Compatibility
    membersInside: membersInside.map((m: any) => ({
      id: m.id.toString(),
      nombre: m.nombre,
      apellidos: m.apellidos,
      foto: m.foto,
      numeroMiembro: m.numeroMiembro,
    })),
    // @ts-ignore - Compatibility
    searchResults: searchResults.map((m: any) => ({
      id: m.id.toString(),
      nombre: m.nombre,
      apellidos: m.apellidos,
      foto: m.foto,
      numeroMiembro: m.numeroMiembro,
      telefono: m.telefono,
      membership: m.membership,
      isInside: m.isInside,
    })),
    // @ts-ignore - Compatibility
    todayAccess: todayAccess.map((a: any) => ({
      id: a.id.toString(),
      memberName: a.memberId
        ? `${a.memberId.nombre} ${a.memberId.apellidos}`
        : "Miembro eliminado",
      memberPhoto: a.memberId?.foto,
      tipo: a.tipo,
      hora: new Date(a.fecha).toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    })),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { user: session } = await requireUser(request);

  const formData = await request.formData();
  const memberId = formData.get("memberId") as string;
  const tipo = formData.get("tipo") as "entrada" | "salida";

  if (!memberId || !tipo) {
    return { error: "Datos incompletos" };
  }

  // Verificar que el miembro existe
  const member = await Member.findById(memberId);
  if (!member) {
    return { error: "Miembro no encontrado" };
  }

  // Si es entrada, verificar membresía activa
  if (tipo === "entrada") {
    const membership = await MemberMembership.findOne({
      memberId,
      activa: "activa",
      // @ts-ignore - Compatibility
      fechaFin: { $gte: new Date() },
    });

    if (!membership) {
      return {
        error: "El miembro no tiene una membresia activa",
        memberName: `${member.nombre} ${member.apellidos}`,
      };
    }
  }

  // Registrar acceso
  await AccessLog.create({
    memberId,
    tipo,
    fecha: new Date(),
    // @ts-ignore - Compatibility
    registradoPor: session.userId,
  });

  return {
    success: true,
    tipo,
    memberName: `${member.nombre} ${member.apellidos}`,
  };
}

export default function Acceso() {
  const { search, currentOccupancy, membersInside, searchResults, todayAccess } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div>
      <PageHeader
        title="Control de Acceso"
        description="Registra entradas y salidas de miembros"
      />

      {/* Mensaje de acción */}
      {actionData?.success && (
        <Alert
          variant="success"
          className="mb-6"
          title={actionData.tipo === "entrada" ? "Entrada registrada" : "Salida registrada"}
        >
          {actionData.memberName} -{" "}
          {actionData.tipo === "entrada" ? "Bienvenido/a" : "Hasta pronto"}
        </Alert>
      )}

      {actionData?.error && (
        <Alert variant="error" className="mb-6" title="Error">
          {actionData.error}
          {actionData.memberName && ` - ${actionData.memberName}`}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de búsqueda */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Buscar Miembro</CardTitle>
            </CardHeader>
            <CardContent>
              <Form method="get">
                <SearchInput
                  name="search"
                  placeholder="Buscar por nombre, numero o telefono..."
                  defaultValue={search}
                  className="text-lg py-3"
                />
              </Form>

              {search.length >= 2 && (
                <div className="mt-6">
                  {searchResults.length === 0 ? (
                    <EmptyState
                      title="Sin resultados"
                      description={`No se encontraron miembros con "${search}"`}
                    />
                  ) : (
                    <ul className="divide-y divide-gray-200 -mx-6">
                      {searchResults.map((member) => (
                        // @ts-ignore - Compatibility
                        <li key={member.id} className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <Avatar
                              name={`${member.nombre} ${member.apellidos}`}
                              src={member.foto}
                              size="lg"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-lg">
                                {member.nombre} {member.apellidos}
                              </p>
                              <p className="text-sm text-gray-500">
                                #{member.numeroMiembro} · {member.telefono}
                              </p>
                              {member.membership ? (
                                <div className="flex items-center gap-2 mt-1">
                                  <MembershipStatusBadge status={member.membership.estado} />
                                  <span className="text-sm text-gray-500">
                                    Vence: {formatShortDate(member.membership.fechaFin)}
                                    {member.membership.daysLeft <= 7 && (
                                      <span className="text-amber-600 ml-1">
                                        ({member.membership.daysLeft} dias)
                                      </span>
                                    )}
                                  </span>
                                </div>
                              ) : (
                                <Badge variant="danger" className="mt-1">
                                  Sin membresia activa
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {member.isInside ? (
                                <Form method="post">
                                  // @ts-ignore - Compatibility
                                  <input type="hidden" name="memberId" value={member.id} />
                                  <input type="hidden" name="tipo" value="salida" />
                                  <Button
                                    type="submit"
                                    variant="outline"
                                    size="lg"
                                    isLoading={isSubmitting}
                                  >
                                    Registrar Salida
                                  </Button>
                                </Form>
                              ) : (
                                <Form method="post">
                                  // @ts-ignore - Compatibility
                                  <input type="hidden" name="memberId" value={member.id} />
                                  <input type="hidden" name="tipo" value="entrada" />
                                  <Button
                                    type="submit"
                                    size="lg"
                                    isLoading={isSubmitting}
                                    disabled={!member.membership}
                                  >
                                    Registrar Entrada
                                  </Button>
                                </Form>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personas adentro */}
          <Card>
            <CardHeader>
              <CardTitle>
                Personas Adentro ({currentOccupancy})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {membersInside.length === 0 ? (
                <p className="p-6 text-center text-gray-500">
                  No hay personas adentro actualmente
                </p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {membersInside.map((member) => (
                    // @ts-ignore - Compatibility
                    <li key={member.id} className="flex items-center gap-4 p-4">
                      <Avatar
                        name={`${member.nombre} ${member.apellidos}`}
                        src={member.foto}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">
                          {member.nombre} {member.apellidos}
                        </p>
                        <p className="text-sm text-gray-500">
                          #{member.numeroMiembro}
                        </p>
                      </div>
                      <Form method="post">
                        // @ts-ignore - Compatibility
                        <input type="hidden" name="memberId" value={member.id} />
                        <input type="hidden" name="tipo" value="salida" />
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          isLoading={isSubmitting}
                        >
                          Salida
                        </Button>
                      </Form>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral - Accesos de hoy */}
        <Card>
          <CardHeader>
            <CardTitle>Accesos de Hoy</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {todayAccess.length === 0 ? (
              <p className="p-6 text-center text-gray-500">
                Sin accesos registrados hoy
              </p>
            ) : (
              <ul className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {todayAccess.map((access) => (
                  <li key={access.id} className="flex items-center gap-3 p-3">
                    <Avatar
                      name={access.memberName}
                      src={access.memberPhoto}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {access.memberName}
                      </p>
                      <p className="text-xs text-gray-500">{access.hora}</p>
                    </div>
                    <Badge
                      variant={access.tipo === "entrada" ? "success" : "default"}
                      size="sm"
                    >
                      {access.tipo === "entrada" ? "E" : "S"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
