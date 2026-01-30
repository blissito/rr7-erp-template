import { Form, redirect, useActionData, useNavigation, Link } from "react-router";
import type { Route } from "./+types/nuevo";
import { connectDB } from "~/lib/db.server";
import { requireUser } from "~/lib/session.server";
import { Member } from "~/models/member.server";
import { memberSchema } from "~/lib/utils/validators";
import { generateMemberNumber } from "~/lib/utils/format";
import { PageHeader } from "~/components/layout/page-header";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Alert } from "~/components/ui/alert";

export async function action({ request }: Route.ActionArgs) {
  await requireUser(request);
  await connectDB();

  const formData = await request.formData();
  const data = {
    nombre: formData.get("nombre") as string,
    apellidos: formData.get("apellidos") as string,
    email: formData.get("email") as string,
    telefono: formData.get("telefono") as string,
    fechaNacimiento: formData.get("fechaNacimiento") as string,
    notas: formData.get("notas") as string,
  };

  const result = memberSchema.safeParse(data);
  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.errors.forEach((err) => {
      if (err.path[0]) {
        errors[err.path[0] as string] = err.message;
      }
    });
    return { errors };
  }

  // Generar número de miembro único
  let numeroMiembro = generateMemberNumber();
  while (await Member.findOne({ numeroMiembro })) {
    numeroMiembro = generateMemberNumber();
  }

  const member = await Member.create({
    ...result.data,
    numeroMiembro,
    email: result.data.email || undefined,
    fechaNacimiento: result.data.fechaNacimiento
      ? new Date(result.data.fechaNacimiento)
      : undefined,
    activo: true,
  });

  return redirect(`/miembros/${member._id}`);
}

export default function NuevoMiembro() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Nuevo Miembro"
        description="Registra un nuevo miembro en el sistema"
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
              label="Fecha de Nacimiento (opcional)"
              name="fechaNacimiento"
              type="date"
              error={actionData?.errors?.fechaNacimiento}
            />

            <Textarea
              label="Notas (opcional)"
              name="notas"
              placeholder="Notas adicionales sobre el miembro..."
              error={actionData?.errors?.notas}
            />
          </CardContent>

          <CardFooter className="flex justify-end gap-3">
            <Link to="/miembros">
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" isLoading={isSubmitting}>
              Guardar Miembro
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );
}
