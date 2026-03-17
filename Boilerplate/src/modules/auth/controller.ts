import type { Request, Response } from 'express';
import { env } from '../../config/env.js';
import { COOKIE_NAMES } from '../../config/constants.js';
import { AppError } from '../../utils/AppError.js';
import { asyncWrapper } from '../../utils/asyncWrapper.js';
import * as authService from './service.js';
import type { RegisterRequest, LoginRequest, AuthResponse, RefreshResponse, LogoutResponse } from './types.js';

function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    domain: env.COOKIE_DOMAIN || undefined,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    domain: env.COOKIE_DOMAIN || undefined,
    path: '/',
  });
}

export const register = asyncWrapper(async (req: Request, res: Response): Promise<void> => {
  const data = req.body as RegisterRequest;
  const result = await authService.registerUser(data);

  setRefreshTokenCookie(res, result.refreshToken);

  const response: AuthResponse = {
    success: true,
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  };

  res.status(201).json(response);
});

export const login = asyncWrapper(async (req: Request, res: Response): Promise<void> => {
  const data = req.body as LoginRequest;
  const result = await authService.loginUser(data);

  setRefreshTokenCookie(res, result.refreshToken);

  const response: AuthResponse = {
    success: true,
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  };

  res.status(200).json(response);
});

export const refresh = asyncWrapper(async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN] as string | undefined;

  if (!refreshToken) {
    throw AppError.unauthorized('No refresh token provided');
  }

  const result = await authService.refreshAccessToken(refreshToken);

  // Token rotation: set the new refresh token in cookie
  setRefreshTokenCookie(res, result.refreshToken);

  const response: RefreshResponse = {
    success: true,
    data: {
      accessToken: result.accessToken,
    },
  };

  res.status(200).json(response);
});

export const logout = asyncWrapper(async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN] as string | undefined;

  if (refreshToken) {
    await authService.logoutUser(refreshToken);
  }

  clearRefreshTokenCookie(res);

  const response: LogoutResponse = {
    success: true,
    data: {
      message: 'Logged out successfully',
    },
  };

  res.status(200).json(response);
});
