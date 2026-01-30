import { Form, redirect, useLoaderData, useActionData, useNavigation, Link } from "react-router";
import type { Route } from "./+types/membresia";
import { connectDB } from "~/lib/db.server";
import { requireUser } from "~/lib/session.server";
import { Member } from "~/models/member.server";
import { MembershipType } from "~/models/membership-type.server";
import { MemberMembership } from "~/models/member-membership.server";
import { newMembershipSchema } from "~/lib/utils/validators";
import { addDays } from "~/lib/utils/dates";
import { formatCurrency } from "~/lib/utils/format";
import { PageHeader } from "~/components/layout/page-header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { Alert } from "~/components/ui/alert";
import { Avatar } from "~/components/ui/avatar";

export async function loader({ params }: Route.LoaderArgs) {
  await connectDB();

  const member = await Member.findById(params.id).lean() as {
    _id: { toString(): string };
    nombre: string;
    apellidos: string;
    foto?: string;
    numeroMiembro: string;
  } | null;
  if (!member) {
    throw new Response("Miembro no encontrado", { status: 404 });
  }

  const membershipTypes = await MembershipType.find({ activo: true })
    .sort({ precio: 1 })
    .lean();

  // Verificar si tiene membresía activa
  const activeMembership = await MemberMembership.findOne({
    memberId: params.id,
    estado: "activa",
    fechaFin: { $gte: new Date() },
  }).lean() as { fechaFin: Date } | null;

  return {
    member: {
      id: member._id.toString(),
      nombre: member.nombre,
      apellidos: member.apellidos,
      foto: member.foto,
      numeroMiembro: member.numeroMiembro,
    },
    membershipTypes: membershipTypes.map((t: any) => ({
      id: t._id.toString(),
      nombre: t.nombre,
      duracionDias: t.duracionDias,
      precio: t.precio,
      descripcion: t.descripcion,
    })),
    hasActiveMembership: !!activeMembership,
    activeMembershipEnd: activeMembership?.fechaFin.toISOString(),
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { user: session } = await requireUser(request);
  await connectDB();

  const formData = await request.formData();
  const data = {
    membershipTypeId: formData.get("membershipTypeId") as string,
    metodoPago: formData.get("metodoPago") as string,
    montoPagado: formData.get("montoPagado") as string,
    notas: formData.get("notas") as string,
  };

  const result = newMembershipSchema.safeParse(data);
  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.errors.forEach((err) => {
      if (err.path[0]) {
        errors[err.path[0] as string] = err.message;
      }
    });
    return { errors };
  }

  // Obtener tipo de membresía
  const membershipType = await MembershipType.findById(result.data.membershipTypeId);
  if (!membershipType) {
    return { errors: { membershipTypeId: "Tipo de membresia no encontrado" } };
  }

  // Verificar si hay membresía activa para extenderla
  const activeMembership = await MemberMembership.findOne({
    memberId: params.id,
    estado: "activa",
    fechaFin: { $gte: new Date() },
  });

  // Calcular fechas
  let fechaInicio: Date;
  if (activeMembership) {
    // Extender desde la fecha de vencimiento actual
    fechaInicio = activeMembership.fechaFin;
    // Marcar la anterior como vencida
    activeMembership.estado = "vencida";
    await activeMembership.save();
  } else {
    // Nueva membresía desde hoy
    fechaInicio = new Date();
  }
  const fechaFin = addDays(fechaInicio, membershipType.duracionDias);

  // Crear nueva membresía
  await MemberMembership.create({
    memberId: params.id,
    membershipTypeId: result.data.membershipTypeId,
    fechaInicio,
    fechaFin,
    estado: "activa",
    montoPagado: result.data.montoPagado,
    metodoPago: result.data.metodoPago,
    notas: result.data.notas,
    createdBy: session.userId,
  });

  return redirect(`/miembros/${params.id}`);
}

export default function AsignarMembresia() {
  const { member, membershipTypes, hasActiveMembership, activeMembershipEnd } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title={hasActiveMembership ? "Renovar Membresia" : "Asignar Membresia"}
        description={`Para ${member.nombre} ${member.apellidos}`}
      />

      {hasActiveMembership && (
        <Alert variant="info" className="mb-6">
          Este miembro tiene una membresia activa hasta el{" "}
          {new Date(activeMembershipEnd!).toLocaleDateString("es-MX")}. La nueva
          membresia se sumara a partir de esa fecha.
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar
              name={`${member.nombre} ${member.apellidos}`}
              src={member.foto}
              size="lg"
            />
            <div>
              <h3 className="font-semibold text-lg">
                {member.nombre} {member.apellidos}
              </h3>
              <p className="text-gray-500">#{member.numeroMiembro}</p>
            </div>
          </div>
        </CardHeader>

        <Form method="post">
          <CardContent className="space-y-4">
            <Select
              label="Tipo de Membresia"
              name="membershipTypeId"
              required
              error={actionData?.errors?.membershipTypeId}
            >
              <option value="">Selecciona un tipo</option>
              {membershipTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.nombre} - {formatCurrency(type.precio)} ({type.duracionDias}{" "}
                  dias)
                </option>
              ))}
            </Select>

            <Select
              label="Metodo de Pago"
              name="metodoPago"
              required
              error={actionData?.errors?.metodoPago}
            >
              <option value="">Selecciona metodo</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </Select>

            <Input
              label="Monto Pagado"
              name="montoPagado"
              type="number"
              min="0"
              step="0.01"
              required
              error={actionData?.errors?.montoPagado}
            />

            <Textarea
              label="Notas (opcional)"
              name="notas"
              placeholder="Notas sobre el pago..."
              error={actionData?.errors?.notas}
            />
          </CardContent>

          <CardFooter className="flex justify-end gap-3">
            <Link to={`/miembros/${member.id}`}>
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" isLoading={isSubmitting}>
              {hasActiveMembership ? "Renovar Membresia" : "Asignar Membresia"}
            </Button>
          </CardFooter>
        </Form>
      </Card>

      {/* Lista de precios */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Tipos de Membresia Disponibles</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">
                  Tipo
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">
                  Duracion
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 text-sm">
                  Precio
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {membershipTypes.map((type) => (
                <tr key={type.id}>
                  <td className="py-3 px-4">
                    <p className="font-medium">{type.nombre}</p>
                    {type.descripcion && (
                      <p className="text-sm text-gray-500">{type.descripcion}</p>
                    )}
                  </td>
                  <td className="py-3 px-4">{type.duracionDias} dias</td>
                  <td className="py-3 px-4 text-right font-medium">
                    {formatCurrency(type.precio)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
