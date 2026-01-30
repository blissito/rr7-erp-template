import { Form, redirect, useActionData, useNavigation, Link } from "react-router";
import type { Route } from "./+types/nuevo";
import { connectDB } from "~/lib/db.server";
import { requireUser } from "~/lib/session.server";
import { Instructor } from "~/models/instructor.server";
import { instructorSchema } from "~/lib/utils/validators";
import { PageHeader } from "~/components/layout/page-header";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Alert } from "~/components/ui/alert";

export async function action({ request }: Route.ActionArgs) {
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

  const instructor = await Instructor.create({
    ...result.data,
    email: result.data.email || undefined,
    activo: true,
  });

  return redirect(`/instructores/${instructor._id}`);
}

export default function NuevoInstructor() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Nuevo Instructor"
        description="Agrega un nuevo instructor al sistema"
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
                placeholder="Juan"
                required
                error={actionData?.errors?.nombre}
              />
              <Input
                label="Apellidos"
                name="apellidos"
                placeholder="Perez Garcia"
                required
                error={actionData?.errors?.apellidos}
              />
            </div>

            <Input
              label="Telefono"
              name="telefono"
              type="tel"
              placeholder="55 1234 5678"
              required
              error={actionData?.errors?.telefono}
            />

            <Input
              label="Email (opcional)"
              name="email"
              type="email"
              placeholder="juan@email.com"
              error={actionData?.errors?.email}
            />

            <Input
              label="Especialidades (separadas por coma)"
              name="especialidades"
              placeholder="natacion, aquaerobics, waterpolo"
              hint="Ejemplo: natacion, aquaerobics"
              error={actionData?.errors?.especialidades}
            />
          </CardContent>

          <CardFooter className="flex justify-end gap-3">
            <Link to="/instructores">
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" isLoading={isSubmitting}>
              Guardar Instructor
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );
}
