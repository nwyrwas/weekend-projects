import { prisma } from '../../prisma/client.js';
import { AppError } from '../../utils/AppError.js';
import { PAGINATION, type UserRole } from '../../config/constants.js';
import type { UserResponse, GetUsersQuery, UpdateUserRequest } from './types.js';

function toUserResponse(user: {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}): UserResponse {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

interface GetUsersResult {
  users: UserResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getUsers(queryParams: GetUsersQuery): Promise<GetUsersResult> {
  const page = queryParams.page || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(queryParams.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
  const skip = (page - 1) * limit;

  const where = queryParams.role ? { role: queryParams.role } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map(toUserResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getUserById(id: string): Promise<UserResponse> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw AppError.userNotFound();
  }

  return toUserResponse(user);
}

export async function updateUser(id: string, data: UpdateUserRequest): Promise<UserResponse> {
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw AppError.userNotFound();
  }

  if (data.email && data.email !== existingUser.email) {
    const emailTaken = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (emailTaken) {
      throw AppError.userExists();
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(data.email && { email: data.email }),
      ...(data.role && { role: data.role }),
    },
  });

  return toUserResponse(user);
}

export async function deleteUser(id: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw AppError.userNotFound();
  }

  await prisma.user.delete({
    where: { id },
  });
}
