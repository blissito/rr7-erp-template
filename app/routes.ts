import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  // Auth routes
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),

  // Dashboard layout with all protected routes
  layout("routes/dashboard-layout.tsx", [
    index("routes/dashboard.tsx"),
    route("acceso", "routes/acceso.tsx"),
    route("miembros", "routes/miembros/index.tsx"),
    route("miembros/nuevo", "routes/miembros/nuevo.tsx"),
    route("miembros/:id", "routes/miembros/detalle.tsx"),
    route("miembros/:id/editar", "routes/miembros/editar.tsx"),
    route("miembros/:id/membresia", "routes/miembros/membresia.tsx"),
    route("clases", "routes/clases/index.tsx"),
    route("clases/nueva", "routes/clases/nueva.tsx"),
    route("clases/:id", "routes/clases/detalle.tsx"),
    route("clases/:id/editar", "routes/clases/editar.tsx"),
    route("horarios", "routes/horarios.tsx"),
    route("horarios/nuevo", "routes/horarios-nuevo.tsx"),
    route("instructores", "routes/instructores/index.tsx"),
    route("instructores/nuevo", "routes/instructores/nuevo.tsx"),
    route("instructores/:id", "routes/instructores/detalle.tsx"),
    route("instructores/:id/editar", "routes/instructores/editar.tsx"),
    route("reportes", "routes/reportes.tsx"),
    route("config", "routes/config/index.tsx"),
    route("config/membresias", "routes/config/membresias.tsx"),
    route("config/usuarios", "routes/config/usuarios.tsx"),
  ]),
] satisfies RouteConfig;
