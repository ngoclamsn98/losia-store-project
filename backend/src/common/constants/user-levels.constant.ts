export const USER_LEVELS = {
  SUPERADMIN: 100,
  ADMIN: 50,
  MANAGER: 30,
  STAFF: 10,
  USER: 0,
} as const;

export type UserLevelValue = typeof USER_LEVELS[keyof typeof USER_LEVELS];

