// @ts-nocheck
import { Form, useLoaderData, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/membresias";
import { requireAdmin } from "~/lib/session.server";
import { MembershipType } from "~/models/membership-type.server";
import { membershipTypeSchema } from "~/lib/utils/validators";
import { formatCurrency } from "~/lib/utils/format";
import { PageHeader } from "~/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Alert } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { useState } from "react";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);

  const membershipTypes = await MembershipType.find()
    // @ts-ignore - Drizzle compatibility
    .sort({ precio: 1 })
    // @ts-ignore - Drizzle compatibility
    .lean();

  return {
    // @ts-ignore - Compatibility
    membershipTypes: membershipTypes.map((t: any) => ({
      id: t.id.toString(),
      nombre: t.nombre,
      duracionDias: t.duracion,
      precio: t.precio,
      descripcion: t.descripcion,
      accesosIncluidos: t.accesosIncluidos,
      activo: t.activo,
    })),
  };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);

  const formData = await request.formData();
  const actionType = formData.get("_action") as string;

  if (actionType === "create") {
    const data = {
      nombre: formData.get("nombre") as string,
      duracionDias: formData.get("duracionDias") as string,
      precio: formData.get("precio") as string,
      descripcion: formData.get("descripcion") as string,
      accesosIncluidos: formData.get("accesosIncluidos") as string || undefined,
    };

    const result = membershipTypeSchema.safeParse(data);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      return { errors, action: "create" };
    }

    await MembershipType.create({
      ...result.data,
      activo: true,
    });

    return { success: true, message: "Tipo de membresia creado" };
  }

  if (actionType === "toggle") {
    const id = formData.get("id") as string;
    const membershipType = await MembershipType.findById(id);
    if (membershipType) {
      membershipType.activo = !membershipType.activo;
      // @ts-ignore - Drizzle compatibility
      await membershipType.save();
    }
    return { success: true, message: "Estado actualizado" };
  }

  if (actionType === "delete") {
    const id = formData.get("id") as string;
    // @ts-ignore - Drizzle compatibility
    await MembershipType.findByIdAndDelete(id);
    return { success: true, message: "Tipo de membresia eliminado" };
  }

  return null;
}

export default function ConfigMembresias() {
  const { membershipTypes } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <PageHeader
        title="Tipos de Membresia"
        description="Configura los tipos de membresia disponibles"
        action={
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancelar" : "Nuevo Tipo"}
          </Button>
        }
      />

      {actionData?.success && (
        <Alert variant="success" className="mb-6">
          {actionData.message}
        </Alert>
      )}

      {/* Formulario de nuevo tipo */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nuevo Tipo de Membresia</CardTitle>
          </CardHeader>
          <Form method="post">
            <input type="hidden" name="_action" value="create" />
            <CardContent className="space-y-4">
              {actionData?.errors && actionData.action === "create" && (
                <Alert variant="error">
                  {Object.values(actionData.errors).join(", ")}
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nombre"
                  name="nombre"
                  placeholder="Mensual"
                  required
                  error={actionData?.errors?.nombre}
                />
                <Input
                  label="Precio (MXN)"
                  name="precio"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="500"
                  required
                  error={actionData?.errors?.precio}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Duracion (dias)"
                  name="duracionDias"
                  type="number"
                  min="1"
                  placeholder="30"
                  required
                  error={actionData?.errors?.duracion}
                />
                <Input
                  label="Accesos Incluidos (opcional)"
                  name="accesosIncluidos"
                  type="number"
                  min="1"
                  placeholder="Ilimitados"
                  hint="Dejar vacio para ilimitados"
                  error={actionData?.errors?.accesosIncluidos}
                />
              </div>

              <Textarea
                label="Descripcion (opcional)"
                name="descripcion"
                placeholder="Descripcion del tipo de membresia..."
                error={actionData?.errors?.descripcion}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" isLoading={isSubmitting}>
                Guardar
              </Button>
            </CardFooter>
          </Form>
        </Card>
      )}

      {/* Lista de tipos */}
      <Card>
        <CardContent className="p-0">
          {membershipTypes.length === 0 ? (
            <p className="p-6 text-center text-gray-500">
              No hay tipos de membresia configurados
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">
                    Nombre
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">
                    Duracion
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">
                    Precio
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">
                    Accesos
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">
                    Estado
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 text-sm">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {membershipTypes.map((type) => (
                  <tr key={type.id} className={!type.activo ? "opacity-50" : ""}>
                    <td className="py-3 px-4">
                      <p className="font-medium">{type.nombre}</p>
                      {type.descripcion && (
                        <p className="text-sm text-gray-500">{type.descripcion}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">{type.duracion} dias</td>
                    <td className="py-3 px-4 font-medium">
                      {formatCurrency(type.precio)}
                    </td>
                    <td className="py-3 px-4">
                      {type.accesosIncluidos || "Ilimitados"}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={type.activo ? "success" : "default"}>
                        {type.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Form method="post">
                          <input type="hidden" name="_action" value="toggle" />
                          <input type="hidden" name="id" value={type.id} />
                          <Button type="submit" variant="ghost" size="sm">
                            {type.activo ? "Desactivar" : "Activar"}
                          </Button>
                        </Form>
                        <Form method="post">
                          <input type="hidden" name="_action" value="delete" />
                          <input type="hidden" name="id" value={type.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={(e) => {
                              if (!confirm("¿Eliminar este tipo de membresia?")) {
                                e.preventDefault();
                              }
                            }}
                          >
                            Eliminar
                          </Button>
                        </Form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
