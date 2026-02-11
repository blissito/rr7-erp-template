// @ts-nocheck
import { Link, useLoaderData, Form, useActionData, redirect } from "react-router";
import type { Route } from "./+types/detalle";
import { requireUser } from "~/lib/session.server";
import { Instructor } from "~/models/instructor.server";
import { Schedule } from "~/models/schedule.server";
import { PageHeader } from "~/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Avatar } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Alert } from "~/components/ui/alert";
import { formatPhone } from "~/lib/utils/format";
import { APP_CONFIG } from "~/config/app.config";

const DAYS = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

export async function loader({ params }: Route.LoaderArgs) {

    // @ts-ignore - Drizzle compatibility
  const instructor = await Instructor.findById(params.id).lean() as {
    _id: { toString(): string };
    nombre: string;
    apellidos: string;
    telefono: string;
    email?: string;
    especialidades?: string[];
  } | null;
  if (!instructor) {
    throw new Response("Instructor no encontrado", { status: 404 });
  }

  const schedules = await Schedule.find({
    // @ts-ignore - Compatibility
    instructorId: params.id,
    activo: true,
  })
    // @ts-ignore - Drizzle compatibility
    .populate("classId")
    // @ts-ignore - Drizzle compatibility
    .sort({ diaSemana: 1, horaInicio: 1 })
    // @ts-ignore - Drizzle compatibility
    .lean();

  return {
    instructor: {
      id: instructor.id.toString(),
      nombre: instructor.nombre,
      apellidos: instructor.apellidos,
      telefono: instructor.telefono,
      email: instructor.email,
      especialidades: instructor.especialidades || [],
    },
    // @ts-ignore - Compatibility
    schedules: schedules.map((s: any) => ({
      id: s.id.toString(),
      className: s.classId?.nombre || "Clase eliminada",
      // @ts-ignore - Compatibility
      classId: s.classId?.id.toString(),
      diaSemana: s.diaSemana,
      horaInicio: s.horaInicio,
      horaFin: s.horaFin,
      carril: s.carril,
    })),
  };
}

type ActionResult = { success: true; message: string } | null;

export async function action({ request, params }: Route.ActionArgs): Promise<ActionResult | Response> {
  await requireUser(request);

  const formData = await request.formData();
  const action = formData.get("_action");

  if (action === "delete") {
    // @ts-ignore - Drizzle compatibility
    await Instructor.findByIdAndUpdate(params.id, { activo: false });
    return redirect("/instructores");
  }

  return null;
}

export default function InstructorDetalle() {
  const { instructor, schedules } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div>
      <PageHeader
        title={`${instructor.nombre} ${instructor.apellidos}`}
        description="Instructor"
        action={
          <Link to={`/instructores/${instructor.id}/editar`}>
            <Button variant="outline">Editar</Button>
          </Link>
        }
      />

      {actionData?.success && (
        <Alert variant="success" className="mb-6">
          {actionData.message}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del instructor */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar
                name={`${instructor.nombre} ${instructor.apellidos}`}
                size="xl"
              />
              <h2 className="mt-4 text-xl font-bold text-gray-900">
                {instructor.nombre} {instructor.apellidos}
              </h2>

              <div className="mt-4 w-full space-y-3">
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span>{formatPhone(instructor.telefono)}</span>
                </div>

                {instructor.email && (
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span>{instructor.email}</span>
                  </div>
                )}
              </div>

              {instructor.especialidades.length > 0 && (
                <div className="mt-4 w-full">
                  <p className="text-sm text-gray-500 mb-2">Especialidades:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {instructor.especialidades.map((esp: string) => (
                      <Badge key={esp} variant="info">
                        {esp}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 w-full pt-4 border-t border-gray-200">
                <Form method="post">
                  <input type="hidden" name="_action" value="delete" />
                  <Button
                    type="submit"
                    variant="danger"
                    className="w-full"
                    onClick={(e) => {
                      if (!confirm("¿Seguro que deseas eliminar este instructor?")) {
                        e.preventDefault();
                      }
                    }}
                  >
                    Eliminar Instructor
                  </Button>
                </Form>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Horarios asignados */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Horarios Asignados ({schedules.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {schedules.length === 0 ? (
                <p className="p-6 text-center text-gray-500">
                  No tiene horarios asignados
                </p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">
                        Dia
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">
                        Horario
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">
                        Clase
                      </th>
                      {APP_CONFIG.domainFields.scheduleCarril && (
                        <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">
                          Carril
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {schedules.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">
                          {DAYS[s.diaSemana]}
                        </td>
                        <td className="py-3 px-4">
                          {s.horaInicio} - {s.horaFin}
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            to={`/clases/${s.classId}`}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            {s.className}
                          </Link>
                        </td>
                        {APP_CONFIG.domainFields.scheduleCarril && (
                          <td className="py-3 px-4">
                            {s.carril ? (
                              <Badge variant="info">Carril {s.carril}</Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
