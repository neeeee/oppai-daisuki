import { User } from "next-auth";

export interface AdminUser extends User {
  role?: string;
  ip?: string;
  loginTime?: number;
}

export interface ExtendedSession {
  user: AdminUser;
}

export interface ExtendedToken {
  role?: string;
  ip?: string;
  loginTime?: number;
}

export interface LoginAttempt {
  ip: string;
  attempts: number;
  lastAttempt: Date;
  lockedUntil?: Date;
}

export interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutTime: number;
  sessionMaxAge: number;
  allowedIPs: string[];
  strictIPCheck: boolean;
}
