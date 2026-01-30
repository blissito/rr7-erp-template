import { Form, redirect, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/login";
import { authenticateUser } from "~/lib/auth.server";
import { createUserSession, getOptionalUser } from "~/lib/session.server";
import { checkRateLimit, recordFailedAttempt, clearFailedAttempts } from "~/lib/rate-limit.server";
import { loginSchema } from "~/lib/utils/validators";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Alert } from "~/components/ui/alert";
import { APP_CONFIG } from "~/config/app.config";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getOptionalUser(request);
  if (user) {
    throw redirect("/");
  }
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  // Verificar rate limit antes de procesar
  const rateLimit = checkRateLimit(request);
  if (!rateLimit.allowed) {
    return { error: rateLimit.message };
  }

  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const result = loginSchema.safeParse({ email, password });
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const auth = await authenticateUser(email, password);
  if (!auth) {
    // Registrar intento fallido
    recordFailedAttempt(request);
    const updatedLimit = checkRateLimit(request);
    const remaining = updatedLimit.remainingAttempts;
    const message = remaining > 0
      ? `Email o contraseña incorrectos. ${remaining} intento(s) restante(s).`
      : updatedLimit.message || "Email o contraseña incorrectos";
    return { error: message };
  }

  // Limpiar intentos fallidos tras login exitoso
  clearFailedAttempts(request);

  return createUserSession(auth.tokens, "/");
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-teal-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{APP_CONFIG.name}</h1>
            <p className="text-gray-500 mt-1">Inicia sesion para continuar</p>
          </div>

          {actionData?.error && (
            <Alert variant="error" className="mb-6">
              {actionData.error}
            </Alert>
          )}

          <Form method="post" className="space-y-5">
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              required
            />

            <Input
              label="Contrasena"
              name="password"
              type="password"
              placeholder="Tu contrasena"
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isSubmitting}
            >
              Iniciar sesion
            </Button>
          </Form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          {APP_CONFIG.description}
        </p>
      </div>
    </div>
  );
}
