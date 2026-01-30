import { Form, redirect, useLoaderData, useActionData, useNavigation, Link } from "react-router";
import type { Route } from "./+types/editar";
import { connectDB } from "~/lib/db.server";
import { requireUser } from "~/lib/session.server";
import { Instructor } from "~/models/instructor.server";
import { instructorSchema } from "~/lib/utils/validators";
import { PageHeader } from "~/components/layout/page-header";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Alert } from "~/components/ui/alert";

export async function loader({ params }: Route.LoaderArgs) {
  await connectDB();

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

  return {
    instructor: {
      id: instructor._id.toString(),
      nombre: instructor.nombre,
      apellidos: instructor.apellidos,
      telefono: instructor.telefono,
      email: instructor.email || "",
      especialidades: (instructor.especialidades || []).join(", "),
    },
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  await requireUser(request);
  await connectDB();

  const formData = await request.formData();
  const especialidadesRaw = formData.get("especialidades") as string;

  const data = {
    nombre: formData.get("nombre") as string,
    apellidos: formData.get("apellidos") as string,
    telefono: formData.get("telefono") as string,
    email: formData.get("email") as string,
    especialidades: especialidadesRaw
      ? especialidadesRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
  };

  const result = instructorSchema.safeParse(data);
  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.errors.forEach((err) => {
      if (err.path[0]) {
        errors[err.path[0] as string] = err.message;
      }
    });
    return { errors };
  }

  await Instructor.findByIdAndUpdate(params.id, {
    ...result.data,
    email: result.data.email || undefined,
  });

  return redirect(`/instructores/${params.id}`);
}

export default function EditarInstructor() {
  const { instructor } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Editar Instructor"
        description={`${instructor.nombre} ${instructor.apellidos}`}
      />

      <Card>
        <Form method="post">
          <CardContent className="space-y-4">
            {actionData?.errors?.general && (
              <Alert variant="error">{actionData.errors.general}</Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nombre"
                name="nombre"
                defaultValue={instructor.nombre}
                required
                error={actionData?.errors?.nombre}
              />
              <Input
                label="Apellidos"
                name="apellidos"
                defaultValue={instructor.apellidos}
                required
                error={actionData?.errors?.apellidos}
              />
            </div>

            <Input
              label="Telefono"
              name="telefono"
              type="tel"
              defaultValue={instructor.telefono}
              required
              error={actionData?.errors?.telefono}
            />

            <Input
              label="Email (opcional)"
              name="email"
              type="email"
              defaultValue={instructor.email}
              error={actionData?.errors?.email}
            />

            <Input
              label="Especialidades (separadas por coma)"
              name="especialidades"
              defaultValue={instructor.especialidades}
              hint="Ejemplo: natacion, aquaerobics"
              error={actionData?.errors?.especialidades}
            />
          </CardContent>

          <CardFooter className="flex justify-end gap-3">
            <Link to={`/instructores/${instructor.id}`}>
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" isLoading={isSubmitting}>
              Guardar Cambios
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );
}
