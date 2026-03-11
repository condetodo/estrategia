# Proyecto: Plan Estratégico Digital

Aplicación web para gestionar planes estratégicos anuales de forma interactiva.

## Stack
- Next.js 15 (App Router) + React 19
- Prisma ORM + PostgreSQL (Railway)
- Tailwind CSS v4
- NextAuth v5 (Auth.js)
- Recharts (gráficos)
- Deploy: Vercel (front) + Railway (DB)

## Convenciones
- UI: Español
- Código y comentarios: Inglés
- Componentes: PascalCase
- Archivos: kebab-case
- API: RESTful para GETs y uploads/downloads
- Server Actions: para mutaciones simples desde la UI

## Estructura
```
/src
  /app          - Pages (App Router)
  /app/api      - API Routes (GET endpoints, file upload/download)
  /components   - React components
  /lib          - Prisma client, auth config, utilities
  /actions      - Server Actions (mutations)
  /generated    - Prisma generated client (gitignored)
/prisma
  schema.prisma - Data model
  seed.ts       - Seed data from real spreadsheet
  /migrations   - DB migrations
```

## Regla Server Actions vs API Routes
- Botón en la UI que muta datos → Server Action
- Devuelve archivo, recibe uploads, o alimenta un componente con fetch → API Route

## Actualizar ROADMAP.md al terminar cada tarea.
