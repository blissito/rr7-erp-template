import { useLoaderData } from "react-router";
import type { Route } from "./+types/reportes";
import { connectDB } from "~/lib/db.server";
import { requireUser } from "~/lib/session.server";
import { Member } from "~/models/member.server";
import { MemberMembership } from "~/models/member-membership.server";
import { AccessLog } from "~/models/access-log.server";
import { PageHeader } from "~/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { StatCard } from "~/components/ui/stat-card";
import { formatCurrency } from "~/lib/utils/format";
import { startOfDay, endOfDay, addDays } from "~/lib/utils/dates";

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  await connectDB();

  const today = new Date();
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);
  const thirtyDaysAgo = addDays(today, -30);
  const sevenDaysAgo = addDays(today, -7);

  // Stats generales
  const [
    totalMembers,
    newMembersThisMonth,
    activeMemberships,
    expiredMemberships,
    accessesToday,
    accessesThisWeek,
  ] = await Promise.all([
    Member.countDocuments({ activo: true }),
    Member.countDocuments({
      activo: true,
      createdAt: { $gte: thirtyDaysAgo },
    }),
    MemberMembership.countDocuments({ estado: "activa" }),
    MemberMembership.countDocuments({ estado: "vencida" }),
    AccessLog.countDocuments({
      fecha: { $gte: startOfToday, $lte: endOfToday },
      tipo: "entrada",
    }),
    AccessLog.countDocuments({
      fecha: { $gte: sevenDaysAgo },
      tipo: "entrada",
    }),
  ]);

  // Ingresos del mes
  const monthlyRevenue = await MemberMembership.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$montoPagado" },
        count: { $sum: 1 },
      },
    },
  ]);

  // Ingresos por tipo de membresía
  const revenueByType = await MemberMembership.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $lookup: {
        from: "membershiptypes",
        localField: "membershipTypeId",
        foreignField: "_id",
        as: "type",
      },
    },
    {
      $unwind: "$type",
    },
    {
      $group: {
        _id: "$type.nombre",
        total: { $sum: "$montoPagado" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { total: -1 },
    },
  ]);

  // Ingresos por método de pago
  const revenueByPayment = await MemberMembership.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: "$metodoPago",
        total: { $sum: "$montoPagado" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { total: -1 },
    },
  ]);

  // Accesos por día de la semana
  const accessesByDay = await AccessLog.aggregate([
    {
      $match: {
        fecha: { $gte: thirtyDaysAgo },
        tipo: "entrada",
      },
    },
    {
      $group: {
        _id: { $dayOfWeek: "$fecha" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  const DAYS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
  const accessesByDayFormatted = DAYS.map((day, index) => {
    const data = accessesByDay.find((a: any) => a._id === index + 1);
    return {
      day,
      count: data?.count || 0,
    };
  });

  // Membresías por vencer esta semana
  const sevenDaysFromNow = addDays(today, 7);
  const expiringThisWeek = await MemberMembership.countDocuments({
    estado: "activa",
    fechaFin: { $gte: today, $lte: sevenDaysFromNow },
  });

  return {
    stats: {
      totalMembers,
      newMembersThisMonth,
      activeMemberships,
      expiredMemberships,
      accessesToday,
      accessesThisWeek,
      expiringThisWeek,
    },
    revenue: {
      total: monthlyRevenue[0]?.total || 0,
      count: monthlyRevenue[0]?.count || 0,
    },
    revenueByType: revenueByType.map((r: any) => ({
      tipo: r._id,
      total: r.total,
      count: r.count,
    })),
    revenueByPayment: revenueByPayment.map((r: any) => ({
      metodo: r._id,
      total: r.total,
      count: r.count,
    })),
    accessesByDay: accessesByDayFormatted,
  };
}

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
};

export default function Reportes() {
  const { stats, revenue, revenueByType, revenueByPayment, accessesByDay } =
    useLoaderData<typeof loader>();

  const maxAccesses = Math.max(...accessesByDay.map((a) => a.count));

  return (
    <div>
      <PageHeader
        title="Reportes"
        description="Estadisticas y metricas del sistema (ultimos 30 dias)"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Miembros Activos"
          value={stats.totalMembers}
          description={`${stats.newMembersThisMonth} nuevos este mes`}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatCard
          title="Ingresos del Mes"
          value={formatCurrency(revenue.total)}
          description={`${revenue.count} membresias vendidas`}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Visitas de la Semana"
          value={stats.accessesThisWeek}
          description={`${stats.accessesToday} visitas hoy`}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />
        <StatCard
          title="Por Vencer"
          value={stats.expiringThisWeek}
          description="En los proximos 7 dias"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos por tipo de membresía */}
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por Tipo de Membresia</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByType.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Sin datos</p>
            ) : (
              <div className="space-y-4">
                {revenueByType.map((r) => (
                  <div key={r.tipo}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{r.tipo}</span>
                      <span className="text-gray-500">
                        {formatCurrency(r.total)} ({r.count})
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full"
                        style={{
                          width: `${(r.total / revenue.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ingresos por método de pago */}
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por Metodo de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByPayment.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Sin datos</p>
            ) : (
              <div className="space-y-4">
                {revenueByPayment.map((r) => (
                  <div key={r.metodo}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">
                        {PAYMENT_LABELS[r.metodo] || r.metodo}
                      </span>
                      <span className="text-gray-500">
                        {formatCurrency(r.total)} ({r.count})
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-teal-500 h-2 rounded-full"
                        style={{
                          width: `${(r.total / revenue.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visitas por día */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Visitas por Dia de la Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-40">
              {accessesByDay.map((a) => (
                <div key={a.day} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-primary-500 rounded-t"
                    style={{
                      height: maxAccesses > 0 ? `${(a.count / maxAccesses) * 100}%` : "0%",
                      minHeight: a.count > 0 ? "8px" : "0",
                    }}
                  />
                  <span className="text-xs text-gray-500 mt-2">{a.day}</span>
                  <span className="text-sm font-medium">{a.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Membresías activas vs vencidas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Estado de Membresias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-8">
              <div className="text-center">
                <div className="text-5xl font-bold text-green-600">
                  {stats.activeMemberships}
                </div>
                <p className="text-gray-500 mt-2">Membresias Activas</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-red-600">
                  {stats.expiredMemberships}
                </div>
                <p className="text-gray-500 mt-2">Membresias Vencidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
