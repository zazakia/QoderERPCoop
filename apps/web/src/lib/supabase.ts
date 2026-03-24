import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
// Note: cookies import moved to server-only file to avoid client/server conflicts

// Mock data for demo
const mockFarmers = [
  {
    id: '1',
    name: 'Juan Dela Cruz',
    email: 'juan@example.com',
    phone: '+63 912 345 6789',
    address: '123 Rice Field, Manila',
    registration_date: '2024-01-15T00:00:00Z',
    is_active: true,
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@example.com',
    phone: '+63 923 456 7890',
    address: '456 Farm Road, Cebu',
    registration_date: '2024-02-20T00:00:00Z',
    is_active: true,
  },
  {
    id: '3',
    name: 'Pedro Reyes',
    email: 'pedro@example.com',
    phone: '+63 934 567 8901',
    address: '789 Paddy Lane, Davao',
    registration_date: '2024-03-10T00:00:00Z',
    is_active: false,
  },
];

const mockPaddyIntake = [
  {
    id: '1',
    farmer_id: '1',
    farmer_name: 'Juan Dela Cruz',
    quantity_kg: 500,
    quality_grade: 'A',
    moisture_content: 14.5,
    price_per_kg: 25.00,
    total_amount: 12500.00,
    intake_date: '2024-09-01T08:00:00Z',
    status: 'completed',
  },
  {
    id: '2',
    farmer_id: '2',
    farmer_name: 'Maria Santos',
    quantity_kg: 750,
    quality_grade: 'B',
    moisture_content: 15.2,
    price_per_kg: 22.50,
    total_amount: 16875.00,
    intake_date: '2024-09-02T09:30:00Z',
    status: 'completed',
  },
];

// Mock Supabase client
class MockSupabaseClient {
  auth = {
    getSession: async () => ({
      data: {
        session: {
          user: {
            id: 'demo-user',
            email: 'demo@example.com',
            user_metadata: {
              full_name: 'Demo User',
              role: 'super_admin',
            },
          },
        },
      },
      error: null,
    }),
    onAuthStateChange: (callback: any) => ({
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    }),
    signInWithPassword: async () => ({ error: null }),
    signUp: async () => ({ error: null }),
    signOut: async () => {},
    resetPasswordForEmail: async () => ({ error: null }),
    updateUser: async () => ({ error: null }),
  };

  from = (table: string) => ({
    select: (columns = '*') => ({
      order: (column: string) => ({
        then: async (resolve: any) => {
          if (table === 'farmers') {
            resolve({ data: mockFarmers, error: null });
          } else if (table === 'paddy_intake') {
            resolve({ data: mockPaddyIntake, error: null });
          } else {
            resolve({ data: [], error: null });
          }
        },
      }),
      eq: (column: string, value: any) => ({
        select: () => ({
          single: () => ({
            then: async (resolve: any) => {
              if (table === 'farmers') {
                const farmer = mockFarmers.find(f => f.id === value);
                resolve({ data: farmer, error: null });
              } else {
                resolve({ data: null, error: null });
              }
            },
          }),
        }),
      }),
      then: async (resolve: any) => {
        if (table === 'farmers') {
          resolve({ data: mockFarmers, error: null });
        } else if (table === 'paddy_intake') {
          resolve({ data: mockPaddyIntake, error: null });
        } else {
          resolve({ data: [], error: null });
        }
      },
    }),
    insert: (data: any[]) => ({
      select: () => ({
        single: () => ({
          then: async (resolve: any) => {
            const newItem = { ...data[0], id: Date.now().toString() };
            if (table === 'farmers') {
              mockFarmers.push(newItem);
            }
            resolve({ data: newItem, error: null });
          },
        }),
      }),
    }),
    update: (updates: any) => ({
      eq: (column: string, value: any) => ({
        select: () => ({
          single: () => ({
            then: async (resolve: any) => {
              if (table === 'farmers') {
                const index = mockFarmers.findIndex(f => f.id === value);
                if (index !== -1) {
                  mockFarmers[index] = { ...mockFarmers[index], ...updates };
                  resolve({ data: mockFarmers[index], error: null });
                } else {
                  resolve({ data: null, error: { message: 'Not found' } });
                }
              } else {
                resolve({ data: null, error: null });
              }
            },
          }),
        }),
      }),
    }),
    delete: () => ({
      eq: (column: string, value: any) => ({
        then: async (resolve: any) => {
          if (table === 'farmers') {
            const index = mockFarmers.findIndex(f => f.id === value);
            if (index !== -1) {
              mockFarmers.splice(index, 1);
            }
          }
          resolve({ data: null, error: null });
        },
      }),
    }),
  });
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: 'super_admin' | 'mill_owner' | 'manager' | 'operator';
          mill_id: string | null;
          phone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          role?: 'super_admin' | 'mill_owner' | 'manager' | 'operator';
          mill_id?: string | null;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: 'super_admin' | 'mill_owner' | 'manager' | 'operator';
          mill_id?: string | null;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      mills: {
        Row: {
          id: string;
          name: string;
          owner_name: string;
          address: string;
          phone: string;
          license_number: string | null;
          capacity_per_day: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_name: string;
          address: string;
          phone: string;
          license_number?: string | null;
          capacity_per_day?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_name?: string;
          address?: string;
          phone?: string;
          license_number?: string | null;
          capacity_per_day?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

// Client-side Supabase client for components
export const createClientComponentSupabase = () => {
  // Use mock client for demo
  return new MockSupabaseClient() as any;
};

// Service role client for admin operations (use with caution)
export const createServiceRoleClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Auth event types
export type AuthChangeEvent = 
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY';

// User role permissions
export const ROLE_PERMISSIONS = {
  super_admin: ['*'], // All permissions
  mill_owner: [
    'mills:read',
    'mills:update',
    'users:create',
    'users:read',
    'users:update',
    'farmers:*',
    'inventory:*',
    'sales:*',
    'reports:*',
  ],
  manager: [
    'farmers:*',
    'inventory:*',
    'sales:*',
    'reports:read',
    'procurement:*',
  ],
  operator: [
    'farmers:read',
    'procurement:create',
    'inventory:read',
    'sales:create',
  ],
} as const;

export type UserRole = keyof typeof ROLE_PERMISSIONS;
export type Permission = typeof ROLE_PERMISSIONS[UserRole][number];

// Helper function to check permissions
export const hasPermission = (userRole: UserRole, permission: string): boolean => {
  // Handle edge cases
  if (!permission || typeof permission !== 'string') {
    return false;
  }

  const rolePermissions = ROLE_PERMISSIONS[userRole] as readonly string[];

  // Super admin has all permissions
  if (rolePermissions.includes('*')) {
    return true;
  }

  // Check for exact permission match
  if (rolePermissions.includes(permission)) {
    return true;
  }

  // Check for wildcard permissions (e.g., 'farmers:*' covers 'farmers:create')
  const [resource, action] = permission.split(':');
  if (!resource || !action) {
    return false;
  }

  return rolePermissions.some(rolePerm => {
    if (rolePerm.endsWith(':*')) {
      const roleResource = rolePerm.slice(0, -2); // Remove ':*'
      return roleResource === resource;
    }
    return false;
  });
};