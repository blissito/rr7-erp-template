import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/alberca";

// Schemas inline para el seed
const userSchema = new mongoose.Schema({
  email: String,
  passwordHash: String,
  nombre: String,
  rol: String,
  activo: Boolean,
}, { timestamps: true });

const memberSchema = new mongoose.Schema({
  numeroMiembro: String,
  nombre: String,
  apellidos: String,
  email: String,
  telefono: String,
  fechaNacimiento: Date,
  notas: String,
  activo: Boolean,
}, { timestamps: true });

const membershipTypeSchema = new mongoose.Schema({
  nombre: String,
  duracionDias: Number,
  precio: Number,
  descripcion: String,
  accesosIncluidos: Number,
  activo: Boolean,
}, { timestamps: true });

const memberMembershipSchema = new mongoose.Schema({
  memberId: mongoose.Schema.Types.ObjectId,
  membershipTypeId: mongoose.Schema.Types.ObjectId,
  fechaInicio: Date,
  fechaFin: Date,
  estado: String,
  montoPagado: Number,
  metodoPago: String,
  createdBy: mongoose.Schema.Types.ObjectId,
}, { timestamps: true });

const classSchema = new mongoose.Schema({
  nombre: String,
  descripcion: String,
  duracionMinutos: Number,
  capacidadMaxima: Number,
  nivel: String,
  edadMinima: Number,
  edadMaxima: Number,
  activo: Boolean,
}, { timestamps: true });

const instructorSchema = new mongoose.Schema({
  nombre: String,
  apellidos: String,
  telefono: String,
  email: String,
  especialidades: [String],
  activo: Boolean,
}, { timestamps: true });

const scheduleSchema = new mongoose.Schema({
  classId: mongoose.Schema.Types.ObjectId,
  instructorId: mongoose.Schema.Types.ObjectId,
  diaSemana: Number,
  horaInicio: String,
  horaFin: String,
  carril: Number,
  activo: Boolean,
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Member = mongoose.model("Member", memberSchema);
const MembershipType = mongoose.model("MembershipType", membershipTypeSchema);
const MemberMembership = mongoose.model("MemberMembership", memberMembershipSchema);
const Class = mongoose.model("Class", classSchema);
const Instructor = mongoose.model("Instructor", instructorSchema);
const Schedule = mongoose.model("Schedule", scheduleSchema);

async function seed() {
  console.log("Conectando a MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Conectado!");

  // Limpiar colecciones existentes
  console.log("Limpiando datos existentes...");
  await Promise.all([
    User.deleteMany({}),
    Member.deleteMany({}),
    MembershipType.deleteMany({}),
    MemberMembership.deleteMany({}),
    Class.deleteMany({}),
    Instructor.deleteMany({}),
    Schedule.deleteMany({}),
  ]);

  // Crear usuario admin
  console.log("Creando usuario admin...");
  const passwordHash = await bcrypt.hash("admin123", 10);
  const admin = await User.create({
    email: "admin@alberca.com",
    passwordHash,
    nombre: "Administrador",
    rol: "admin",
    activo: true,
  });
  console.log("  Email: admin@alberca.com");
  console.log("  Password: admin123");

  // Crear usuario recepción
  const recepcion = await User.create({
    email: "recepcion@alberca.com",
    passwordHash: await bcrypt.hash("recepcion123", 10),
    nombre: "Maria Recepcion",
    rol: "recepcion",
    activo: true,
  });

  // Crear tipos de membresía
  console.log("Creando tipos de membresia...");
  const membershipTypes = await MembershipType.create([
    {
      nombre: "Pase de Dia",
      duracionDias: 1,
      precio: 80,
      descripcion: "Acceso por un dia",
      accesosIncluidos: 1,
      activo: true,
    },
    {
      nombre: "Semanal",
      duracionDias: 7,
      precio: 300,
      descripcion: "Acceso ilimitado por una semana",
      activo: true,
    },
    {
      nombre: "Mensual",
      duracionDias: 30,
      precio: 800,
      descripcion: "Acceso ilimitado por un mes",
      activo: true,
    },
    {
      nombre: "Trimestral",
      duracionDias: 90,
      precio: 2000,
      descripcion: "Acceso ilimitado por tres meses",
      activo: true,
    },
    {
      nombre: "Anual",
      duracionDias: 365,
      precio: 6000,
      descripcion: "Acceso ilimitado por un año",
      activo: true,
    },
  ]);
  console.log(`  ${membershipTypes.length} tipos creados`);

  // Crear miembros de ejemplo
  console.log("Creando miembros de ejemplo...");
  const members = await Member.create([
    {
      numeroMiembro: "M001",
      nombre: "Juan",
      apellidos: "Perez Garcia",
      email: "juan@email.com",
      telefono: "5512345678",
      fechaNacimiento: new Date("1990-05-15"),
      activo: true,
    },
    {
      numeroMiembro: "M002",
      nombre: "Maria",
      apellidos: "Lopez Martinez",
      email: "maria@email.com",
      telefono: "5523456789",
      fechaNacimiento: new Date("1985-08-20"),
      activo: true,
    },
    {
      numeroMiembro: "M003",
      nombre: "Carlos",
      apellidos: "Hernandez Ruiz",
      telefono: "5534567890",
      fechaNacimiento: new Date("1995-03-10"),
      activo: true,
    },
    {
      numeroMiembro: "M004",
      nombre: "Ana",
      apellidos: "Gonzalez Flores",
      email: "ana@email.com",
      telefono: "5545678901",
      fechaNacimiento: new Date("2000-12-01"),
      activo: true,
    },
    {
      numeroMiembro: "M005",
      nombre: "Pedro",
      apellidos: "Sanchez Luna",
      telefono: "5556789012",
      fechaNacimiento: new Date("1988-07-25"),
      activo: true,
    },
  ]);
  console.log(`  ${members.length} miembros creados`);

  // Crear membresías activas
  console.log("Asignando membresias...");
  const today = new Date();
  const mensualType = membershipTypes.find(t => t.nombre === "Mensual");
  const trimestralType = membershipTypes.find(t => t.nombre === "Trimestral");

  await MemberMembership.create([
    {
      memberId: members[0]._id,
      membershipTypeId: mensualType!._id,
      fechaInicio: today,
      fechaFin: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
      estado: "activa",
      montoPagado: 800,
      metodoPago: "efectivo",
      createdBy: admin._id,
    },
    {
      memberId: members[1]._id,
      membershipTypeId: trimestralType!._id,
      fechaInicio: today,
      fechaFin: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000),
      estado: "activa",
      montoPagado: 2000,
      metodoPago: "tarjeta",
      createdBy: admin._id,
    },
    {
      memberId: members[2]._id,
      membershipTypeId: mensualType!._id,
      fechaInicio: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000),
      fechaFin: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
      estado: "activa",
      montoPagado: 800,
      metodoPago: "transferencia",
      createdBy: admin._id,
    },
  ]);

  // Crear instructores
  console.log("Creando instructores...");
  const instructors = await Instructor.create([
    {
      nombre: "Roberto",
      apellidos: "Torres Medina",
      telefono: "5511111111",
      email: "roberto@alberca.com",
      especialidades: ["natacion", "waterpolo"],
      activo: true,
    },
    {
      nombre: "Laura",
      apellidos: "Vega Castro",
      telefono: "5522222222",
      email: "laura@alberca.com",
      especialidades: ["aquaerobics", "natacion"],
      activo: true,
    },
    {
      nombre: "Miguel",
      apellidos: "Diaz Ortega",
      telefono: "5533333333",
      especialidades: ["natacion"],
      activo: true,
    },
  ]);
  console.log(`  ${instructors.length} instructores creados`);

  // Crear clases
  console.log("Creando clases...");
  const classes = await Class.create([
    {
      nombre: "Natacion Ninos 5-8",
      descripcion: "Clases de natacion para ninos de 5 a 8 anos",
      duracionMinutos: 45,
      capacidadMaxima: 8,
      nivel: "principiante",
      edadMinima: 5,
      edadMaxima: 8,
      activo: true,
    },
    {
      nombre: "Natacion Adultos",
      descripcion: "Clases de natacion para adultos de todos los niveles",
      duracionMinutos: 60,
      capacidadMaxima: 10,
      nivel: "intermedio",
      activo: true,
    },
    {
      nombre: "Aquaerobics",
      descripcion: "Ejercicio aerobico en el agua",
      duracionMinutos: 50,
      capacidadMaxima: 15,
      activo: true,
    },
    {
      nombre: "Natacion Bebes",
      descripcion: "Estimulacion acuatica para bebes de 6 meses a 3 anos",
      duracionMinutos: 30,
      capacidadMaxima: 6,
      nivel: "principiante",
      edadMinima: 0,
      edadMaxima: 3,
      activo: true,
    },
  ]);
  console.log(`  ${classes.length} clases creadas`);

  // Crear horarios
  console.log("Creando horarios...");
  const natacionNinos = classes.find(c => c.nombre === "Natacion Ninos 5-8");
  const natacionAdultos = classes.find(c => c.nombre === "Natacion Adultos");
  const aquaerobics = classes.find(c => c.nombre === "Aquaerobics");

  await Schedule.create([
    // Lunes
    {
      classId: natacionNinos!._id,
      instructorId: instructors[0]._id,
      diaSemana: 1,
      horaInicio: "09:00",
      horaFin: "09:45",
      carril: 1,
      activo: true,
    },
    {
      classId: natacionAdultos!._id,
      instructorId: instructors[2]._id,
      diaSemana: 1,
      horaInicio: "10:00",
      horaFin: "11:00",
      carril: 2,
      activo: true,
    },
    {
      classId: aquaerobics!._id,
      instructorId: instructors[1]._id,
      diaSemana: 1,
      horaInicio: "18:00",
      horaFin: "18:50",
      activo: true,
    },
    // Miercoles
    {
      classId: natacionNinos!._id,
      instructorId: instructors[0]._id,
      diaSemana: 3,
      horaInicio: "09:00",
      horaFin: "09:45",
      carril: 1,
      activo: true,
    },
    {
      classId: aquaerobics!._id,
      instructorId: instructors[1]._id,
      diaSemana: 3,
      horaInicio: "18:00",
      horaFin: "18:50",
      activo: true,
    },
    // Viernes
    {
      classId: natacionNinos!._id,
      instructorId: instructors[0]._id,
      diaSemana: 5,
      horaInicio: "09:00",
      horaFin: "09:45",
      carril: 1,
      activo: true,
    },
    {
      classId: natacionAdultos!._id,
      instructorId: instructors[2]._id,
      diaSemana: 5,
      horaInicio: "10:00",
      horaFin: "11:00",
      carril: 2,
      activo: true,
    },
    // Sabado
    {
      classId: aquaerobics!._id,
      instructorId: instructors[1]._id,
      diaSemana: 6,
      horaInicio: "09:00",
      horaFin: "09:50",
      activo: true,
    },
  ]);
  console.log("  8 horarios creados");

  console.log("\n✓ Seed completado exitosamente!");
  console.log("\nPuedes iniciar sesion con:");
  console.log("  Email: admin@alberca.com");
  console.log("  Password: admin123");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Error en seed:", err);
  process.exit(1);
});
