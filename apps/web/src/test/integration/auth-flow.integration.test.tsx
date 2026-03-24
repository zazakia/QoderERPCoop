/**
 * Integration Tests for Authentication Flow
 * Tests authentication hooks and components working together
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils';
import { useAuth } from '@/hooks/useAuth';

// Mock the entire providers module first
jest.mock('@/app/providers', () => ({
  useSupabase: jest.fn(),
}));

// Mock Supabase auth methods
const mockSignInWithPassword = jest.fn();
const mockSignUp = jest.fn();
const mockSignOut = jest.fn();
const mockResetPasswordForEmail = jest.fn();
const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    signInWithPassword: mockSignInWithPassword,
    signUp: mockSignUp,
    signOut: mockSignOut,
    resetPasswordForEmail: mockResetPasswordForEmail,
    getSession: mockGetSession,
    onAuthStateChange: mockOnAuthStateChange,
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
    update: jest.fn(() => Promise.resolve({ data: null, error: null })),
    delete: jest.fn(() => Promise.resolve({ data: null, error: null })),
  })),
};

// Set up the useSupabase mock to return our mock client
const mockUseSupabase = require('@/app/providers').useSupabase;
mockUseSupabase.mockReturnValue({ supabase: mockSupabaseClient });

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Test component that uses the useAuth hook
function TestAuthComponent() {
  const { user, loading, signIn, signUp, signOut, resetPassword } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div data-testid="user-status">
        {user ? `Logged in as ${user.email}` : 'Not logged in'}
      </div>
      <button onClick={() => signIn('test@example.com', 'password')}>
        Sign In
      </button>
      <button onClick={() => signUp('test@example.com', 'password', { first_name: 'Test' })}>
        Sign Up
      </button>
      <button onClick={() => signOut()}>
        Sign Out
      </button>
      <button onClick={() => resetPassword('test@example.com')}>
        Reset Password
      </button>
    </div>
  );
}

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    mockOnAuthStateChange.mockImplementation((callback) => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    }));
  });

  describe('useAuth Hook Integration', () => {
    it('should initialize with no user and not loading', async () => {
      renderWithProviders(<TestAuthComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
      });
    });

    it('should handle successful sign in', async () => {
      const user = userEvent.setup();

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' },
      };

      mockSignInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'token' } },
        error: null,
      });

      renderWithProviders(<TestAuthComponent />);

      // Wait for loading to finish and buttons to appear
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(signInButton);

      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password'
        });
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should handle sign in errors', async () => {
      const user = userEvent.setup();

      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      renderWithProviders(<TestAuthComponent />);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(signInButton);

      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password'
        });
      });

      // Should not redirect on error
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle successful sign up', async () => {
      const user = userEvent.setup();

      const mockUser = {
        id: 'user-456',
        email: 'new@example.com',
      };

      mockSignUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      renderWithProviders(<TestAuthComponent />);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const signUpButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(signUpButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password',
          options: {
            data: {
              first_name: 'Test'
            }
          }
        });
      });
    });

    it('should handle sign up errors', async () => {
      const user = userEvent.setup();

      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Email already exists' },
      });

      renderWithProviders(<TestAuthComponent />);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const signUpButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(signUpButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password',
          options: {
            data: {
              first_name: 'Test'
            }
          }
        });
      });
    });

    it('should handle password reset', async () => {
      const user = userEvent.setup();

      mockResetPasswordForEmail.mockResolvedValue({ error: null });

      renderWithProviders(<TestAuthComponent />);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const resetButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(resetButton);

      await waitFor(() => {
        expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
          'test@example.com',
          { redirectTo: expect.stringContaining('/auth/reset-password') }
        );
      });
    });

    it('should handle sign out', async () => {
      const user = userEvent.setup();

      mockSignOut.mockResolvedValue({ error: null });

      renderWithProviders(<TestAuthComponent />);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      await user.click(signOutButton);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });
  });

  describe('Session Management Integration', () => {
    it('should handle existing session on initialization', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'existing@example.com',
        user_metadata: { full_name: 'Existing User' },
      };

      const mockSession = {
        access_token: 'existing-token',
        user: mockUser,
      };

      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      renderWithProviders(<TestAuthComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent(
          'Logged in as existing@example.com'
        );
      });
    });

    it('should handle session errors gracefully', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' },
      });

      renderWithProviders(<TestAuthComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
      });
    });
  });

  describe('Auth State Changes', () => {
    it('should handle auth state change callbacks', () => {
      let authCallback: any;

      mockOnAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        };
      });

      renderWithProviders(<TestAuthComponent />);

      // Verify the callback was set up
      expect(mockOnAuthStateChange).toHaveBeenCalled();
      expect(typeof authCallback).toBe('function');
    });
  });
});