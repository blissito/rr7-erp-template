import { Form, redirect, useLoaderData, useActionData, useNavigation, Link } from "react-router";
import type { Route } from "./+types/editar";
import { connectDB } from "~/lib/db.server";
import { requireUser } from "~/lib/session.server";
import { Class } from "~/models/class.server";
import { classSchema } from "~/lib/utils/validators";
import { PageHeader } from "~/components/layout/page-header";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { Alert } from "~/components/ui/alert";

export async function loader({ params }: Route.LoaderArgs) {
  await connectDB();

  const cls = await Class.findById(params.id).lean() as {
    _id: { toString(): string };
    nombre: string;
    descripcion?: string;
    duracionMinutos: number;
    capacidadMaxima: number;
    nivel?: string;
    edadMinima?: number;
    edadMaxima?: number;
  } | null;
  if (!cls) {
    throw new Response("Clase no encontrada", { status: 404 });
  }

  return {
    cls: {
      id: cls._id.toString(),
      nombre: cls.nombre,
      descripcion: cls.descripcion || "",
      duracionMinutos: cls.duracionMinutos,
      capacidadMaxima: cls.capacidadMaxima,
      nivel: cls.nivel || "",
      edadMinima: cls.edadMinima || "",
      edadMaxima: cls.edadMaxima || "",
    },
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  await requireUser(request);
  await connectDB();

  const formData = await request.formData();
  const data = {
    nombre: formData.get("nombre") as string,
    descripcion: formData.get("descripcion") as string,
    duracionMinutos: formData.get("duracionMinutos") as string,
    capacidadMaxima: formData.get("capacidadMaxima") as string,
    nivel: formData.get("nivel") as string || undefined,
    edadMinima: formData.get("edadMinima") as string || undefined,
    edadMaxima: formData.get("edadMaxima") as string || undefined,
  };

  const result = classSchema.safeParse(data);
  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.errors.forEach((err) => {
      if (err.path[0]) {
        errors[err.path[0] as string] = err.message;
      }
    });
    return { errors };
  }

  await Class.findByIdAndUpdate(params.id, result.data);

  return redirect(`/clases/${params.id}`);
}

export default function EditarClase() {
  const { cls } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Editar Clase" description={cls.nombre} />

      <Card>
        <Form method="post">
          <CardContent className="space-y-4">
            {actionData?.errors?.general && (
              <Alert variant="error">{actionData.errors.general}</Alert>
            )}

            <Input
              label="Nombre de la Clase"
              name="nombre"
              defaultValue={cls.nombre}
              required
              error={actionData?.errors?.nombre}
            />

            <Textarea
              label="Descripcion (opcional)"
              name="descripcion"
              defaultValue={cls.descripcion}
              error={actionData?.errors?.descripcion}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Duracion (minutos)"
                name="duracionMinutos"
                type="number"
                min="15"
                defaultValue={cls.duracionMinutos}
                required
                error={actionData?.errors?.duracionMinutos}
              />
              <Input
                label="Capacidad Maxima"
                name="capacidadMaxima"
                type="number"
                min="1"
                defaultValue={cls.capacidadMaxima}
                required
                error={actionData?.errors?.capacidadMaxima}
              />
            </div>

            <Select
              label="Nivel (opcional)"
              name="nivel"
              defaultValue={cls.nivel}
              error={actionData?.errors?.nivel}
            >
              <option value="">Sin nivel especifico</option>
              <option value="principiante">Principiante</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
            </Select>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Edad Minima (opcional)"
                name="edadMinima"
                type="number"
                min="0"
                defaultValue={cls.edadMinima}
                error={actionData?.errors?.edadMinima}
              />
              <Input
                label="Edad Maxima (opcional)"
                name="edadMaxima"
                type="number"
                min="0"
                defaultValue={cls.edadMaxima}
                error={actionData?.errors?.edadMaxima}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3">
            <Link to={`/clases/${cls.id}`}>
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
