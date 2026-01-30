import { Link, useLoaderData, Form } from "react-router";
import type { Route } from "./+types/index";
import { connectDB } from "~/lib/db.server";
import { requireUser } from "~/lib/session.server";
import { Class } from "~/models/class.server";
import { Schedule } from "~/models/schedule.server";
import { Enrollment } from "~/models/enrollment.server";
import { PageHeader } from "~/components/layout/page-header";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { SearchInput } from "~/components/ui/search-input";
import { Badge } from "~/components/ui/badge";
import { EmptyState } from "~/components/ui/empty-state";

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  await connectDB();

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";

  const query: any = { activo: true };

  if (search) {
    query.$or = [
      { nombre: { $regex: search, $options: "i" } },
      { descripcion: { $regex: search, $options: "i" } },
    ];
  }

  const classes = await Class.find(query).sort({ nombre: 1 }).lean();

  // Obtener conteo de horarios e inscripciones para cada clase
  const classesWithStats = await Promise.all(
    classes.map(async (cls: any) => {
      const schedules = await Schedule.find({ classId: cls._id, activo: true });
      const scheduleIds = schedules.map((s) => s._id);
      const enrollments = await Enrollment.countDocuments({
        scheduleId: { $in: scheduleIds },
        estado: "inscrito",
      });

      return {
        id: cls._id.toString(),
        nombre: cls.nombre,
        descripcion: cls.descripcion,
        duracionMinutos: cls.duracionMinutos,
        capacidadMaxima: cls.capacidadMaxima,
        nivel: cls.nivel,
        edadMinima: cls.edadMinima,
        edadMaxima: cls.edadMaxima,
        scheduleCount: schedules.length,
        enrollmentCount: enrollments,
      };
    })
  );

  return {
    classes: classesWithStats,
    search,
  };
}

const NIVEL_LABELS = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

const NIVEL_COLORS = {
  principiante: "success",
  intermedio: "warning",
  avanzado: "danger",
} as const;

export default function ClasesIndex() {
  const { classes, search } = useLoaderData<typeof loader>();

  return (
    <div>
      <PageHeader
        title="Clases"
        description="Catalogo de clases disponibles"
        action={
          <Link to="/clases/nueva">
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
              Nueva Clase
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-4">
          <Form method="get" className="mb-4">
            <SearchInput
              name="search"
              placeholder="Buscar clases..."
              defaultValue={search}
            />
          </Form>

          {classes.length === 0 ? (
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              }
              title={search ? "Sin resultados" : "No hay clases"}
              description={
                search
                  ? `No se encontraron clases con "${search}"`
                  : "Comienza agregando tu primera clase"
              }
              action={
                !search && (
                  <Link to="/clases/nueva">
                    <Button>Agregar Clase</Button>
                  </Link>
                )
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((cls) => (
                <Link
                  key={cls.id}
                  to={`/clases/${cls.id}`}
                  className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{cls.nombre}</h3>
                    {cls.nivel && (
                      <Badge variant={NIVEL_COLORS[cls.nivel as keyof typeof NIVEL_COLORS]} size="sm">
                        {NIVEL_LABELS[cls.nivel as keyof typeof NIVEL_LABELS]}
                      </Badge>
                    )}
                  </div>

                  {cls.descripcion && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      {cls.descripcion}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {cls.duracionMinutos} min
                    </span>
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Max {cls.capacidadMaxima}
                    </span>
                  </div>

                  {(cls.edadMinima || cls.edadMaxima) && (
                    <p className="text-sm text-gray-500 mt-2">
                      Edad:{" "}
                      {cls.edadMinima && cls.edadMaxima
                        ? `${cls.edadMinima}-${cls.edadMaxima} anios`
                        : cls.edadMinima
                        ? `${cls.edadMinima}+ anios`
                        : `Hasta ${cls.edadMaxima} anios`}
                    </p>
                  )}

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {cls.scheduleCount} horarios
                    </span>
                    <span className="text-primary-600 font-medium">
                      {cls.enrollmentCount} inscritos
                    </span>
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
