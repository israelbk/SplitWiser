/**
 * Query keys for TanStack Query
 * Centralized key management for cache invalidation
 */

export const queryKeys = {
  // Users
  users: {
    all: ['users'] as const,
    detail: (id: string) => ['users', id] as const,
  },

  // Categories
  categories: {
    all: ['categories'] as const,
    system: ['categories', 'system'] as const,
    detail: (id: string) => ['categories', id] as const,
  },

  // Groups
  groups: {
    all: ['groups'] as const,
    forUser: (userId: string) => ['groups', 'user', userId] as const,
    detail: (id: string) => ['groups', id] as const,
    withMembers: (id: string) => ['groups', id, 'members'] as const,
    members: (id: string) => ['groups', id, 'members-list'] as const,
    balances: (id: string) => ['groups', id, 'balances'] as const,
  },

  // Expenses
  expenses: {
    personal: (userId: string) => ['expenses', 'personal', userId] as const,
    group: (groupId: string) => ['expenses', 'group', groupId] as const,
    detail: (id: string) => ['expenses', id] as const,
    withDetails: (id: string) => ['expenses', id, 'details'] as const,
  },
} as const;

