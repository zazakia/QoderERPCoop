/**
 * Unit Tests for useAuth Hook
 * Tests the authentication hook in isolation
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';

// Mock the providers module
jest.mock('@/app/providers', () => ({
  useSupabase: jest.fn(),
}));

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

// Mock Supabase client
const mockSignInWithPassword = jest.fn();
const mockSignUp = jest.fn();
const mockSignOut = jest.fn();
const mockResetPasswordForEmail = jest.fn();
const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockFrom = jest.fn();

const mockSupabaseClient = {
  auth: {
    signInWithPassword: mockSignInWithPassword,
    signUp: mockSignUp,
    signOut: mockSignOut,
    resetPasswordForEmail: mockResetPasswordForEmail,
    getSession: mockGetSession,
    onAuthStateChange: mockOnAuthStateChange,
  },
  from: mockFrom,
};

// Set up the useSupabase mock
const mockUseSupabase = require('@/app/providers').useSupabase;
mockUseSupabase.mockReturnValue({ supabase: mockSupabaseClient });

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset all mocks to default successful responses
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' }, session: { access_token: 'token' } },
      error: null,
    });

    mockSignUp.mockResolvedValue({
      data: { user: { id: 'user-456', email: 'new@example.com' } },
      error: null,
    });

    mockSignOut.mockResolvedValue({ error: null });

    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });

    // Mock database operations
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'user-123', email: 'test@example.com', role: 'mill_owner' },
        error: null,
      }),
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    });
  });

  describe('Initial State', () => {
    it('should initialize with null user and loading true', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.profile).toBeNull();
      expect(result.current.loading).toBe(true);
    });

    it('should initialize with user data when session exists', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockSession = { access_token: 'token', user: mockUser };

      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('signIn', () => {
    it('should call supabase signInWithPassword with correct parameters', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should navigate to dashboard on successful sign in', async () => {
      const { result } = renderHook(() => useAuth());

      const signInResult = await act(async () => {
        return await result.current.signIn('test@example.com', 'password123');
      });

      expect(signInResult.error).toBeNull();
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should return error on failed sign in', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      const { result } = renderHook(() => useAuth());

      const signInResult = await act(async () => {
        return await result.current.signIn('wrong@example.com', 'wrongpassword');
      });

      expect(signInResult.error).toEqual({ message: 'Invalid credentials' });
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      mockSignInWithPassword.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth());

      const signInResult = await act(async () => {
        return await result.current.signIn('test@example.com', 'password123');
      });

      expect(signInResult.error).toBeInstanceOf(Error);
      expect(signInResult.error.message).toBe('Network error');
    });
  });

  describe('signUp', () => {
    it('should call supabase signUp with correct parameters', async () => {
      const { result } = renderHook(() => useAuth());

      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1234567890',
        role: 'operator',
        mill_id: 'mill-123',
      };

      await act(async () => {
        await result.current.signUp('john@example.com', 'password123', userData);
      });

      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
        options: {
          data: userData,
        },
      });
    });

    it('should create user profile in database on successful sign up', async () => {
      const { result } = renderHook(() => useAuth());

      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1234567890',
        role: 'operator',
        mill_id: 'mill-123',
      };

      await act(async () => {
        await result.current.signUp('john@example.com', 'password123', userData);
      });

      expect(mockFrom).toHaveBeenCalledWith('users');
      // Verify the insert was called with correct data structure
      const insertMock = mockFrom().insert;
      expect(insertMock).toHaveBeenCalled();
    });

    it('should return error on failed sign up', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Email already exists' },
      });

      const { result } = renderHook(() => useAuth());

      const signUpResult = await act(async () => {
        return await result.current.signUp('existing@example.com', 'password123', {});
      });

      expect(signUpResult.error).toEqual({ message: 'Email already exists' });
    });
  });

  describe('signOut', () => {
    it('should call supabase signOut and navigate to home', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSignOut).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('should handle sign out errors gracefully', async () => {
      mockSignOut.mockRejectedValue(new Error('Sign out failed'));

      const { result } = renderHook(() => useAuth());

      // Should not throw error, just log it
      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSignOut).toHaveBeenCalled();
      // Navigation should not happen on error (as per current implementation)
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should call supabase resetPasswordForEmail with correct parameters', async () => {
      const { result } = renderHook(() => useAuth());

      const resetResult = await act(async () => {
        return await result.current.resetPassword('test@example.com');
      });

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        { redirectTo: expect.stringContaining('/auth/reset-password') }
      );
      expect(resetResult.error).toBeNull();
    });

    it('should return error on failed password reset', async () => {
      mockResetPasswordForEmail.mockResolvedValue({
        error: { message: 'User not found' },
      });

      const { result } = renderHook(() => useAuth());

      const resetResult = await act(async () => {
        return await result.current.resetPassword('nonexistent@example.com');
      });

      expect(resetResult.error).toEqual({ message: 'User not found' });
    });
  });

  describe('Auth State Changes', () => {
    it('should set up auth state change listener', () => {
      renderHook(() => useAuth());

      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });

    it('should set up auth state change listener', () => {
      renderHook(() => useAuth());

      expect(mockOnAuthStateChange).toHaveBeenCalled();
      expect(mockOnAuthStateChange).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should clear user state on sign out', async () => {
      let authCallback: any;

      mockOnAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        };
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        authCallback('SIGNED_OUT', null);
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.profile).toBeNull();
      });
    });
  });

  describe('Profile Management', () => {
    it('should fetch user profile when user signs in', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockSession = { access_token: 'token', user: mockUser };

      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      renderHook(() => useAuth());

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('users');
      });
    });

    it('should handle profile fetch errors gracefully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockSession = { access_token: 'token', user: mockUser };

      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Profile not found' },
        }),
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.profile).toBeNull(); // Should not crash
      });
    });
  });
});