// @ts-nocheck
import { useLoaderData, Link } from "react-router";
import type { Route } from "./+types/dashboard";
import { Member } from "~/models/member.server";
import { MemberMembership } from "~/models/member-membership.server";
import { AccessLog } from "~/models/access-log.server";
import { Schedule } from "~/models/schedule.server";
import { StatCard } from "~/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Avatar } from "~/components/ui/avatar";
import { PageHeader } from "~/components/layout/page-header";
import { formatShortDate, isExpiringSoon, daysUntilExpiration } from "~/lib/utils/dates";
import { addDays, startOfDay, endOfDay } from "date-fns";

export async function loader({ request }: Route.LoaderArgs) {

  const today = new Date();
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);

  // Total miembros activos
  // @ts-ignore - Drizzle compatibility
  const totalMembers = await Member.countDocuments({ activo: true });

  // Miembros adentro (entradas sin salida hoy)
  // @ts-ignore - Drizzle compatibility
  const entriesToday = await AccessLog.aggregate([
    {
      $match: {
        // @ts-ignore - Compatibility
        fecha: { $gte: startOfToday, $lte: endOfToday },
      },
    },
    {
      $sort: { fecha: -1 },
    },
    {
      $group: {
        _id: "$memberId",
        lastType: { $first: "$tipo" },
        lastDate: { $first: "$fecha" },
      },
    },
    {
      $match: { lastType: "entrada" },
    },
  ]);
  const currentOccupancy = entriesToday.length;

  // Membresías por vencer (próximos 7 días)
  const sevenDaysFromNow = addDays(today, 7);
  const expiringMemberships = await MemberMembership.find({
    activa: "activa",
    // @ts-ignore - Compatibility
    fechaFin: { $gte: today, $lte: sevenDaysFromNow },
  })
    // @ts-ignore - Drizzle compatibility
    .populate("memberId")
    // @ts-ignore - Drizzle compatibility
    .limit(5)
    // @ts-ignore - Drizzle compatibility
    .lean();

  // Clases programadas hoy
  const dayOfWeek = today.getDay();
  const todaySchedules = await Schedule.find({
    diaSemana: dayOfWeek,
    activo: true,
  })
    // @ts-ignore - Drizzle compatibility
    .populate("classId")
    // @ts-ignore - Drizzle compatibility
    .populate("instructorId")
    // @ts-ignore - Drizzle compatibility
    .sort({ horaInicio: 1 })
    // @ts-ignore - Drizzle compatibility
    .limit(5)
    // @ts-ignore - Drizzle compatibility
    .lean();

  // Últimos accesos
  const recentAccess = await AccessLog.find()
    // @ts-ignore - Drizzle compatibility
    .populate("memberId")
    // @ts-ignore - Drizzle compatibility
    .sort({ fecha: -1 })
    // @ts-ignore - Drizzle compatibility
    .limit(5)
    // @ts-ignore - Drizzle compatibility
    .lean();

  // Membresías activas vs vencidas
  // @ts-ignore - Drizzle compatibility
  const activeMemberships = await MemberMembership.countDocuments({
    activa: "activa",
  });
  // @ts-ignore - Drizzle compatibility
  const expiredMemberships = await MemberMembership.countDocuments({
    activa: "vencida",
  });

  return {
    stats: {
      totalMembers,
      currentOccupancy,
      activeMemberships,
      expiredMemberships,
    },
    // @ts-ignore - Compatibility
    expiringMemberships: expiringMemberships.map((m: any) => ({
      id: m.id.toString(),
      // @ts-ignore - Compatibility
      memberId: m.memberId.id.toString(),
      memberName: `${m.memberId.nombre} ${m.memberId.apellidos}`,
      memberPhoto: m.memberId.foto,
      fechaFin: m.fechaFin.toISOString(),
      daysLeft: daysUntilExpiration(m.fechaFin),
    })),
    // @ts-ignore - Compatibility
    todaySchedules: todaySchedules.map((s: any) => ({
      id: s.id.toString(),
      className: s.classId?.nombre || "Clase eliminada",
      instructorName: s.instructorId
        ? `${s.instructorId.nombre} ${s.instructorId.apellidos}`
        : "Sin instructor",
      horaInicio: s.horaInicio,
      horaFin: s.horaFin,
      carril: s.carril,
    })),
    // @ts-ignore - Compatibility
    recentAccess: recentAccess.map((a: any) => ({
      id: a.id.toString(),
      memberName: a.memberId
        ? `${a.memberId.nombre} ${a.memberId.apellidos}`
        : "Miembro eliminado",
      memberPhoto: a.memberId?.foto,
      tipo: a.tipo,
      fecha: a.fecha.toISOString(),
    })),
  };
}

export default function Dashboard() {
  const { stats, expiringMemberships, todaySchedules, recentAccess } =
    useLoaderData<typeof loader>();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Resumen general del sistema"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Miembros Totales"
          value={stats.totalMembers}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatCard
          title="Personas Adentro"
          value={stats.currentOccupancy}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          title="Membresias Activas"
          value={stats.activeMemberships}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Membresias Vencidas"
          value={stats.expiredMemberships}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Membresías por vencer */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Membresias por Vencer</CardTitle>
            <Link
              to="/miembros"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Ver todos
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {expiringMemberships.length === 0 ? (
              <p className="p-6 text-center text-gray-500">
                No hay membresias por vencer
              </p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {expiringMemberships.map((m) => (
                  <li key={m.id}>
                    <Link
                      to={`/miembros/${m.memberId}`}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                    >
                      <Avatar name={m.memberName} src={m.memberPhoto} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {m.memberName}
                        </p>
                        <p className="text-sm text-gray-500">
                          Vence: {formatShortDate(m.fechaFin)}
                        </p>
                      </div>
                      <Badge variant={m.daysLeft <= 3 ? "danger" : "warning"}>
                        {m.daysLeft === 0
                          ? "Hoy"
                          : m.daysLeft === 1
                          ? "Manana"
                          : `${m.daysLeft} dias`}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Clases de hoy */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Clases de Hoy</CardTitle>
            <Link
              to="/horarios"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Ver horarios
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {todaySchedules.length === 0 ? (
              <p className="p-6 text-center text-gray-500">
                No hay clases programadas hoy
              </p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {todaySchedules.map((s) => (
                  <li key={s.id} className="flex items-center gap-4 p-4">
                    <div className="w-16 text-center">
                      <p className="text-lg font-bold text-primary-600">
                        {s.horaInicio}
                      </p>
                      <p className="text-xs text-gray-500">{s.horaFin}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{s.className}</p>
                      <p className="text-sm text-gray-500">{s.instructorName}</p>
                    </div>
                    {s.carril && (
                      <Badge variant="info">Carril {s.carril}</Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Últimos accesos */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Ultimos Accesos</CardTitle>
            <Link
              to="/acceso"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Control de acceso
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentAccess.length === 0 ? (
              <p className="p-6 text-center text-gray-500">
                No hay accesos registrados
              </p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {recentAccess.map((a) => (
                  <li key={a.id} className="flex items-center gap-4 p-4">
                    <Avatar name={a.memberName} src={a.memberPhoto} size="md" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{a.memberName}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(a.fecha).toLocaleString("es-MX", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Badge variant={a.tipo === "entrada" ? "success" : "default"}>
                      {a.tipo === "entrada" ? "Entrada" : "Salida"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
