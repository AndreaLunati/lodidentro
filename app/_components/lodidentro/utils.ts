import type { BookingStatus, Group } from './types';

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function isUserInGroup(group: Group, userId: string) {
  return Boolean(userId && userId !== 'guest' && group.members.some((member) => member.id === userId));
}

export function isPastEvent(group: Group) {
  return new Date(group.selectedDate).getTime() < Date.now() - 8 * 60 * 60 * 1000;
}

export function effectiveStatus(group: Group): BookingStatus {
  if (group.bookingStatus === 'CANCELLED') return 'CANCELLED';
  if (group.bookingStatus === 'COMPLETED' || isPastEvent(group)) return 'COMPLETED';
  return group.bookingStatus;
}

export function getGroupStatus(group: Group) {
  const status = effectiveStatus(group);
  const count = group.members.length;
  if (status === 'CANCELLED') return { label: 'Annullato', tone: 'bg-red-50 text-red-700', dot: 'bg-red-500' };
  if (status === 'COMPLETED') return { label: 'Concluso', tone: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' };
  if (status === 'BOOKED' || count >= group.minCapacity) return { label: 'Confermato', tone: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' };
  const missing = Math.max(group.minCapacity - count, 0);
  return { label: missing === 1 ? 'Manca 1 persona' : `Mancano ${missing}`, tone: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' };
}

export function formatEventDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

export function formatEuro(value: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
}

export function canCheckInNow(group: Group) {
  if (effectiveStatus(group) !== 'BOOKED') return false;
  const eventTime = new Date(group.selectedDate).getTime();
  const now = Date.now();
  return now >= eventTime - 4 * 60 * 60 * 1000 && now <= eventTime + 8 * 60 * 60 * 1000;
}

export function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function normalizeInstagram(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

export function randomCode(prefix: string) {
  return `${prefix}${Math.floor(100 + Math.random() * 900)}`;
}

export function toLocalDateTimeInput(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function eventShareUrl(groupId: string) {
  if (typeof window === 'undefined') return `/?event=${groupId}`;
  return `${window.location.origin}/?event=${encodeURIComponent(groupId)}`;
}
