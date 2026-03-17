import type { Request, Response } from 'express';
import { AppError } from '../../utils/AppError.js';
import { asyncWrapper } from '../../utils/asyncWrapper.js';
import { USER_ROLES } from '../../config/constants.js';
import * as usersService from './service.js';
import type {
  GetUsersQuery,
  GetUsersResponse,
  GetUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  DeleteUserResponse,
} from './types.js';

export const getUsers = asyncWrapper(async (req: Request, res: Response): Promise<void> => {
  const query: GetUsersQuery = {
    page: req.query.page as unknown as number | undefined,
    limit: req.query.limit as unknown as number | undefined,
    role: req.query.role as GetUsersQuery['role'],
  };

  const result = await usersService.getUsers(query);

  const response: GetUsersResponse = {
    success: true,
    data: result,
  };

  res.status(200).json(response);
});

export const getUserById = asyncWrapper(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const currentUser = req.user;

  if (!currentUser) {
    throw AppError.unauthorized();
  }

  const isAdmin = currentUser.role === USER_ROLES.ADMIN;
  const isOwnProfile = currentUser.userId === id;

  if (!isAdmin && !isOwnProfile) {
    throw AppError.forbidden('You can only view your own profile');
  }

  const user = await usersService.getUserById(id as string);

  const response: GetUserResponse = {
    success: true,
    data: { user },
  };

  res.status(200).json(response);
});

export const updateUser = asyncWrapper(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const currentUser = req.user;

  if (!currentUser) {
    throw AppError.unauthorized();
  }

  const isAdmin = currentUser.role === USER_ROLES.ADMIN;
  const isOwnProfile = currentUser.userId === id;

  if (!isAdmin && !isOwnProfile) {
    throw AppError.forbidden('You can only update your own profile');
  }

  const updateData: UpdateUserRequest = {};

  if (req.body.email) {
    updateData.email = req.body.email as string;
  }

  if (req.body.role) {
    if (!isAdmin) {
      throw AppError.forbidden('Only admins can change user roles');
    }
    updateData.role = req.body.role as UpdateUserRequest['role'];
  }

  const user = await usersService.updateUser(id as string, updateData);

  const response: UpdateUserResponse = {
    success: true,
    data: { user },
  };

  res.status(200).json(response);
});

export const deleteUser = asyncWrapper(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  await usersService.deleteUser(id as string);

  const response: DeleteUserResponse = {
    success: true,
    data: { message: 'User deleted successfully' },
  };

  res.status(200).json(response);
});
