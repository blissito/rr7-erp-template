import { db } from "../app/db";
import {
  users,
  members,
  membershipTypes,
  memberMemberships,
  classes,
  instructors,
  schedules,
} from "../app/db/schema";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Conectando a PostgreSQL...");

  try {
    // Limpiar tablas existentes (en orden por foreign keys)
    console.log("Limpiando datos existentes...");
    await db.delete(schedules);
    await db.delete(memberMemberships);
    await db.delete(membershipTypes);
    await db.delete(members);
    await db.delete(instructors);
    await db.delete(classes);
    await db.delete(users);
    console.log("  Datos limpiados");

    // Crear usuarios
    console.log("Creando usuarios...");
    const passwordHash = await bcrypt.hash("admin123", 10);
    const [admin] = await db
      .insert(users)
      .values({
        email: "admin@erp.com",
        password: passwordHash,
        nombre: "Administrador",
        apellidos: "Sistema",
        role: "admin",
        activo: true,
      })
      .returning();

    await db.insert(users).values({
      email: "usuario@erp.com",
      password: await bcrypt.hash("usuario123", 10),
      nombre: "Usuario",
      apellidos: "Normal",
      role: "usuario",
      activo: true,
    });

    console.log("  Email: admin@erp.com");
    console.log("  Password: admin123");
    console.log("  Email: usuario@erp.com");
    console.log("  Password: usuario123");

    // Crear tipos de membresía
    console.log("Creando tipos de membresia...");
    const membershipTypesData = await db
      .insert(membershipTypes)
      .values([
        {
          nombre: "Pase de Día",
          descripcion: "Acceso por un día",
          duracion: 1,
          precio: 8000, // centavos = $80.00
          color: "#10B981",
          activo: true,
        },
        {
          nombre: "Semanal",
          descripcion: "Acceso ilimitado por una semana",
          duracion: 7,
          precio: 30000, // $300.00
          color: "#3B82F6",
          activo: true,
        },
        {
          nombre: "Mensual",
          descripcion: "Acceso ilimitado por un mes",
          duracion: 30,
          precio: 80000, // $800.00
          color: "#8B5CF6",
          activo: true,
        },
        {
          nombre: "Trimestral",
          descripcion: "Acceso ilimitado por tres meses",
          duracion: 90,
          precio: 200000, // $2000.00
          color: "#F59E0B",
          activo: true,
        },
        {
          nombre: "Anual",
          descripcion: "Acceso ilimitado por un año",
          duracion: 365,
          precio: 600000, // $6000.00
          color: "#EF4444",
          activo: true,
        },
      ])
      .returning();
    console.log(`  ${membershipTypesData.length} tipos creados`);

    // Crear miembros
    console.log("Creando miembros de ejemplo...");
    const membersData = await db
      .insert(members)
      .values([
        {
          numeroMiembro: "M001",
          nombre: "Juan",
          apellidos: "Pérez García",
          email: "juan@email.com",
          telefono: "5512345678",
          fechaNacimiento: new Date("1990-05-15"),
          activo: true,
        },
        {
          numeroMiembro: "M002",
          nombre: "María",
          apellidos: "López Martínez",
          email: "maria@email.com",
          telefono: "5523456789",
          fechaNacimiento: new Date("1985-08-20"),
          activo: true,
        },
        {
          numeroMiembro: "M003",
          nombre: "Carlos",
          apellidos: "Hernández Ruiz",
          telefono: "5534567890",
          fechaNacimiento: new Date("1995-03-10"),
          activo: true,
        },
        {
          numeroMiembro: "M004",
          nombre: "Ana",
          apellidos: "González Flores",
          email: "ana@email.com",
          telefono: "5545678901",
          fechaNacimiento: new Date("2000-12-01"),
          activo: true,
        },
        {
          numeroMiembro: "M005",
          nombre: "Pedro",
          apellidos: "Sánchez Luna",
          telefono: "5556789012",
          fechaNacimiento: new Date("1988-07-25"),
          activo: true,
        },
      ])
      .returning();
    console.log(`  ${membersData.length} miembros creados`);

    // Crear membresías activas
    console.log("Asignando membresias...");
    const today = new Date();
    const mensual = membershipTypesData.find((t) => t.nombre === "Mensual")!;
    const trimestral = membershipTypesData.find((t) => t.nombre === "Trimestral")!;

    await db.insert(memberMemberships).values([
      {
        memberId: membersData[0].id,
        membershipTypeId: mensual.id,
        fechaInicio: today,
        fechaFin: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
        activa: true,
      },
      {
        memberId: membersData[1].id,
        membershipTypeId: trimestral.id,
        fechaInicio: today,
        fechaFin: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000),
        activa: true,
      },
      {
        memberId: membersData[2].id,
        membershipTypeId: mensual.id,
        fechaInicio: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000),
        fechaFin: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
        activa: true,
      },
    ]);
    console.log("  3 membresías asignadas");

    // Crear instructores
    console.log("Creando instructores...");
    const instructorsData = await db
      .insert(instructors)
      .values([
        {
          nombre: "Roberto",
          apellidos: "Torres Medina",
          telefono: "5511111111",
          email: "roberto@erp.com",
          especialidades: ["natación", "waterpolo"],
          activo: true,
        },
        {
          nombre: "Laura",
          apellidos: "Vega Castro",
          telefono: "5522222222",
          email: "laura@erp.com",
          especialidades: ["aquaerobics", "natación"],
          activo: true,
        },
        {
          nombre: "Miguel",
          apellidos: "Díaz Ortega",
          telefono: "5533333333",
          especialidades: ["natación"],
          activo: true,
        },
      ])
      .returning();
    console.log(`  ${instructorsData.length} instructores creados`);

    // Crear clases
    console.log("Creando clases...");
    const classesData = await db
      .insert(classes)
      .values([
        {
          nombre: "Natación Niños 5-8",
          descripcion: "Clases de natación para niños de 5 a 8 años",
          duracion: 45,
          capacidad: 8,
          nivel: "principiante",
          color: "#3B82F6",
          activo: true,
        },
        {
          nombre: "Natación Adultos",
          descripcion: "Clases de natación para adultos de todos los niveles",
          duracion: 60,
          capacidad: 10,
          nivel: "intermedio",
          color: "#8B5CF6",
          activo: true,
        },
        {
          nombre: "Aquaerobics",
          descripcion: "Ejercicio aeróbico en el agua",
          duracion: 50,
          capacidad: 15,
          color: "#10B981",
          activo: true,
        },
        {
          nombre: "Natación Bebés",
          descripcion: "Estimulación acuática para bebés de 6 meses a 3 años",
          duracion: 30,
          capacidad: 6,
          nivel: "principiante",
          color: "#F59E0B",
          activo: true,
        },
      ])
      .returning();
    console.log(`  ${classesData.length} clases creadas`);

    // Crear horarios
    console.log("Creando horarios...");
    const natacionNinos = classesData.find((c) => c.nombre === "Natación Niños 5-8")!;
    const natacionAdultos = classesData.find((c) => c.nombre === "Natación Adultos")!;
    const aquaerobics = classesData.find((c) => c.nombre === "Aquaerobics")!;

    await db.insert(schedules).values([
      // Lunes
      {
        classId: natacionNinos.id,
        instructorId: instructorsData[0].id,
        diaSemana: 1,
        horaInicio: "09:00",
        horaFin: "09:45",
        carril: "1",
        activo: true,
      },
      {
        classId: natacionAdultos.id,
        instructorId: instructorsData[2].id,
        diaSemana: 1,
        horaInicio: "10:00",
        horaFin: "11:00",
        carril: "2",
        activo: true,
      },
      {
        classId: aquaerobics.id,
        instructorId: instructorsData[1].id,
        diaSemana: 1,
        horaInicio: "18:00",
        horaFin: "18:50",
        activo: true,
      },
      // Miércoles
      {
        classId: natacionNinos.id,
        instructorId: instructorsData[0].id,
        diaSemana: 3,
        horaInicio: "09:00",
        horaFin: "09:45",
        carril: "1",
        activo: true,
      },
      {
        classId: aquaerobics.id,
        instructorId: instructorsData[1].id,
        diaSemana: 3,
        horaInicio: "18:00",
        horaFin: "18:50",
        activo: true,
      },
      // Viernes
      {
        classId: natacionNinos.id,
        instructorId: instructorsData[0].id,
        diaSemana: 5,
        horaInicio: "09:00",
        horaFin: "09:45",
        carril: "1",
        activo: true,
      },
      {
        classId: natacionAdultos.id,
        instructorId: instructorsData[2].id,
        diaSemana: 5,
        horaInicio: "10:00",
        horaFin: "11:00",
        carril: "2",
        activo: true,
      },
      // Sábado
      {
        classId: aquaerobics.id,
        instructorId: instructorsData[1].id,
        diaSemana: 6,
        horaInicio: "09:00",
        horaFin: "09:50",
        activo: true,
      },
    ]);
    console.log("  8 horarios creados");

    console.log("\n✓ Seed completado exitosamente!");
    console.log("\nPuedes iniciar sesión con:");
    console.log("  Email: admin@erp.com");
    console.log("  Password: admin123");
    console.log("\nO con:");
    console.log("  Email: usuario@erp.com");
    console.log("  Password: usuario123");

    process.exit(0);
  } catch (error) {
    console.error("Error en seed:", error);
    process.exit(1);
  }
}

seed();
