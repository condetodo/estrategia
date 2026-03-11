import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { TaskStatus, PlanStatus, UserRole } from "../src/generated/prisma/enums";

// Default password for all seeded users
const DEFAULT_PASSWORD = bcrypt.hashSync("plan2026", 10);

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean existing data
  await prisma.task.deleteMany();
  await prisma.item.deleteMany();
  await prisma.direction.deleteMany();
  await prisma.area.deleteMany();
  await prisma.strategicPlan.deleteMany();
  await prisma.user.deleteMany();

  // -- Users (responsibles from the spreadsheet) --
  const users = await Promise.all([
    prisma.user.create({
      data: { name: "Federico Weiss", email: "fw@agropatagonico.com", password: DEFAULT_PASSWORD, role: UserRole.LEADER, initials: "FW" },
    }),
    prisma.user.create({
      data: { name: "Pablo Sanchez", email: "ps@agropatagonico.com", password: DEFAULT_PASSWORD, role: UserRole.LEADER, initials: "PS" },
    }),
    prisma.user.create({
      data: { name: "Fernando Perez", email: "fp@agropatagonico.com", password: DEFAULT_PASSWORD, role: UserRole.ADMIN, initials: "FP" },
    }),
    prisma.user.create({
      data: { name: "Ricardo Diaz", email: "rd@agropatagonico.com", password: DEFAULT_PASSWORD, role: UserRole.LEADER, initials: "RD" },
    }),
    prisma.user.create({
      data: { name: "Sergio Suarez", email: "ss@agropatagonico.com", password: DEFAULT_PASSWORD, role: UserRole.LEADER, initials: "SS" },
    }),
  ]);

  const [fw, ps, fp, rd, ss] = users;

  // -- Strategic Plan --
  const plan = await prisma.strategicPlan.create({
    data: {
      year: 2026,
      company: "Agro Patagónico S.A.",
      status: PlanStatus.ACTIVE,
    },
  });

  // -- Strategic Directions --
  const directions = await Promise.all([
    prisma.direction.create({
      data: {
        number: 1,
        description: "Consolidar un sistema de gestión que trascienda a las personas (Esquema Funcional)",
        planId: plan.id,
      },
    }),
    prisma.direction.create({
      data: {
        number: 2,
        description: "Ofrecer servicios con estándar de calidad por encima de la media (Mayor tarifa)",
        planId: plan.id,
      },
    }),
    prisma.direction.create({
      data: {
        number: 3,
        description: "Diversificar negocios para no ser \"Mono-Producto\" ó \"Mono-Destino\"",
        planId: plan.id,
      },
    }),
    prisma.direction.create({
      data: {
        number: 4,
        description: "Desarrollar la gestión comercial del negocio (Asegurar ventas y rotación)",
        planId: plan.id,
      },
    }),
  ]);

  const [dir1, dir2, dir3, dir4] = directions;

  // -- Areas --
  const areas = await Promise.all([
    prisma.area.create({
      data: { name: "Comercial", color: "#2563EB", icon: "briefcase", order: 1, planId: plan.id },
    }),
    prisma.area.create({
      data: { name: "Administración", color: "#16A34A", icon: "calculator", order: 2, planId: plan.id },
    }),
    prisma.area.create({
      data: { name: "Planta", color: "#EA580C", icon: "factory", order: 3, planId: plan.id },
    }),
    prisma.area.create({
      data: { name: "RRHH", color: "#9333EA", icon: "users", order: 4, planId: plan.id },
    }),
  ]);

  const [comercial, admin, planta, rrhh] = areas;

  // ============================================
  // COMERCIAL - Items & Tasks
  // ============================================

  // Item: Nuevos Destinos - Habilitación Etapa 1
  const habEtapa1 = await prisma.item.create({
    data: {
      subtheme: "Nuevos Destinos",
      agenda: "Habilitación Etapa 1 (Depósito)",
      order: 1,
      areaId: comercial.id,
      directionId: dir3.id,
      responsibleId: fw.id,
    },
  });
  await Promise.all([
    prisma.task.create({
      data: { name: "Auditoría (OK)", startMonth: 1, endMonth: 1, status: TaskStatus.COMPLETED, itemId: habEtapa1.id },
    }),
    prisma.task.create({
      data: { name: "Habilitación legal", startMonth: 2, endMonth: 2, status: TaskStatus.NOT_STARTED, itemId: habEtapa1.id },
    }),
  ]);

  // Item: Nuevos Destinos - Habilitación Etapa 2
  const habEtapa2 = await prisma.item.create({
    data: {
      subtheme: "Nuevos Destinos",
      agenda: "Habilitación Etapa 2 (Despostada)",
      order: 2,
      areaId: comercial.id,
      directionId: dir3.id,
      responsibleId: fw.id,
    },
  });
  await Promise.all([
    prisma.task.create({
      data: { name: "Auditoría (OK, faltan obras)", startMonth: 1, endMonth: 1, status: TaskStatus.COMPLETED, itemId: habEtapa2.id },
    }),
    prisma.task.create({
      data: { name: "Fin de obra", startMonth: 5, endMonth: 5, status: TaskStatus.NOT_STARTED, itemId: habEtapa2.id },
    }),
    prisma.task.create({
      data: { name: "Inspección", startMonth: 6, endMonth: 6, status: TaskStatus.NOT_STARTED, itemId: habEtapa2.id },
    }),
  ]);

  // Item: Gestión Comercial - Proyectar Negocio
  const proyectar = await prisma.item.create({
    data: {
      subtheme: "Gestión Comercial",
      agenda: "Proyectar Negocio Agro 2026",
      order: 3,
      areaId: comercial.id,
      directionId: dir4.id,
      responsibleId: fw.id,
    },
  });
  await Promise.all([
    prisma.task.create({
      data: { name: "Análisis escenarios posibles", startMonth: 1, endMonth: 1, status: TaskStatus.COMPLETED, itemId: proyectar.id },
    }),
    prisma.task.create({
      data: { name: "Armado de plan estratégico 2026", startMonth: 3, endMonth: 3, status: TaskStatus.NOT_STARTED, itemId: proyectar.id },
    }),
  ]);

  // Item: Gestión Comercial - Búsqueda nuevos Clientes
  await prisma.item.create({
    data: {
      subtheme: "Gestión Comercial",
      agenda: "Búsqueda nuevos Clientes",
      order: 4,
      areaId: comercial.id,
      directionId: dir4.id,
      responsibleId: fw.id,
    },
  });

  // Item: Nuevos negocios
  const nuevosNegocios = await prisma.item.create({
    data: {
      subtheme: "Nuevos negocios",
      agenda: "Análisis oportunidades y desarrollo planes de negocios",
      order: 5,
      areaId: comercial.id,
      directionId: dir3.id,
      responsibleId: fw.id,
    },
  });
  await prisma.task.create({
    data: { name: "Desarrollo BP para fábrica H&S", startMonth: 1, endMonth: 2, status: TaskStatus.NOT_STARTED, itemId: nuevosNegocios.id },
  });

  // ============================================
  // ADMINISTRACIÓN - Items & Tasks
  // ============================================

  // Item: Consolidación de la estructura del área
  const consolAdmin = await prisma.item.create({
    data: {
      subtheme: "Consolidación de la estructura del área",
      agenda: "Búsqueda recursos acordes a la función a desarrollar + Reuniones con CR",
      order: 1,
      areaId: admin.id,
      directionId: dir1.id,
      responsibleId: rd.id,
    },
  });
  await prisma.task.create({
    data: { name: "Planificación y re adecuación del equipo administrativo", startMonth: 3, endMonth: 3, status: TaskStatus.NOT_STARTED, itemId: consolAdmin.id },
  });

  // Item: Orden Agenda y KPI de los perfiles
  await prisma.item.create({
    data: {
      subtheme: "Orden Agenda y KPI de los perfiles",
      agenda: "Comunicación resultados esperados de la función y agenda",
      order: 2,
      areaId: admin.id,
      directionId: dir1.id,
      responsibleId: rd.id,
    },
  });

  // Item: Desarrollo Agenda del Sector
  const agendaSector = await prisma.item.create({
    data: {
      subtheme: "Desarrollo Agenda del Sector (Hitos 2026)",
      agenda: "Identificar principales temas a desarrollar en 2026 con el equipo",
      order: 3,
      areaId: admin.id,
      directionId: dir1.id,
      responsibleId: rd.id,
    },
  });
  await prisma.task.create({
    data: {
      name: "Actualización de infraestructura informática del sector administrativo",
      notes: "Mejora de los servidores, instalación nuevo router y actualización de tango a la última versión",
      startMonth: 4,
      endMonth: 4,
      status: TaskStatus.NOT_STARTED,
      itemId: agendaSector.id,
    },
  });

  // ============================================
  // PLANTA - Items & Tasks
  // ============================================

  // Item: Equipo
  await prisma.item.create({
    data: {
      subtheme: "Equipo",
      agenda: "Consolidación de las posiciones de liderazgo y 2das líneas",
      order: 1,
      areaId: planta.id,
      directionId: dir1.id,
      responsibleId: fw.id,
    },
  });

  // Item: Obras
  const obras = await prisma.item.create({
    data: {
      subtheme: "Obras",
      agenda: "Cronograma de obras principales (hitos del mes)",
      order: 2,
      areaId: planta.id,
      directionId: dir2.id,
      responsibleId: fw.id,
    },
  });
  await prisma.task.create({
    data: {
      name: "Definir esquema de obras para el 2026",
      notes: "Cámara 9 + picking, cámara 10 (re adecuación H&S), Nuevo tablero de baja, Re organización de tableros de potencia compresores, re organización tableros eléctricos SDM",
      startMonth: 2,
      endMonth: 2,
      status: TaskStatus.NOT_STARTED,
      itemId: obras.id,
    },
  });

  // Item: Herramental - Listado
  await prisma.item.create({
    data: {
      subtheme: "Herramental",
      agenda: "Listado necesidades actualizado",
      order: 3,
      areaId: planta.id,
      directionId: dir2.id,
      responsibleId: fw.id,
    },
  });

  // Item: Herramental - Plan de Compras
  await prisma.item.create({
    data: {
      subtheme: "Herramental",
      agenda: "Plan de Compras y erogaciones",
      order: 4,
      areaId: planta.id,
      directionId: dir2.id,
      responsibleId: fw.id,
    },
  });

  // Item: Procesos
  await prisma.item.create({
    data: {
      subtheme: "Procesos",
      agenda: null,
      order: 5,
      areaId: planta.id,
      directionId: dir2.id,
      responsibleId: fw.id,
    },
  });

  // Item: Gestión
  await prisma.item.create({
    data: {
      subtheme: "Gestión",
      agenda: "Orden Agenda y KPI de los perfiles de Liderazgo",
      order: 6,
      areaId: planta.id,
      directionId: dir1.id,
      responsibleId: fw.id,
    },
  });

  // ============================================
  // RRHH - Items & Tasks
  // ============================================

  // Item: Organigrama Funcional
  await prisma.item.create({
    data: {
      subtheme: "Organigrama Funcional",
      agenda: "Actualización 2026 estructura deseada (Agro y Campos)",
      order: 1,
      areaId: rrhh.id,
      directionId: dir1.id,
      responsibleId: rd.id,
    },
  });

  // Item: Búsquedas
  const busquedas = await prisma.item.create({
    data: {
      subtheme: "Búsquedas",
      agenda: "Cobertura de posiciones críticas (Adm., Mant., Planta)",
      order: 2,
      areaId: rrhh.id,
      directionId: dir1.id,
      responsibleId: rd.id,
    },
  });
  await Promise.all([
    prisma.task.create({
      data: { name: "Confirmación / Recepción CV", startMonth: 1, endMonth: 1, status: TaskStatus.NOT_STARTED, itemId: busquedas.id },
    }),
    prisma.task.create({
      data: { name: "Entrevistas", startMonth: 3, endMonth: 3, status: TaskStatus.NOT_STARTED, itemId: busquedas.id },
    }),
  ]);

  // Item: Plan de RRHH
  await prisma.item.create({
    data: {
      subtheme: "Plan de RRHH",
      agenda: "Desarrollo plan de acciones 1er semestre 2026",
      order: 3,
      areaId: rrhh.id,
      directionId: dir1.id,
      responsibleId: rd.id,
    },
  });

  // Item: Política de RRHH
  const politica = await prisma.item.create({
    data: {
      subtheme: "Política de RRHH",
      agenda: "Actualización y Validación reglas 2026 de la Empresa para comunicar a los Líderes",
      order: 4,
      areaId: rrhh.id,
      directionId: dir1.id,
      responsibleId: rd.id,
    },
  });
  await Promise.all([
    prisma.task.create({
      data: { name: "Actualización", startMonth: 1, endMonth: 1, status: TaskStatus.NOT_STARTED, itemId: politica.id },
    }),
    prisma.task.create({
      data: { name: "Validación", startMonth: 3, endMonth: 3, status: TaskStatus.NOT_STARTED, itemId: politica.id },
    }),
  ]);

  console.log("Seed completed successfully!");
  console.log(`  - 1 Strategic Plan (${plan.year})`);
  console.log(`  - ${directions.length} Directions`);
  console.log(`  - ${areas.length} Areas`);
  console.log(`  - ${users.length} Users`);
  console.log(`  - Items and Tasks created for all areas`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
