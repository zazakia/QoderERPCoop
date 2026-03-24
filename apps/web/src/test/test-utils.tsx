import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock user data for testing
export const mockUser = {
  id: 'test-user-id',
  email: 'test@ricemillos.com',
  user_metadata: {
    full_name: 'Test User',
    role: 'mill_owner' as const,
    mill_id: 'test-mill-id',
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
  user: mockUser,
};

// Mock permissions context
const mockPermissionsContext = {
  hasPermission: jest.fn(() => true),
  userRole: 'operator' as const,
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialUser?: typeof mockUser | null;
  queryClient?: QueryClient;
  authOverrides?: Partial<{
    loading: boolean;
    user: typeof mockUser | null;
    session: typeof mockSession | null;
  }>;
  permissionsOverrides?: Partial<typeof mockPermissionsContext>;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    initialUser = mockUser,
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
    authOverrides = {},
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  // Mock AuthContext value with overrides
  const mockAuthContext = {
    user: authOverrides.user !== undefined ? authOverrides.user : initialUser,
    session: (authOverrides.user !== undefined ? authOverrides.user : initialUser) ? mockSession : null,
    loading: authOverrides.loading !== undefined ? authOverrides.loading : false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
    updateProfile: jest.fn(),
  };

  // Create a stable context value to prevent re-renders
  const StableAuthProvider = ({ children }: { children: React.ReactNode }) => {
    return (
      <AuthProvider value={mockAuthContext}>
        {children}
      </AuthProvider>
    );
  };

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <StableAuthProvider>
          {children}
        </StableAuthProvider>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    mockAuthContext,
    queryClient,
  };
}

// Mock data generators
export const generateMockFarmer = (overrides = {}) => ({
  id: 'farmer-1',
  mill_id: 'mill-1',
  name: 'Test Farmer',
  phone: '+91-9876543210',
  address: '123 Test Street',
  village: 'Test Village',
  aadhar_number: '1234-5678-9012',
  bank_account: '1234567890',
  bank_ifsc: 'TEST0001234',
  credit_limit: 50000,
  current_balance: 0,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const generateMockMill = (overrides = {}) => ({
  id: 'mill-1',
  name: 'Test Rice Mill',
  owner_name: 'Test Owner',
  address: '456 Mill Street',
  phone: '+91-9876543211',
  license_number: 'LIC123456',
  capacity_per_day: 1000,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const generateMockPaddyIntake = (overrides = {}) => ({
  id: 'intake-1',
  mill_id: 'mill-1',
  farmer_id: 'farmer-1',
  batch_number: 'BATCH001',
  variety: 'Basmati',
  gross_weight: 1000,
  tare_weight: 50,
  net_weight: 950,
  moisture_content: 12.5,
  quality_grade: 'A',
  rate_per_kg: 25.50,
  total_amount: 24225,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Test database utilities
export const createMockSupabaseClient = () => ({
  auth: {
    getSession: jest.fn(() => Promise.resolve({ 
      data: { session: mockSession }, 
      error: null 
    })),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
    signInWithPassword: jest.fn(() => Promise.resolve({ 
      data: { user: mockUser, session: mockSession }, 
      error: null 
    })),
    signUp: jest.fn(() => Promise.resolve({ 
      data: { user: mockUser, session: mockSession }, 
      error: null 
    })),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
    resetPasswordForEmail: jest.fn(() => Promise.resolve({ error: null })),
    updateUser: jest.fn(() => Promise.resolve({ 
      data: { user: mockUser }, 
      error: null 
    })),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
    update: jest.fn(() => Promise.resolve({ data: null, error: null })),
    delete: jest.fn(() => Promise.resolve({ data: null, error: null })),
  })),
});

// Assertion helpers
export const expectElementToBeVisible = (element: HTMLElement) => {
  expect(element).toBeInTheDocument();
  expect(element).toBeVisible();
};

export const expectElementToHaveText = (element: HTMLElement, text: string) => {
  expect(element).toBeInTheDocument();
  expect(element).toHaveTextContent(text);
};

// Common test patterns
export const waitForLoadingToFinish = async () => {
  const { waitForElementToBeRemoved } = await import('@testing-library/react');
  await waitForElementToBeRemoved(
    () => document.querySelector('[data-testid="loading"]'),
    { timeout: 3000 }
  );
};