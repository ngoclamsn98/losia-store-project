// User API service for connecting to NestJS backend

import { get, post, patch, del } from './client';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  gender?: string;
  address?: string;
  role: string;
  level: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  gender?: string;
  address?: string;
  role: string;
  level: number;
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  gender?: string;
  address?: string;
  role?: string;
  level?: number;
  isActive?: boolean;
}

export interface UserFilters {
  role?: string;
  isActive?: boolean;
  search?: string;
}

/**
 * Get all users with optional filters
 */
export async function getUsers(filters?: UserFilters): Promise<User[]> {
  return get<User[]>('/users', filters);
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User> {
  return get<User>(`/users/${id}`);
}

/**
 * Create a new user (Admin only)
 */
export async function createUser(data: CreateUserDto): Promise<User> {
  return post<User>('/users', data);
}

/**
 * Update user (Admin only)
 */
export async function updateUser(id: string, data: UpdateUserDto): Promise<User> {
  return patch<User>(`/users/${id}`, data);
}

/**
 * Delete user (Admin only)
 */
export async function deleteUser(id: string): Promise<void> {
  return del<void>(`/users/${id}`);
}

