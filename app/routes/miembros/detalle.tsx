import { Link, useLoaderData, Form, useActionData } from "react-router";
import type { Route } from "./+types/detalle";
import { connectDB } from "~/lib/db.server";
import { requireUser } from "~/lib/session.server";
import { Member } from "~/models/member.server";
import { MemberMembership } from "~/models/member-membership.server";
import { AccessLog } from "~/models/access-log.server";
import { Enrollment } from "~/models/enrollment.server";
import { PageHeader } from "~/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Avatar } from "~/components/ui/avatar";
import { Badge, MembershipStatusBadge } from "~/components/ui/badge";
import { Alert } from "~/components/ui/alert";
import { formatDate, formatShortDate, formatRelative, calculateAge, daysUntilExpiration } from "~/lib/utils/dates";
import { formatPhone, formatCurrency } from "~/lib/utils/format";

export async function loader({ params }: Route.LoaderArgs) {
  await connectDB();

  const member = await Member.findById(params.id).lean() as {
    _id: { toString(): string };
    numeroMiembro: string;
    nombre: string;
    apellidos: string;
    email?: string;
    telefono: string;
    fechaNacimiento?: Date;
    foto?: string;
    notas?: string;
    activo: boolean;
    createdAt: Date;
  } | null;
  if (!member) {
    throw new Response("Miembro no encontrado", { status: 404 });
  }

  // Membresías del miembro
  const memberships = await MemberMembership.find({ memberId: params.id })
    .populate("membershipTypeId")
    .populate("createdBy", "nombre")
    .sort({ createdAt: -1 })
    .lean();

  // Últimos accesos
  const accessLogs = await AccessLog.find({ memberId: params.id })
    .sort({ fecha: -1 })
    .limit(10)
    .lean();

  // Inscripciones a clases
  const enrollments = await Enrollment.find({
    memberId: params.id,
    estado: "inscrito",
  })
    .populate({
      path: "scheduleId",
      populate: [{ path: "classId" }, { path: "instructorId" }],
    })
    .lean();

  // Membresía activa actual
  const activeMembership = memberships.find(
    (m: any) => m.estado === "activa" && new Date(m.fechaFin) >= new Date()
  ) as {
    _id: { toString(): string };
    membershipTypeId?: { nombre: string };
    fechaInicio: Date;
    fechaFin: Date;
    estado: string;
  } | undefined;

  return {
    member: {
      id: member._id.toString(),
      numeroMiembro: member.numeroMiembro,
      nombre: member.nombre,
      apellidos: member.apellidos,
      email: member.email,
      telefono: member.telefono,
      fechaNacimiento: member.fechaNacimiento?.toISOString(),
      foto: member.foto,
      notas: member.notas,
      activo: member.activo,
      createdAt: member.createdAt.toISOString(),
    },
    activeMembership: activeMembership
      ? {
          id: activeMembership._id.toString(),
          tipo: (activeMembership.membershipTypeId as any)?.nombre || "N/A",
          fechaInicio: activeMembership.fechaInicio.toISOString(),
          fechaFin: activeMembership.fechaFin.toISOString(),
          estado: activeMembership.estado,
          daysLeft: daysUntilExpiration(activeMembership.fechaFin),
        }
      : null,
    memberships: memberships.map((m: any) => ({
      id: m._id.toString(),
      tipo: m.membershipTypeId?.nombre || "N/A",
      fechaInicio: m.fechaInicio.toISOString(),
      fechaFin: m.fechaFin.toISOString(),
      estado: m.estado,
      montoPagado: m.montoPagado,
      metodoPago: m.metodoPago,
      createdBy: m.createdBy?.nombre || "Sistema",
      createdAt: m.createdAt.toISOString(),
    })),
    accessLogs: accessLogs.map((a: any) => ({
      id: a._id.toString(),
      tipo: a.tipo,
      fecha: a.fecha.toISOString(),
    })),
    enrollments: enrollments.map((e: any) => ({
      id: e._id.toString(),
      className: e.scheduleId?.classId?.nombre || "Clase eliminada",
      instructorName: e.scheduleId?.instructorId
        ? `${e.scheduleId.instructorId.nombre} ${e.scheduleId.instructorId.apellidos}`
        : "Sin instructor",
      horaInicio: e.scheduleId?.horaInicio,
      horaFin: e.scheduleId?.horaFin,
      diaSemana: e.scheduleId?.diaSemana,
    })),
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  await requireUser(request);
  await connectDB();

  const formData = await request.formData();
  const action = formData.get("_action");

  if (action === "delete") {
    await Member.findByIdAndUpdate(params.id, { activo: false });
    return { success: true, message: "Miembro eliminado" };
  }

  return null;
}

const DAYS = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

export default function MiembroDetalle() {
  const { member, activeMembership, memberships, accessLogs, enrollments } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div>
      <PageHeader
        title={`${member.nombre} ${member.apellidos}`}
        description={`#${member.numeroMiembro}`}
        action={
          <div className="flex gap-2">
            <Link to={`/miembros/${member.id}/membresia`}>
              <Button variant="secondary">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                {activeMembership ? "Renovar Membresia" : "Asignar Membresia"}
              </Button>
            </Link>
            <Link to={`/miembros/${member.id}/editar`}>
              <Button variant="outline">Editar</Button>
            </Link>
          </div>
        }
      />

      {actionData?.success && (
        <Alert variant="success" className="mb-6">
          {actionData.message}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos del miembro */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <Avatar
                  name={`${member.nombre} ${member.apellidos}`}
                  src={member.foto}
                  size="xl"
                />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">
                    {member.nombre} {member.apellidos}
                  </h2>
                  <p className="text-gray-500">#{member.numeroMiembro}</p>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Telefono</p>
                      <p className="font-medium">{formatPhone(member.telefono)}</p>
                    </div>
                    {member.email && (
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{member.email}</p>
                      </div>
                    )}
                    {member.fechaNacimiento && (
                      <div>
                        <p className="text-sm text-gray-500">Fecha de Nacimiento</p>
                        <p className="font-medium">
                          {formatDate(member.fechaNacimiento)} (
                          {calculateAge(member.fechaNacimiento)} anios)
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500">Miembro desde</p>
                      <p className="font-medium">{formatDate(member.createdAt)}</p>
                    </div>
                  </div>

                  {member.notas && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">Notas</p>
                      <p className="text-gray-700">{member.notas}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Historial de membresías */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Membresias</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {memberships.length === 0 ? (
                <p className="p-6 text-center text-gray-500">
                  No hay membresias registradas
                </p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">
                        Tipo
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">
                        Periodo
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">
                        Pago
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {memberships.map((m) => (
                      <tr key={m.id}>
                        <td className="py-3 px-4">
                          <p className="font-medium">{m.tipo}</p>
                          <p className="text-sm text-gray-500">
                            Por {m.createdBy}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p>{formatShortDate(m.fechaInicio)}</p>
                          <p className="text-sm text-gray-500">
                            al {formatShortDate(m.fechaFin)}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p>{formatCurrency(m.montoPagado)}</p>
                          <p className="text-sm text-gray-500 capitalize">
                            {m.metodoPago}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <MembershipStatusBadge status={m.estado} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* Inscripciones a clases */}
          <Card>
            <CardHeader>
              <CardTitle>Clases Inscritas</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {enrollments.length === 0 ? (
                <p className="p-6 text-center text-gray-500">
                  No esta inscrito en ninguna clase
                </p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {enrollments.map((e) => (
                    <li key={e.id} className="flex items-center gap-4 p-4">
                      <div className="w-20 text-center">
                        <p className="font-medium text-primary-600">{e.horaInicio}</p>
                        <p className="text-xs text-gray-500">{DAYS[e.diaSemana]}</p>
                      </div>
                      <div>
                        <p className="font-medium">{e.className}</p>
                        <p className="text-sm text-gray-500">{e.instructorName}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Estado de membresía */}
          <Card>
            <CardHeader>
              <CardTitle>Estado de Membresia</CardTitle>
            </CardHeader>
            <CardContent>
              {activeMembership ? (
                <div>
                  <MembershipStatusBadge status={activeMembership.estado as "activa" | "vencida" | "cancelada"} />
                  <p className="mt-3 font-medium text-lg">{activeMembership.tipo}</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Inicio:</span>
                      <span>{formatShortDate(activeMembership.fechaInicio)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vencimiento:</span>
                      <span>{formatShortDate(activeMembership.fechaFin)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Dias restantes:</span>
                      <span
                        className={
                          activeMembership.daysLeft <= 7
                            ? "text-amber-600 font-medium"
                            : ""
                        }
                      >
                        {activeMembership.daysLeft < 0
                          ? "Vencida"
                          : `${activeMembership.daysLeft} dias`}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Badge variant="danger" size="md">
                    Sin membresia activa
                  </Badge>
                  <p className="mt-2 text-sm text-gray-500">
                    Este miembro no tiene una membresia vigente
                  </p>
                  <Link to={`/miembros/${member.id}/membresia`} className="mt-4 block">
                    <Button className="w-full">Asignar Membresia</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Últimos accesos */}
          <Card>
            <CardHeader>
              <CardTitle>Ultimos Accesos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {accessLogs.length === 0 ? (
                <p className="p-6 text-center text-gray-500">Sin accesos registrados</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {accessLogs.map((a) => (
                    <li key={a.id} className="flex items-center justify-between p-3">
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(a.fecha).toLocaleDateString("es-MX")}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(a.fecha).toLocaleTimeString("es-MX", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <Badge
                        variant={a.tipo === "entrada" ? "success" : "default"}
                        size="sm"
                      >
                        {a.tipo === "entrada" ? "Entrada" : "Salida"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Acciones peligrosas */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent>
              <Form method="post">
                <input type="hidden" name="_action" value="delete" />
                <Button
                  type="submit"
                  variant="danger"
                  className="w-full"
                  onClick={(e) => {
                    if (!confirm("¿Seguro que deseas eliminar este miembro?")) {
                      e.preventDefault();
                    }
                  }}
                >
                  Eliminar Miembro
                </Button>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
