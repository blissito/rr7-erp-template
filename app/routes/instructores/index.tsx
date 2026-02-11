// @ts-nocheck
import { Link, useLoaderData, Form } from "react-router";
import type { Route } from "./+types/index";
import { requireUser } from "~/lib/session.server";
import { Instructor } from "~/models/instructor.server";
import { Schedule } from "~/models/schedule.server";
import { PageHeader } from "~/components/layout/page-header";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { SearchInput } from "~/components/ui/search-input";
import { Avatar } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { EmptyState } from "~/components/ui/empty-state";

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";

  const query: any = { activo: true };

  if (search) {
    // @ts-ignore - Compatibility
    query.$or = [
      { nombre: { $regex: search, $options: "i" } },
      { apellidos: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

    // @ts-ignore - Drizzle compatibility
    // @ts-ignore - Drizzle compatibility
  const instructors = await Instructor.find(query).sort({ nombre: 1 }).lean();

  // Contar clases asignadas
  const instructorsWithStats = await Promise.all(
    // @ts-ignore - Compatibility
    instructors.map(async (inst: any) => {
      // @ts-ignore - Drizzle compatibility
      const scheduleCount = await Schedule.countDocuments({
        // @ts-ignore - Compatibility
        instructorId: inst.id,
        activo: true,
      });

      return {
        id: inst.id.toString(),
        nombre: inst.nombre,
        apellidos: inst.apellidos,
        telefono: inst.telefono,
        email: inst.email,
        especialidades: inst.especialidades || [],
        scheduleCount,
      };
    })
  );

  return {
    instructors: instructorsWithStats,
    search,
  };
}

export default function InstructoresIndex() {
  const { instructors, search } = useLoaderData<typeof loader>();

  return (
    <div>
      <PageHeader
        title="Instructores"
        description={`${instructors.length} instructores registrados`}
        action={
          <Link to="/instructores/nuevo">
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
              Nuevo Instructor
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-4">
          <Form method="get" className="mb-4">
            <SearchInput
              name="search"
              placeholder="Buscar instructores..."
              defaultValue={search}
            />
          </Form>

          {instructors.length === 0 ? (
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              }
              title={search ? "Sin resultados" : "No hay instructores"}
              description={
                search
                  ? `No se encontraron instructores con "${search}"`
                  : "Comienza agregando tu primer instructor"
              }
              action={
                !search && (
                  <Link to="/instructores/nuevo">
                    <Button>Agregar Instructor</Button>
                  </Link>
                )
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {instructors.map((inst) => (
                <Link
                  key={inst.id}
                  to={`/instructores/${inst.id}`}
                  className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <Avatar
                    name={`${inst.nombre} ${inst.apellidos}`}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {inst.nombre} {inst.apellidos}
                    </h3>
                    <p className="text-sm text-gray-500">{inst.telefono}</p>
                    {inst.especialidades.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {inst.especialidades.slice(0, 2).map((esp: string) => (
                          <Badge key={esp} variant="info" size="sm">
                            {esp}
                          </Badge>
                        ))}
                        {inst.especialidades.length > 2 && (
                          <Badge variant="default" size="sm">
                            +{inst.especialidades.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary-600">
                      {inst.scheduleCount}
                    </span>
                    <p className="text-xs text-gray-500">clases</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
