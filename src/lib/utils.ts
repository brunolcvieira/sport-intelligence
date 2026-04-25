import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
}

export function formatTime(date: Date | string): string {
  return format(new Date(date), "HH:mm", { locale: ptBR });
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function pct(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
