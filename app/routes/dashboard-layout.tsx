import { Outlet, useLoaderData } from "react-router";
import type { Route } from "./+types/dashboard-layout";
import { requireUser } from "~/lib/session.server";
import { getUserById } from "~/lib/auth.server";
import { Sidebar } from "~/components/layout/sidebar";
import { Header } from "~/components/layout/header";

export async function loader({ request }: Route.LoaderArgs) {
  const { user: session, headers } = await requireUser(request);
  const user = await getUserById(session.userId);

  if (!user) {
    throw new Response("Usuario no encontrado", { status: 404 });
  }

  const data = {
    user: {
      // @ts-ignore - Compatibility
      id: user.id.toString(),
      nombre: user.nombre,
      email: user.email,
      rol: user.role,
    },
  };

  // Si hay headers con nuevo token, incluirlos en response
  if (headers) {
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        ...Object.fromEntries(headers.entries()),
      },
    });
  }

  return data;
}

export default function DashboardLayout() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="pl-64">
        <Header user={user} />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
