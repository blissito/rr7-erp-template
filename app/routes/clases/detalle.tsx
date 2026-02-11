// @ts-nocheck
import { Link, useLoaderData, Form, useActionData } from "react-router";
import type { Route } from "./+types/detalle";
import { requireUser } from "~/lib/session.server";
import { Class } from "~/models/class.server";
import { Schedule } from "~/models/schedule.server";
import { Enrollment } from "~/models/enrollment.server";
import { PageHeader } from "~/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Alert } from "~/components/ui/alert";
import { Avatar } from "~/components/ui/avatar";
import { redirect } from "react-router";
import { APP_CONFIG } from "~/config/app.config";

const DAYS = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

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

export async function loader({ params }: Route.LoaderArgs) {

    // @ts-ignore - Drizzle compatibility
  const cls = await Class.findById(params.id).lean() as {
    _id: { toString(): string };
    nombre: string;
    descripcion?: string;
    duracionMinutos: number;
    capacidadMaxima: number;
    nivel?: "principiante" | "intermedio" | "avanzado";
    edadMinima?: number;
    edadMaxima?: number;
  } | null;
  if (!cls) {
    throw new Response("Clase no encontrada", { status: 404 });
  }

  // Horarios de la clase
  // @ts-ignore - Compatibility
  const schedules = await Schedule.find({ classId: params.id, activo: true })
    // @ts-ignore - Drizzle compatibility
    .populate("instructorId")
    // @ts-ignore - Drizzle compatibility
    .sort({ diaSemana: 1, horaInicio: 1 })
    // @ts-ignore - Drizzle compatibility
    .lean();

  // Inscripciones por horario
  const schedulesWithEnrollments = await Promise.all(
    // @ts-ignore - Compatibility
    schedules.map(async (s: any) => {
      const enrollments = await Enrollment.find({
        // @ts-ignore - Compatibility
        scheduleId: s.id,
        activa: "inscrito",
      })
    // @ts-ignore - Drizzle compatibility
        .populate("memberId")
    // @ts-ignore - Drizzle compatibility
        .lean();

      return {
        id: s.id.toString(),
        diaSemana: s.diaSemana,
        horaInicio: s.horaInicio,
        horaFin: s.horaFin,
        carril: s.carril,
        instructor: s.instructorId
          ? {
              id: s.instructorId.id.toString(),
              nombre: `${s.instructorId.nombre} ${s.instructorId.apellidos}`,
            }
          : null,
        // @ts-ignore - Compatibility
        enrollments: enrollments.map((e: any) => ({
          id: e.id.toString(),
          memberName: e.memberId
            ? `${e.memberId.nombre} ${e.memberId.apellidos}`
            : "Miembro eliminado",
          memberPhoto: e.memberId?.foto,
          // @ts-ignore - Compatibility
          memberId: e.memberId?.id.toString(),
        })),
        enrollmentCount: enrollments.length,
      };
    })
  );

  return {
    cls: {
      id: cls.id.toString(),
      nombre: cls.nombre,
      descripcion: cls.descripcion,
      duracionMinutos: cls.duracionMinutos,
      capacidadMaxima: cls.capacidadMaxima,
      nivel: cls.nivel,
      edadMinima: cls.edadMinima,
      edadMaxima: cls.edadMaxima,
    },
    schedules: schedulesWithEnrollments,
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  await requireUser(request);

  const formData = await request.formData();
  const action = formData.get("_action");

  if (action === "delete") {
    // @ts-ignore - Drizzle compatibility
    await Class.findByIdAndUpdate(params.id, { activo: false });
    return redirect("/clases");
  }

  if (action === "deleteSchedule") {
    const scheduleId = formData.get("scheduleId");
    // @ts-ignore - Drizzle compatibility
    await Schedule.findByIdAndUpdate(scheduleId, { activo: false });
    return { success: true, message: "Horario eliminado" };
  }

  if (action === "removeEnrollment") {
    const enrollmentId = formData.get("enrollmentId");
    // @ts-ignore - Drizzle compatibility
    await Enrollment.findByIdAndUpdate(enrollmentId, { activa: "cancelado" });
    return { success: true, message: "Inscripcion cancelada" };
  }

  return null;
}

export default function ClaseDetalle() {
  const { cls, schedules } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const totalEnrollments = schedules.reduce(
    (acc, s) => acc + s.enrollmentCount,
    0
  );

  return (
    <div>
      <PageHeader
        title={cls.nombre}
        description={cls.descripcion}
        action={
          <div className="flex gap-2">
            <Link to="/horarios/nuevo">
              <Button variant="secondary">Agregar Horario</Button>
            </Link>
            <Link to={`/clases/${cls.id}/editar`}>
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
        {/* Información de la clase */}
        <Card>
          <CardHeader>
            <CardTitle>Informacion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Duracion</span>
              <span className="font-medium">{cls.duracionMinutos} minutos</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Capacidad</span>
              <span className="font-medium">{cls.capacidadMaxima} personas</span>
            </div>
            {cls.nivel && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Nivel</span>
                <Badge variant={NIVEL_COLORS[cls.nivel as keyof typeof NIVEL_COLORS]}>
                  {NIVEL_LABELS[cls.nivel as keyof typeof NIVEL_LABELS]}
                </Badge>
              </div>
            )}
            {(cls.edadMinima || cls.edadMaxima) && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Rango de edad</span>
                <span className="font-medium">
                  {cls.edadMinima && cls.edadMaxima
                    ? `${cls.edadMinima} - ${cls.edadMaxima} anios`
                    : cls.edadMinima
                    ? `${cls.edadMinima}+ anios`
                    : `Hasta ${cls.edadMaxima} anios`}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Total inscritos</span>
              <span className="font-medium text-primary-600">{totalEnrollments}</span>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Form method="post">
                <input type="hidden" name="_action" value="delete" />
                <Button
                  type="submit"
                  variant="danger"
                  className="w-full"
                  onClick={(e) => {
                    if (!confirm("¿Seguro que deseas eliminar esta clase?")) {
                      e.preventDefault();
                    }
                  }}
                >
                  Eliminar Clase
                </Button>
              </Form>
            </div>
          </CardContent>
        </Card>

        {/* Horarios */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Horarios ({schedules.length})</h2>

          {schedules.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500 mb-4">
                  No hay horarios programados para esta clase
                </p>
                <Link to="/horarios/nuevo">
                  <Button>Agregar Horario</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            schedules.map((schedule) => (
              <Card key={schedule.id}>
                <CardHeader className="flex flex-row items-center justify-between py-3">
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[80px]">
                      <p className="text-lg font-bold text-primary-600">
                        {schedule.horaInicio}
                      </p>
                      <p className="text-sm text-gray-500">
                        {DAYS[schedule.diaSemana]}
                      </p>
                    </div>
                    <div>
                      {schedule.instructor && (
                        <p className="font-medium">{schedule.instructor.nombre}</p>
                      )}
                      {APP_CONFIG.domainFields.scheduleCarril && schedule.carril && (
                        <p className="text-sm text-gray-500">
                          Carril {schedule.carril}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={
                        schedule.enrollmentCount >= cls.capacidadMaxima
                          ? "danger"
                          : schedule.enrollmentCount >= cls.capacidadMaxima * 0.8
                          ? "warning"
                          : "success"
                      }
                    >
                      {schedule.enrollmentCount}/{cls.capacidadMaxima}
                    </Badge>
                    <Form method="post">
                      <input type="hidden" name="_action" value="deleteSchedule" />
                      <input type="hidden" name="scheduleId" value={schedule.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          if (!confirm("¿Eliminar este horario?")) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <svg
                          className="w-4 h-4 text-red-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </Button>
                    </Form>
                  </div>
                </CardHeader>

                {schedule.enrollments.length > 0 && (
                  <CardContent className="border-t border-gray-100 pt-3">
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      Inscritos:
                    </p>
                    <ul className="space-y-2">
                      {schedule.enrollments.map((e) => (
                        <li
                          key={e.id}
                          className="flex items-center justify-between"
                        >
                          <Link
                            to={`/miembros/${e.memberId}`}
                            className="flex items-center gap-2 hover:text-primary-600"
                          >
                            <Avatar
                              name={e.memberName}
                              src={e.memberPhoto}
                              size="sm"
                            />
                            <span className="text-sm">{e.memberName}</span>
                          </Link>
                          <Form method="post">
                            <input
                              type="hidden"
                              name="_action"
                              value="removeEnrollment"
                            />
                            <input
                              type="hidden"
                              name="enrollmentId"
                              value={e.id}
                            />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                              onClick={(ev) => {
                                if (!confirm("¿Cancelar esta inscripcion?")) {
                                  ev.preventDefault();
                                }
                              }}
                            >
                              Cancelar
                            </Button>
                          </Form>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
