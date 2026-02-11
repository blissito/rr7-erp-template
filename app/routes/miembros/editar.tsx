// @ts-nocheck
import { Form, redirect, useLoaderData, useActionData, useNavigation, Link } from "react-router";
import type { Route } from "./+types/editar";
import { requireUser } from "~/lib/session.server";
import { Member } from "~/models/member.server";
import { memberSchema } from "~/lib/utils/validators";
import { PageHeader } from "~/components/layout/page-header";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Alert } from "~/components/ui/alert";

export async function loader({ params }: Route.LoaderArgs) {

    // @ts-ignore - Drizzle compatibility
  const member = await Member.findById(params.id).lean() as {
    _id: { toString(): string };
    numeroMiembro: string;
    nombre: string;
    apellidos: string;
    email?: string;
    telefono: string;
    fechaNacimiento?: Date;
    notas?: string;
  } | null;
  if (!member) {
    throw new Response("Miembro no encontrado", { status: 404 });
  }

  return {
    member: {
      // @ts-ignore - Compatibility
      id: member.id.toString(),
      numeroMiembro: member.numeroMiembro,
      nombre: member.nombre,
      apellidos: member.apellidos,
      email: member.email || "",
      telefono: member.telefono,
      fechaNacimiento: member.fechaNacimiento
        ? member.fechaNacimiento.toISOString().split("T")[0]
        : "",
      notas: member.notas || "",
    },
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  await requireUser(request);

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

  // @ts-ignore - Drizzle compatibility
  await Member.findByIdAndUpdate(params.id, {
    ...result.data,
    email: result.data.email || undefined,
    fechaNacimiento: result.data.fechaNacimiento
      ? new Date(result.data.fechaNacimiento)
      : undefined,
  });

  return redirect(`/miembros/${params.id}`);
}

export default function EditarMiembro() {
  const { member } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Editar Miembro"
        description={`${member.nombre} ${member.apellidos} - #${member.numeroMiembro}`}
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
                defaultValue={member.nombre}
                required
                error={actionData?.errors?.nombre}
              />
              <Input
                label="Apellidos"
                name="apellidos"
                defaultValue={member.apellidos}
                required
                error={actionData?.errors?.apellidos}
              />
            </div>

            <Input
              label="Telefono"
              name="telefono"
              type="tel"
              defaultValue={member.telefono}
              required
              error={actionData?.errors?.telefono}
            />

            <Input
              label="Email (opcional)"
              name="email"
              type="email"
              defaultValue={member.email}
              error={actionData?.errors?.email}
            />

            <Input
              label="Fecha de Nacimiento (opcional)"
              name="fechaNacimiento"
              type="date"
              defaultValue={member.fechaNacimiento}
              error={actionData?.errors?.fechaNacimiento}
            />

            <Textarea
              label="Notas (opcional)"
              name="notas"
              defaultValue={member.notas}
              error={actionData?.errors?.notas}
            />
          </CardContent>

          <CardFooter className="flex justify-end gap-3">
            // @ts-ignore - Compatibility
            <Link to={`/miembros/${member.id}`}>
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
