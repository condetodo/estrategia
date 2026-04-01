# ROADMAP - Plan Estratégico Digital

## Sprint 1: Fundaciones
- [x] 1.1 Inicializar proyecto Next.js 15 + Prisma + Tailwind + NextAuth
- [x] 1.2 Crear schema Prisma con todas las entidades
- [x] 1.3 Seed con datos reales de Agro Patagónico 2026
- [x] 1.4 API Routes + Server Actions para CRUD

## Sprint 2: Vista Gantt Interactiva
- [x] 2.1 Layout principal: header, navegación, contenedor
- [x] 2.2 Componente GanttView con datos de la API
- [x] 2.3 Panel drill-down lateral con cambio de status
- [x] 2.4 Barra de direcciones estratégicas

## Sprint 3: Dashboard Ejecutivo
- [x] 3.1 KPI cards: total, completadas, en curso, bloqueadas
- [x] 3.2 Progress rings por área
- [x] 3.3 Gráfico de avance mensual (Recharts)
- [x] 3.4 Tabla resumen por dirección estratégica

## Sprint 4: Usuarios y Permisos
- [x] 4.1 Configurar NextAuth con login Google + credenciales
- [x] 4.2 Middleware de protección de rutas
- [x] 4.3 Asignación de responsables a items
- [x] 4.4 Vista filtrada: Mis Tareas

## Sprint 5: Pulido y Deploy
- [x] 5.1 Responsive design + mobile
- [x] 5.2 Importador de Excel
- [x] 5.3 Exportar a PDF / Excel
- [x] 5.4 Deploy: Vercel + Railway (https://estrategia-chi.vercel.app)

## Sprint 6: Creación de Plan desde Cero
- [x] 6.1 Server Actions para ciclo de vida de planes (create, activate, archive, delete)
- [x] 6.2 Empty state inteligente (admin vs no-admin) en todas las páginas
- [x] 6.3 Wizard de creación de plan (4 pasos: datos, direcciones, áreas, activar)
- [x] 6.4 Agregar items inline en el Gantt (+ por área)
- [x] 6.5 Agregar/eliminar tareas inline en drill-down panel
- [x] 6.6 Gestión de planes en Herramientas (listar, activar, archivar, eliminar)

## Sprint 7: Edición Inline de Áreas
- [x] 7.1 Server actions para CRUD de áreas (add, update, delete)
- [x] 7.2 Toggle "Editar áreas" en Gantt (admin-only)
- [x] 7.3 Area headers editables (nombre, color, eliminar con cascada)
- [x] 7.4 Formulario inline para agregar área nueva

## Post-MVP (Productización)
- [ ] Vista por rol (cada usuario ve sus áreas; admins ven todo)
- [ ] Clonar plan del año anterior
- [ ] Notificaciones (email/WhatsApp)
- [ ] Integración Google Calendar
- [ ] Reportes automáticos con IA
- [ ] Historial y auditoría
- [ ] Comentarios y notas por tarea
