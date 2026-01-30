import {
  format,
  formatDistanceToNow,
  isAfter,
  isBefore,
  addDays,
  differenceInDays,
  parseISO,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from "date-fns";
import { es } from "date-fns/locale";

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "d 'de' MMMM, yyyy", { locale: es });
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd/MM/yyyy", { locale: es });
}

export function formatTime(time: string): string {
  return time;
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "d MMM yyyy, HH:mm", { locale: es });
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: es });
}

export function isExpired(date: Date | string): boolean {
  const d = typeof date === "string" ? parseISO(date) : date;
  return isBefore(d, new Date());
}

export function isExpiringSoon(date: Date | string, daysThreshold = 7): boolean {
  const d = typeof date === "string" ? parseISO(date) : date;
  const threshold = addDays(new Date(), daysThreshold);
  return isBefore(d, threshold) && isAfter(d, new Date());
}

export function daysUntilExpiration(date: Date | string): number {
  const d = typeof date === "string" ? parseISO(date) : date;
  return differenceInDays(d, new Date());
}

export function getDayOfWeek(day: number): string {
  const days = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  return days[day] || "";
}

export function getShortDayOfWeek(day: number): string {
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  return days[day] || "";
}

export function getWeekDays(date: Date = new Date()): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function calculateAge(birthDate: Date | string): number {
  const d = typeof birthDate === "string" ? parseISO(birthDate) : birthDate;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const monthDiff = today.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d.getDate())) {
    age--;
  }
  return age;
}

export { startOfDay, endOfDay, startOfWeek, endOfWeek, addDays, parseISO };
