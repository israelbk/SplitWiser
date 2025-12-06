/**
 * User types
 */

export interface User {
  id: string;
  email?: string;
  name: string;
  avatarUrl?: string;
  avatarColor: string;
  createdAt: Date;
}

export interface CreateUserInput {
  name: string;
  email?: string;
  avatarUrl?: string;
  avatarColor?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  avatarUrl?: string;
  avatarColor?: string;
}

// Database row type (snake_case)
export interface UserRow {
  id: string;
  email: string | null;
  name: string;
  avatar_url: string | null;
  avatar_color: string | null;
  created_at: string;
}

// Transform database row to domain type
export function userFromRow(row: UserRow): User {
  return {
    id: row.id,
    email: row.email ?? undefined,
    name: row.name,
    avatarUrl: row.avatar_url ?? undefined,
    avatarColor: row.avatar_color ?? '#6366f1',
    createdAt: new Date(row.created_at),
  };
}

