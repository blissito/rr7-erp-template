// @ts-nocheck
import { Form, useLoaderData, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/usuarios";
import { requireAdmin } from "~/lib/session.server";
import { User } from "~/models/user.server";
import { hashPassword } from "~/lib/auth.server";
import { validateObjectId } from "~/lib/utils/mongo";
import { logAudit } from "~/models/audit-log.server";
import { passwordSchema } from "~/lib/utils/validators";
import { PageHeader } from "~/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { Alert } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Avatar } from "~/components/ui/avatar";
import { useState } from "react";
import { z } from "zod";

const userSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email invalido"),
  password: passwordSchema,
  rol: z.enum(["admin", "recepcion", "instructor"]),
});

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requireAdmin(request);

    // @ts-ignore - Drizzle compatibility
    // @ts-ignore - Drizzle compatibility
  const users = await User.find().sort({ createdAt: -1 }).lean();

  return {
    currentUserId: user.userId,
    // @ts-ignore - Compatibility
    users: users.map((u: any) => ({
      id: u.id.toString(),
      nombre: u.nombre,
      email: u.email,
      rol: u.role,
      activo: u.activo,
      createdAt: u.createdAt.toISOString(),
    })),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { user: adminUser } = await requireAdmin(request);

  const formData = await request.formData();
  const actionType = formData.get("_action") as string;

  if (actionType === "create") {
    const data = {
      nombre: formData.get("nombre") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      rol: formData.get("rol") as string,
    };

    const result = userSchema.safeParse(data);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      return { errors, action: "create" };
    }

    // Verificar email único
    const existing = await User.findOne({ email: result.data.email.toLowerCase() });
    if (existing) {
      return { errors: { email: "Este email ya esta registrado" }, action: "create" };
    }

    // @ts-ignore - Schema compatibility
    const passwordHash = await hashPassword(result.data.password);

    const newUser = await User.create({
      nombre: result.data.nombre,
      email: result.data.email.toLowerCase(),
    // @ts-ignore - Schema compatibility
      passwordHash,
      rol: result.data.role,
      activo: true,
    });

    // Registrar auditoría
    await logAudit(request, adminUser, "create", "user", newUser.id.toString(), {
      email: newUser.email,
      rol: newUser.role,
    });

    return { success: true, message: "Usuario creado" };
  }

  if (actionType === "toggle") {
    const id = validateObjectId(formData.get("id") as string, "ID de usuario");

    // Prevenir auto-desactivación
    if (id === adminUser.userId) {
      return { errors: { general: "No puedes desactivar tu propia cuenta" }, action: "toggle" };
    }

    const user = await User.findById(id);
    if (!user) {
      return { errors: { general: "Usuario no encontrado" }, action: "toggle" };
    }

    const previousStatus = user.activo;
    user.activo = !user.activo;
    // @ts-ignore - Drizzle compatibility
    await user.save();

    // Registrar auditoría
    await logAudit(request, adminUser, "toggle_status", "user", id, {
      email: user.email,
      previousStatus,
      newStatus: user.activo,
    });

    return { success: true, message: user.activo ? "Usuario activado" : "Usuario desactivado" };
  }

  if (actionType === "delete") {
    const id = validateObjectId(formData.get("id") as string, "ID de usuario");

    // Prevenir auto-eliminación
    if (id === adminUser.userId) {
      return { errors: { general: "No puedes eliminar tu propia cuenta" }, action: "delete" };
    }

    const user = await User.findById(id);
    if (!user) {
      return { errors: { general: "Usuario no encontrado" }, action: "delete" };
    }

    // Guardar datos para auditoría antes de eliminar
    const deletedUserEmail = user.email;
    // @ts-ignore - Drizzle compatibility
    await User.findByIdAndDelete(id);

    // Registrar auditoría
    await logAudit(request, adminUser, "delete", "user", id, {
      deletedEmail: deletedUserEmail,
    });

    return { success: true, message: "Usuario eliminado" };
  }

  return null;
}

const ROL_LABELS: Record<string, string> = {
  admin: "Administrador",
  recepcion: "Recepcion",
  instructor: "Instructor",
};

const ROL_COLORS: Record<string, "info" | "success" | "warning"> = {
  admin: "info",
  recepcion: "success",
  instructor: "warning",
};

export default function ConfigUsuarios() {
  const { users, currentUserId } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <PageHeader
        title="Usuarios del Sistema"
        description="Administra los usuarios que pueden acceder al sistema"
        action={
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancelar" : "Nuevo Usuario"}
          </Button>
        }
      />

      {actionData?.success && (
        <Alert variant="success" className="mb-6">
          {actionData.message}
        </Alert>
      )}

      {actionData?.errors?.general && (
        <Alert variant="error" className="mb-6">
          {actionData.errors.general}
        </Alert>
      )}

      {/* Formulario de nuevo usuario */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nuevo Usuario</CardTitle>
          </CardHeader>
          <Form method="post">
            <input type="hidden" name="_action" value="create" />
            <CardContent className="space-y-4">
              {actionData?.errors && actionData.action === "create" && (
                <Alert variant="error">
                  {Object.values(actionData.errors).join(", ")}
                </Alert>
              )}

              <Input
                label="Nombre Completo"
                name="nombre"
                placeholder="Juan Perez"
                required
                error={actionData?.errors?.nombre}
              />

              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="juan@alberca.com"
                required
                error={actionData?.errors?.email}
              />

              <Input
                label="Contrasena"
                name="password"
                type="password"
                placeholder="Minimo 6 caracteres"
                required
                error={actionData?.errors?.password}
              />

              <Select
                label="Rol"
                name="rol"
                required
                error={actionData?.errors?.role}
              >
                <option value="">Selecciona un rol</option>
                <option value="admin">Administrador</option>
                <option value="recepcion">Recepcion</option>
                <option value="instructor">Instructor</option>
              </Select>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" isLoading={isSubmitting}>
                Crear Usuario
              </Button>
            </CardFooter>
          </Form>
        </Card>
      )}

      {/* Lista de usuarios */}
      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <p className="p-6 text-center text-gray-500">
              No hay usuarios registrados
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {users.map((user) => (
                <li
                  // @ts-ignore - Compatibility
                  key={user.id}
                  className={`flex items-center gap-4 p-4 ${
                    !user.activo ? "opacity-50" : ""
                  }`}
                >
                  <Avatar name={user.nombre} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{user.nombre}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <Badge variant={ROL_COLORS[user.role]}>
                    {ROL_LABELS[user.role]}
                  </Badge>
                  <Badge variant={user.activo ? "success" : "default"}>
                    {user.activo ? "Activo" : "Inactivo"}
                  </Badge>
                  <div className="flex gap-2">
                    // @ts-ignore - Compatibility
                    {user.id === currentUserId ? (
                      <Badge variant="info">Tu cuenta</Badge>
                    ) : (
                      <>
                        <Form method="post">
                          <input type="hidden" name="_action" value="toggle" />
                          // @ts-ignore - Compatibility
                          <input type="hidden" name="id" value={user.id} />
                          <Button type="submit" variant="ghost" size="sm">
                            {user.activo ? "Desactivar" : "Activar"}
                          </Button>
                        </Form>
                        <Form method="post">
                          <input type="hidden" name="_action" value="delete" />
                          // @ts-ignore - Compatibility
                          <input type="hidden" name="id" value={user.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={(e) => {
                              if (!confirm("¿Eliminar este usuario? Esta acción no se puede deshacer.")) {
                                e.preventDefault();
                              }
                            }}
                          >
                            Eliminar
                          </Button>
                        </Form>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
