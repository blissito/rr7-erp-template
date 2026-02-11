// @ts-nocheck
import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/horarios";
import { requireUser } from "~/lib/session.server";
import { Schedule } from "~/models/schedule.server";
import { Enrollment } from "~/models/enrollment.server";
import { PageHeader } from "~/components/layout/page-header";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils/cn";
import { APP_CONFIG } from "~/config/app.config";

const DAYS = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
const HOURS = Array.from({ length: 14 }, (_, i) => `${(i + 6).toString().padStart(2, "0")}:00`);

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);

  const schedules = await Schedule.find({ activo: true })
    // @ts-ignore - Drizzle compatibility
    .populate("classId")
    // @ts-ignore - Drizzle compatibility
    .populate("instructorId")
    // @ts-ignore - Drizzle compatibility
    .lean();

  // Obtener inscripciones para cada horario
  const schedulesWithEnrollments = await Promise.all(
    // @ts-ignore - Compatibility
    schedules.map(async (s: any) => {
      // @ts-ignore - Drizzle compatibility
      const enrollmentCount = await Enrollment.countDocuments({
        // @ts-ignore - Compatibility
        scheduleId: s.id,
        activa: "inscrito",
      });

      return {
        id: s.id.toString(),
        className: s.classId?.nombre || "Clase eliminada",
        // @ts-ignore - Compatibility
        classId: s.classId?.id.toString(),
        capacidadMaxima: s.classId?.capacidadMaxima || 0,
        instructorName: s.instructorId
          ? `${s.instructorId.nombre} ${s.instructorId.apellidos}`
          : "Sin instructor",
        diaSemana: s.diaSemana,
        horaInicio: s.horaInicio,
        horaFin: s.horaFin,
        carril: s.carril,
        enrollmentCount,
      };
    })
  );

  // Organizar por día de la semana
  const schedulesByDay: Record<number, typeof schedulesWithEnrollments> = {};
  for (let i = 0; i < 7; i++) {
    schedulesByDay[i] = schedulesWithEnrollments
      .filter((s) => s.diaSemana === i)
      // @ts-ignore - Drizzle compatibility
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }

  return { schedulesByDay };
}

function getTimeSlot(time: string): number {
  const [hours] = time.split(":").map(Number);
  return hours - 6; // Offset desde las 6am
}

function getTimeSpan(start: string, end: string): number {
  const startHour = parseInt(start.split(":")[0]);
  const endHour = parseInt(end.split(":")[0]);
  return endHour - startHour;
}

export default function Horarios() {
  const { schedulesByDay } = useLoaderData<typeof loader>();

  return (
    <div>
      <PageHeader
        title="Horarios"
        description="Calendario semanal de clases"
        action={
          <Link to="/horarios/nuevo">
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
              Nuevo Horario
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Header con días */}
            <div className="grid grid-cols-8 border-b border-gray-200">
              <div className="p-3 bg-gray-50 font-medium text-gray-500 text-sm">
                Hora
              </div>
              {DAYS.map((day, i) => (
                <div
                  key={day}
                  className={cn(
                    "p-3 font-medium text-sm text-center",
                    i === new Date().getDay()
                      ? "bg-primary-50 text-primary-700"
                      : "bg-gray-50 text-gray-500"
                  )}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grid de horarios */}
            <div className="grid grid-cols-8">
              {/* Columna de horas */}
              <div className="border-r border-gray-200">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="h-16 px-3 py-1 text-sm text-gray-500 border-b border-gray-100"
                  >
                    {hour}
                  </div>
                ))}
              </div>

              {/* Columnas por día */}
              {DAYS.map((_, dayIndex) => (
                <div key={dayIndex} className="relative border-r border-gray-200">
                  {/* Grid de fondo */}
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="h-16 border-b border-gray-100"
                    />
                  ))}

                  {/* Clases */}
                  {schedulesByDay[dayIndex]?.map((schedule) => {
                    const topSlot = getTimeSlot(schedule.horaInicio);
                    const span = getTimeSpan(schedule.horaInicio, schedule.horaFin);
                    const isFull = schedule.enrollmentCount >= schedule.capacidadMaxima;

                    return (
                      <Link
                        key={schedule.id}
                        to={`/clases/${schedule.classId}`}
                        className={cn(
                          "absolute left-1 right-1 rounded-lg p-2 text-xs overflow-hidden",
                          "hover:shadow-md transition-shadow cursor-pointer",
                          isFull
                            ? "bg-red-100 border border-red-200"
                            : "bg-primary-100 border border-primary-200"
                        )}
                        style={{
                          top: `${topSlot * 64 + 4}px`,
                          height: `${span * 64 - 8}px`,
                        }}
                      >
                        <p className="font-medium text-gray-900 truncate">
                          {schedule.className}
                        </p>
                        <p className="text-gray-600 truncate">
                          {schedule.instructorName}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-gray-500">
                            {schedule.horaInicio}
                          </span>
                          <Badge
                            variant={isFull ? "danger" : "success"}
                            size="sm"
                          >
                            {schedule.enrollmentCount}/{schedule.capacidadMaxima}
                          </Badge>
                        </div>
                        {APP_CONFIG.domainFields.scheduleCarril && schedule.carril && (
                          <span className="text-gray-500">
                            Carril {schedule.carril}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vista alternativa en lista */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {DAYS.map((day, dayIndex) => (
          <Card key={day}>
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="font-medium text-gray-900">{day}</h3>
            </div>
            <CardContent className="p-0">
              {schedulesByDay[dayIndex]?.length === 0 ? (
                <p className="p-4 text-sm text-gray-500 text-center">
                  Sin clases
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {schedulesByDay[dayIndex]?.map((s) => (
                    <li key={s.id}>
                      <Link
                        to={`/clases/${s.classId}`}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50"
                      >
                        <div className="text-center min-w-[50px]">
                          <p className="text-sm font-bold text-primary-600">
                            {s.horaInicio}
                          </p>
                          <p className="text-xs text-gray-400">{s.horaFin}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {s.className}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {s.instructorName}
                          </p>
                        </div>
                        <Badge
                          variant={
                            s.enrollmentCount >= s.capacidadMaxima
                              ? "danger"
                              : "success"
                          }
                          size="sm"
                        >
                          {s.enrollmentCount}/{s.capacidadMaxima}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
