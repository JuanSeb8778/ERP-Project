import { z } from "zod";
import type { PermissionKey } from "../constants/permissions";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({ email: z.string().email() });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** The authenticated user as returned by /auth/me and /auth/login. */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyId: string;
  companyName: string;
  role: string;
  permissions: PermissionKey[];
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
