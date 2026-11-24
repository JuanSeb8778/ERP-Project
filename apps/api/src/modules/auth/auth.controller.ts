import type { Request, Response } from "express";
import { env, isProd } from "../../config/env";
import { ok } from "../../core/result";
import { getContext } from "../../core/context";
import { Errors } from "../../core/errors";
import { authService } from "./auth.service";

const REFRESH_COOKIE = "tf_refresh";

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? ("none" as const) : ("lax" as const),
  path: "/api/v1/auth",
  maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
};

export const authController = {
  async login(req: Request, res: Response) {
    const { accessToken, refreshToken, user } = await authService.login(req.body);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    return ok(res, { accessToken, user });
  },

  async refresh(req: Request, res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE];
    const { accessToken, refreshToken, user } = await authService.refresh(token);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    return ok(res, { accessToken, user });
  },

  async logout(req: Request, res: Response) {
    await authService.logout(req.cookies?.[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, { ...cookieOptions, maxAge: undefined });
    return ok(res, { success: true });
  },

  async me(_req: Request, res: Response) {
    const ctx = getContext();
    if (!ctx?.userId) throw Errors.unauthorized();
    return ok(res, await authService.me(ctx.userId));
  },
};
