import type { RecordModel } from "pocketbase";

export type Role = "corporativo" | "rh" | "admin" | "adminvip";

export type BookingStatus = "pending" | "approved" | "rejected";

export interface UserRecord extends RecordModel {
  email: string;
  name?: string;
  role: Role;
}

export interface Room extends RecordModel {
  name: string;
  capacity?: number;
  active: boolean;
}

export interface Booking extends RecordModel {
  room: string;
  reason: string;
  start: string;
  end: string;
  people_count: number;
  requester_email: string;
  requested_by: string;
  status: BookingStatus;
  rejection_reason?: string;
  wants_coffee: boolean;
  wants_cookies: boolean;
  wants_water: boolean;
  wants_snack: boolean;
  no_extras: boolean;
  coffee_approved: boolean;
  cookies_approved: boolean;
  water_approved: boolean;
  snack_approved: boolean;
  extras_comment?: string;
  expand?: {
    room?: Room;
    requested_by?: UserRecord;
  };
}

export const EXTRA_ITEMS = [
  { key: "wants_coffee", approvedKey: "coffee_approved", label: "Café" },
  { key: "wants_cookies", approvedKey: "cookies_approved", label: "Galletas" },
  { key: "wants_water", approvedKey: "water_approved", label: "Agua" },
  { key: "wants_snack", approvedKey: "snack_approved", label: "Snack" },
] as const;

export type NotificationType = "new_request" | "rejected" | "approved";

export interface AppNotification extends RecordModel {
  recipient: string;
  booking?: string;
  type: NotificationType;
  message: string;
  read: boolean;
}

export const ROLE_LABELS: Record<Role, string> = {
  corporativo: "Corporativo",
  rh: "RH",
  admin: "Admin",
  adminvip: "Admin VIP",
};

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

export function canManageRequests(role: Role): boolean {
  return role === "rh" || role === "admin" || role === "adminvip";
}

export function canManageUsers(role: Role): boolean {
  return role === "admin" || role === "adminvip";
}

export function canAssignRoles(role: Role): boolean {
  return role === "adminvip";
}
