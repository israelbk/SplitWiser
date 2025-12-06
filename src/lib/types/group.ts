/**
 * Group types
 */

export type GroupType = 'trip' | 'household' | 'couple' | 'other';
export type MemberRole = 'owner' | 'admin' | 'member';

export interface Group {
  id: string;
  name: string;
  description?: string;
  type: GroupType;
  defaultCurrency: string;
  coverImageUrl?: string;
  isArchived: boolean;
  createdBy: string;
  createdAt: Date;
  // Relations (loaded separately)
  members?: GroupMember[];
}

export interface GroupMember {
  groupId: string;
  userId: string;
  role: MemberRole;
  joinedAt: Date;
  // Populated relation
  user?: import('./user').User;
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  type?: GroupType;
  defaultCurrency?: string;
  coverImageUrl?: string;
  createdBy: string;
  memberIds: string[]; // Users to add as members
}

export interface UpdateGroupInput {
  name?: string;
  description?: string;
  type?: GroupType;
  defaultCurrency?: string;
  coverImageUrl?: string;
  isArchived?: boolean;
}

export interface AddMemberInput {
  groupId: string;
  userId: string;
  role?: MemberRole;
}

// Database row types (snake_case)
export interface GroupRow {
  id: string;
  name: string;
  description: string | null;
  type: string;
  default_currency: string;
  cover_image_url: string | null;
  is_archived: boolean;
  created_by: string;
  created_at: string;
}

export interface GroupMemberRow {
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

// Transform database row to domain type
export function groupFromRow(row: GroupRow): Group {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    type: row.type as GroupType,
    defaultCurrency: row.default_currency,
    coverImageUrl: row.cover_image_url ?? undefined,
    isArchived: row.is_archived,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
  };
}

export function groupMemberFromRow(row: GroupMemberRow): GroupMember {
  return {
    groupId: row.group_id,
    userId: row.user_id,
    role: row.role as MemberRole,
    joinedAt: new Date(row.joined_at),
  };
}

