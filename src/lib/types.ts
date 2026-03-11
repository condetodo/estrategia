import type { TaskStatus } from "@/generated/prisma/enums";

export type PlanWithDetails = {
  id: string;
  year: number;
  company: string;
  status: string;
  directions: DirectionData[];
  areas: AreaWithItems[];
};

export type DirectionData = {
  id: string;
  number: number;
  description: string;
};

export type AreaWithItems = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  order: number;
  items: ItemWithTasks[];
};

export type ItemWithTasks = {
  id: string;
  subtheme: string;
  agenda: string | null;
  order: number;
  direction: { id: string; number: number; description: string } | null;
  responsible: { id: string; name: string; initials: string | null } | null;
  tasks: TaskData[];
};

export type TaskData = {
  id: string;
  name: string;
  startMonth: number;
  endMonth: number;
  status: TaskStatus;
  notes: string | null;
};

export type UserOption = {
  id: string;
  name: string;
  initials: string | null;
};

// -- Plan management types --

export type PlanSummary = {
  id: string;
  year: number;
  company: string;
  status: string;
  _count: { areas: number; directions: number };
};

export type WizardPlanData = {
  id: string;
  year: number;
  company: string;
  status: string;
  directions: DirectionData[];
  areas: { id: string; name: string; color: string; icon: string | null; order: number }[];
};

export const AREA_COLORS = [
  { value: "#2563EB", label: "Azul" },
  { value: "#16A34A", label: "Verde" },
  { value: "#EA580C", label: "Naranja" },
  { value: "#9333EA", label: "Violeta" },
  { value: "#DC2626", label: "Rojo" },
  { value: "#0891B2", label: "Turquesa" },
  { value: "#D97706", label: "Ámbar" },
  { value: "#DB2777", label: "Rosa" },
] as const;

// -- Constants --

export const MONTHS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
] as const;

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  NOT_STARTED: { label: "Sin iniciar", color: "#94a3b8", bg: "#f1f5f9" },
  IN_PROGRESS: { label: "En curso", color: "#2563eb", bg: "#dbeafe" },
  COMPLETED: { label: "Completada", color: "#16a34a", bg: "#dcfce7" },
  BLOCKED: { label: "Bloqueada", color: "#dc2626", bg: "#fee2e2" },
};
