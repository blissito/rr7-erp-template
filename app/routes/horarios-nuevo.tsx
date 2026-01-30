import { Form, redirect, useLoaderData, useActionData, useNavigation, Link } from "react-router";
import type { Route } from "./+types/horarios-nuevo";
import { connectDB } from "~/lib/db.server";
import { requireUser } from "~/lib/session.server";
import { Class } from "~/models/class.server";
import { Instructor } from "~/models/instructor.server";
import { Schedule } from "~/models/schedule.server";
import { scheduleSchema } from "~/lib/utils/validators";
import { PageHeader } from "~/components/layout/page-header";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { Alert } from "~/components/ui/alert";
import { APP_CONFIG } from "~/config/app.config";

const DAYS = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  await connectDB();

  const [classes, instructors] = await Promise.all([
    Class.find({ activo: true }).sort({ nombre: 1 }).lean(),
    Instructor.find({ activo: true }).sort({ nombre: 1 }).lean(),
  ]);

  return {
    classes: classes.map((c: any) => ({
      id: c._id.toString(),
      nombre: c.nombre,
      duracionMinutos: c.duracionMinutos,
    })),
    instructors: instructors.map((i: any) => ({
      id: i._id.toString(),
      nombre: `${i.nombre} ${i.apellidos}`,
    })),
  };
}

export async function action({ request }: Route.ActionArgs) {
  await requireUser(request);
  await connectDB();

  const formData = await request.formData();
  const data = {
    classId: formData.get("classId") as string,
    instructorId: formData.get("instructorId") as string,
    diaSemana: formData.get("diaSemana") as string,
    horaInicio: formData.get("horaInicio") as string,
    horaFin: formData.get("horaFin") as string,
    carril: formData.get("carril") as string || undefined,
  };

  const result = scheduleSchema.safeParse(data);
  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.errors.forEach((err) => {
      if (err.path[0]) {
        errors[err.path[0] as string] = err.message;
      }
    });
    return { errors };
  }

  // Verificar conflictos de horario
  const existingSchedule = await Schedule.findOne({
    instructorId: result.data.instructorId,
    diaSemana: result.data.diaSemana,
    activo: true,
    $or: [
      {
        horaInicio: { $lt: result.data.horaFin },
        horaFin: { $gt: result.data.horaInicio },
      },
    ],
  });

  if (existingSchedule) {
    return {
      errors: {
        general: "El instructor ya tiene una clase programada en este horario",
      },
    };
  }

  // Si hay carril, verificar que no esté ocupado
  if (result.data.carril) {
    const existingCarril = await Schedule.findOne({
      carril: result.data.carril,
      diaSemana: result.data.diaSemana,
      activo: true,
      $or: [
        {
          horaInicio: { $lt: result.data.horaFin },
          horaFin: { $gt: result.data.horaInicio },
        },
      ],
    });

    if (existingCarril) {
      return {
        errors: {
          carril: "Este carril ya esta ocupado en este horario",
        },
      };
    }
  }

  await Schedule.create({
    ...result.data,
    activo: true,
  });

  return redirect("/horarios");
}

export default function NuevoHorario() {
  const { classes, instructors } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Nuevo Horario"
        description="Programa una clase en el calendario"
      />

      <Card>
        <Form method="post">
          <CardContent className="space-y-4">
            {actionData?.errors?.general && (
              <Alert variant="error">{actionData.errors.general}</Alert>
            )}

            <Select
              label="Clase"
              name="classId"
              required
              error={actionData?.errors?.classId}
            >
              <option value="">Selecciona una clase</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.nombre} ({cls.duracionMinutos} min)
                </option>
              ))}
            </Select>

            <Select
              label="Instructor"
              name="instructorId"
              required
              error={actionData?.errors?.instructorId}
            >
              <option value="">Selecciona un instructor</option>
              {instructors.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.nombre}
                </option>
              ))}
            </Select>

            <Select
              label="Dia de la Semana"
              name="diaSemana"
              required
              error={actionData?.errors?.diaSemana}
            >
              <option value="">Selecciona un dia</option>
              {DAYS.map((day, index) => (
                <option key={day} value={index}>
                  {day}
                </option>
              ))}
            </Select>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Hora de Inicio"
                name="horaInicio"
                type="time"
                required
                error={actionData?.errors?.horaInicio}
              />
              <Input
                label="Hora de Fin"
                name="horaFin"
                type="time"
                required
                error={actionData?.errors?.horaFin}
              />
            </div>

            {APP_CONFIG.domainFields.scheduleCarril && (
              <Input
                label="Carril (opcional)"
                name="carril"
                type="number"
                min="1"
                placeholder="Numero de carril"
                error={actionData?.errors?.carril}
              />
            )}
          </CardContent>

          <CardFooter className="flex justify-end gap-3">
            <Link to="/horarios">
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" isLoading={isSubmitting}>
              Guardar Horario
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );
}
