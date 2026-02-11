// @ts-nocheck
import { Link, useLoaderData, Form } from "react-router";
import type { Route } from "./+types/index";
import { requireUser } from "~/lib/session.server";
import { Member } from "~/models/member.server";
import { MemberMembership } from "~/models/member-membership.server";
import { PageHeader } from "~/components/layout/page-header";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { SearchInput } from "~/components/ui/search-input";
import { Avatar } from "~/components/ui/avatar";
import { Badge, MembershipStatusBadge } from "~/components/ui/badge";
import { EmptyState } from "~/components/ui/empty-state";
import { formatShortDate, daysUntilExpiration } from "~/lib/utils/dates";

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  const query: any = { activo: true };

  if (search) {
    // @ts-ignore - Compatibility
    query.$or = [
      { nombre: { $regex: search, $options: "i" } },
      { apellidos: { $regex: search, $options: "i" } },
      { numeroMiembro: { $regex: search, $options: "i" } },
      { telefono: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [members, total] = await Promise.all([
    // @ts-ignore - Drizzle compatibility
    // @ts-ignore - Drizzle compatibility
    Member.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    // @ts-ignore - Drizzle compatibility
    Member.countDocuments(query),
  ]);

  // Obtener membresías activas para cada miembro
  const membersWithMembership = await Promise.all(
    // @ts-ignore - Compatibility
    members.map(async (member: any) => {
      const membership = await MemberMembership.findOne({
        // @ts-ignore - Compatibility
        memberId: member.id,
        activa: "activa",
      })
    // @ts-ignore - Drizzle compatibility
        .populate("membershipTypeId")
    // @ts-ignore - Drizzle compatibility
        .sort({ fechaFin: -1 })
    // @ts-ignore - Drizzle compatibility
        .lean() as { activa: string; membershipTypeId?: { nombre: string }; fechaFin: Date } | null;

      return {
        // @ts-ignore - Compatibility
        id: member.id.toString(),
        numeroMiembro: member.numeroMiembro,
        nombre: member.nombre,
        apellidos: member.apellidos,
        email: member.email,
        telefono: member.telefono,
        foto: member.foto,
        membership: membership
          ? {
              activa: membership.estado,
              tipo: membership.membershipTypeId?.nombre || "N/A",
              fechaFin: membership.fechaFin.toISOString(),
              daysLeft: daysUntilExpiration(membership.fechaFin),
            }
          : null,
      };
    })
  );

  return {
    members: membersWithMembership,
    search,
    pagination: {
      page,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
}

export default function MiembrosIndex() {
  const { members, search, pagination } = useLoaderData<typeof loader>();

  return (
    <div>
      <PageHeader
        title="Miembros"
        description={`${pagination.total} miembros registrados`}
        action={
          <Link to="/miembros/nuevo">
            <Button>
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
              Nuevo Miembro
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-4">
          <Form method="get" className="mb-4">
            <SearchInput
              name="search"
              placeholder="Buscar por nombre, numero, telefono o email..."
              defaultValue={search}
            />
          </Form>

          {members.length === 0 ? (
            <EmptyState
              icon={
                <svg
                  className="w-12 h-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              }
              title={search ? "Sin resultados" : "No hay miembros"}
              description={
                search
                  ? `No se encontraron miembros con "${search}"`
                  : "Comienza agregando tu primer miembro"
              }
              action={
                !search && (
                  <Link to="/miembros/nuevo">
                    <Button>Agregar Miembro</Button>
                  </Link>
                )
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto -mx-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">
                        Miembro
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">
                        Contacto
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">
                        Membresia
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">
                        Vencimiento
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500 text-sm">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {members.map((member) => (
                      // @ts-ignore - Compatibility
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Link
                            // @ts-ignore - Compatibility
                            to={`/miembros/${member.id}`}
                            className="flex items-center gap-3"
                          >
                            <Avatar
                              name={`${member.nombre} ${member.apellidos}`}
                              src={member.foto}
                              size="md"
                            />
                            <div>
                              <p className="font-medium text-gray-900">
                                {member.nombre} {member.apellidos}
                              </p>
                              <p className="text-sm text-gray-500">
                                #{member.numeroMiembro}
                              </p>
                            </div>
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-gray-900">{member.telefono}</p>
                          {member.email && (
                            <p className="text-sm text-gray-500">{member.email}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {member.membership ? (
                            <div>
                              <MembershipStatusBadge status={member.membership.estado as "activa" | "vencida" | "cancelada"} />
                              <p className="text-sm text-gray-500 mt-1">
                                {member.membership.tipo}
                              </p>
                            </div>
                          ) : (
                            <Badge variant="danger">Sin membresia</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {member.membership ? (
                            <div>
                              <p className="text-gray-900">
                                {formatShortDate(member.membership.fechaFin)}
                              </p>
                              {member.membership.daysLeft <= 7 && member.membership.daysLeft >= 0 && (
                                <p className="text-sm text-amber-600">
                                  {member.membership.daysLeft === 0
                                    ? "Vence hoy"
                                    : `${member.membership.daysLeft} dias`}
                                </p>
                              )}
                              {member.membership.daysLeft < 0 && (
                                <p className="text-sm text-red-600">Vencida</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            // @ts-ignore - Compatibility
                            to={`/miembros/${member.id}`}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            Ver detalle
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Mostrando pagina {pagination.page} de {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    {pagination.hasPrev && (
                      <Link
                        to={`?page=${pagination.page - 1}${search ? `&search=${search}` : ""}`}
                      >
                        <Button variant="outline" size="sm">
                          Anterior
                        </Button>
                      </Link>
                    )}
                    {pagination.hasNext && (
                      <Link
                        to={`?page=${pagination.page + 1}${search ? `&search=${search}` : ""}`}
                      >
                        <Button variant="outline" size="sm">
                          Siguiente
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
