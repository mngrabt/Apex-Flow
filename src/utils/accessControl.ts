type UserRole = 'A' | 'B' | 'C' | 'D' | 'S';

export const Role = {
  ADMIN: 'A' as UserRole,
  MANAGER: 'B' as UserRole,
  MEMBER: 'C' as UserRole,
  FINANCE: 'D' as UserRole,
  SUPPLIER: 'S' as UserRole,
} as const;

export type { UserRole as Role };

interface AccessMap {
  [key: string]: {
    routes: string[];
    dashboardBlocks: string[];
  };
}

const ACCESS_CONTROL: AccessMap = {
  // Abdurauf - Full access
  '00000000-0000-0000-0000-000000000001': {
    routes: [
      '/',
      '/tasks',
      '/requests',
      '/tenders',
      '/protocols',
      '/archive',
      '/finances',
      '/database',
      '/calendar',
      '/applications'
    ],
    dashboardBlocks: [
      'tasks',
      'requests',
      'tenders',
      'protocols',
      'archive',
      'database',
      'calendar',
      'finances',
      'applications'
    ]
  },
  // Fozil
  '00000000-0000-0000-0000-000000000003': {
    routes: ['/', '/requests', '/tenders', '/protocols', '/archive'],
    dashboardBlocks: ['requests', 'tenders', 'protocols', 'archive']
  },
  // Aziz
  '00000000-0000-0000-0000-000000000004': {
    routes: ['/', '/requests', '/protocols'],
    dashboardBlocks: ['requests', 'protocols']
  },
  // Umarali - Full finance access
  '00000000-0000-0000-0000-000000000005': {
    routes: ['/', '/protocols', '/archive', '/finances'],
    dashboardBlocks: ['protocols', 'archive', 'finances']
  },
  // Dinara
  '00000000-0000-0000-0000-000000000006': {
    routes: ['/', '/archive'],
    dashboardBlocks: ['archive']
  },
  // Umar
  '00000000-0000-0000-0000-000000000007': {
    routes: ['/', '/tasks', '/archive', '/calendar'],
    dashboardBlocks: ['tasks', 'archive', 'calendar']
  },
  // Акмаль
  '00000000-0000-0000-0000-000000000008': {
    routes: ['/', '/tasks', '/calendar'],
    dashboardBlocks: ['tasks', 'calendar']
  },
  // Sherzod
  '00000000-0000-0000-0000-000000000009': {
    routes: ['/', '/finances'],
    dashboardBlocks: ['finances']
  },
  // Default supplier access
  default: {
    routes: ['/', '/tenders', '/applications'],
    dashboardBlocks: ['tenders', 'applications']
  }
};

export function hasAccess(userId: string, route: string): boolean {
  // Allow access to tender details if user has access to tenders
  if (route.startsWith('/tenders/')) {
    return hasAccess(userId, '/tenders');
  }
  
  // Allow access to protocol details for everyone
  if (route.startsWith('/protocols/')) {
    return true;
  }

  // Allow access to application details if user has access to applications
  if (route.startsWith('/applications/')) {
    return hasAccess(userId, '/applications');
  }

  // Allow access to supplier details if user has access to database
  if (route.startsWith('/database/')) {
    return hasAccess(userId, '/database');
  }

  const accessConfig = ACCESS_CONTROL[userId] || ACCESS_CONTROL.default;
  return accessConfig.routes.includes(route);
}

export function hasBlockAccess(userId: string, block: string): boolean {
  const accessConfig = ACCESS_CONTROL[userId] || ACCESS_CONTROL.default;
  return accessConfig.dashboardBlocks.includes(block);
}

export default ACCESS_CONTROL;