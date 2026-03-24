/**
 * Unit Tests for ProtectedRoute Component
 * Tests authentication and authorization logic
 */

import { render, screen } from '@testing-library/react';
import ProtectedRoute from '../ProtectedRoute';

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

// Mock useAuth and usePermissions hooks
const mockUseAuth = jest.fn();
const mockUsePermissions = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  usePermissions: () => mockUsePermissions(),
}));

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock defaults
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com', user_metadata: { role: 'operator' } },
      loading: false,
    });
    mockUsePermissions.mockReturnValue({
      hasPermission: jest.fn().mockReturnValue(true),
      userRole: 'operator',
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when authentication is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Authentication Checks', () => {
    it('should redirect to login when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockPush).toHaveBeenCalledWith('/auth/login');
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should render children when user is authenticated', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { role: 'operator' },
      };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should use custom fallback path when provided', () => {
      const mockAuthContext = {
        user: null,
        session: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updateProfile: jest.fn(),
      };

      const mockPermissionsContext = {
        hasPermission: jest.fn(),
        userRole: null,
      };

      renderWithProviders(
        <ProtectedRoute fallbackPath="/custom/login">
          <div>Protected Content</div>
        </ProtectedRoute>,
        {
          authContext: mockAuthContext,
          permissionsContext: mockPermissionsContext,
        }
      );

      expect(mockPush).toHaveBeenCalledWith('/custom/login');
    });
  });

  describe('Role-based Authorization', () => {
    it('should allow access when user has required role', () => {
      const mockUser = {
        id: 'user-123',
        email: 'manager@example.com',
        user_metadata: { role: 'manager' },
      };

      const mockAuthContext = {
        user: mockUser,
        session: { access_token: 'token' },
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updateProfile: jest.fn(),
      };

      const mockPermissionsContext = {
        hasPermission: jest.fn(),
        userRole: 'manager',
      };

      renderWithProviders(
        <ProtectedRoute requiredRole="manager">
          <div>Manager Content</div>
        </ProtectedRoute>,
        {
          authContext: mockAuthContext,
          permissionsContext: mockPermissionsContext,
        }
      );

      expect(screen.getByText('Manager Content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should deny access when user does not have required role', () => {
      const mockUser = {
        id: 'user-123',
        email: 'operator@example.com',
        user_metadata: { role: 'operator' },
      };

      const mockAuthContext = {
        user: mockUser,
        session: { access_token: 'token' },
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updateProfile: jest.fn(),
      };

      const mockPermissionsContext = {
        hasPermission: jest.fn(),
        userRole: 'operator',
      };

      renderWithProviders(
        <ProtectedRoute requiredRole="manager">
          <div>Manager Content</div>
        </ProtectedRoute>,
        {
          authContext: mockAuthContext,
          permissionsContext: mockPermissionsContext,
        }
      );

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
      expect(screen.queryByText('Manager Content')).not.toBeInTheDocument();
    });

    it('should allow super_admin to bypass role requirements', () => {
      const mockUser = {
        id: 'user-123',
        email: 'admin@example.com',
        user_metadata: { role: 'super_admin' },
      };

      const mockAuthContext = {
        user: mockUser,
        session: { access_token: 'token' },
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updateProfile: jest.fn(),
      };

      const mockPermissionsContext = {
        hasPermission: jest.fn(),
        userRole: 'super_admin',
      };

      renderWithProviders(
        <ProtectedRoute requiredRole="manager">
          <div>Admin Content</div>
        </ProtectedRoute>,
        {
          authContext: mockAuthContext,
          permissionsContext: mockPermissionsContext,
        }
      );

      expect(screen.getByText('Admin Content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Permission-based Authorization', () => {
    it('should allow access when user has required permission', () => {
      const mockUser = {
        id: 'user-123',
        email: 'operator@example.com',
        user_metadata: { role: 'operator' },
      };

      mockHasPermission.mockReturnValue(true);

      renderWithProviders(
        <ProtectedRoute requiredPermission="farmers:create">
          <div>Farmers Create Content</div>
        </ProtectedRoute>,
        {
          authOverrides: {
            loading: false,
            user: mockUser,
          },
        }
      );

      expect(screen.getByText('Farmers Create Content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockHasPermission).toHaveBeenCalledWith('farmers:create');
    });

    it('should deny access when user lacks required permission', () => {
      const mockUser = {
        id: 'user-123',
        email: 'operator@example.com',
        user_metadata: { role: 'operator' },
      };

      const mockAuthContext = {
        user: mockUser,
        session: { access_token: 'token' },
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updateProfile: jest.fn(),
      };

      const mockPermissionsContext = {
        hasPermission: jest.fn().mockReturnValue(false),
        userRole: 'operator',
      };

      renderWithProviders(
        <ProtectedRoute requiredPermission="mills:update">
          <div>Mills Update Content</div>
        </ProtectedRoute>,
        {
          authContext: mockAuthContext,
          permissionsContext: mockPermissionsContext,
        }
      );

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
      expect(screen.queryByText('Mills Update Content')).not.toBeInTheDocument();
      expect(mockPermissionsContext.hasPermission).toHaveBeenCalledWith('mills:update');
    });
  });

  describe('Combined Role and Permission Checks', () => {
    it('should allow access when both role and permission requirements are met', () => {
      const mockUser = {
        id: 'user-123',
        email: 'manager@example.com',
        user_metadata: { role: 'manager' },
      };

      const mockAuthContext = {
        user: mockUser,
        session: { access_token: 'token' },
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updateProfile: jest.fn(),
      };

      const mockPermissionsContext = {
        hasPermission: jest.fn().mockReturnValue(true),
        userRole: 'manager',
      };

      renderWithProviders(
        <ProtectedRoute requiredRole="manager" requiredPermission="inventory:read">
          <div>Manager Inventory Content</div>
        </ProtectedRoute>,
        {
          authContext: mockAuthContext,
          permissionsContext: mockPermissionsContext,
        }
      );

      expect(screen.getByText('Manager Inventory Content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should deny access when role requirement is not met even if permission is granted', () => {
      const mockUser = {
        id: 'user-123',
        email: 'operator@example.com',
        user_metadata: { role: 'operator' },
      };

      const mockAuthContext = {
        user: mockUser,
        session: { access_token: 'token' },
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updateProfile: jest.fn(),
      };

      const mockPermissionsContext = {
        hasPermission: jest.fn().mockReturnValue(true),
        userRole: 'operator',
      };

      renderWithProviders(
        <ProtectedRoute requiredRole="manager" requiredPermission="inventory:read">
          <div>Manager Inventory Content</div>
        </ProtectedRoute>,
        {
          authContext: mockAuthContext,
          permissionsContext: mockPermissionsContext,
        }
      );

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
      expect(screen.queryByText('Manager Inventory Content')).not.toBeInTheDocument();
    });

    it('should deny access when permission requirement is not met even if role is correct', () => {
      const mockUser = {
        id: 'user-123',
        email: 'manager@example.com',
        user_metadata: { role: 'manager' },
      };

      const mockAuthContext = {
        user: mockUser,
        session: { access_token: 'token' },
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updateProfile: jest.fn(),
      };

      const mockPermissionsContext = {
        hasPermission: jest.fn().mockReturnValue(false),
        userRole: 'manager',
      };

      renderWithProviders(
        <ProtectedRoute requiredRole="manager" requiredPermission="system:admin">
          <div>System Admin Content</div>
        </ProtectedRoute>,
        {
          authContext: mockAuthContext,
          permissionsContext: mockPermissionsContext,
        }
      );

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
      expect(screen.queryByText('System Admin Content')).not.toBeInTheDocument();
    });
  });

  describe('Rendering Behavior', () => {
    it('should not render children when access is denied', () => {
      const mockAuthContext = {
        user: null,
        session: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updateProfile: jest.fn(),
      };

      const mockPermissionsContext = {
        hasPermission: jest.fn(),
        userRole: null,
      };

      renderWithProviders(
        <ProtectedRoute>
          <div>Should Not Render</div>
        </ProtectedRoute>,
        {
          authContext: mockAuthContext,
          permissionsContext: mockPermissionsContext,
        }
      );

      expect(screen.queryByText('Should Not Render')).not.toBeInTheDocument();
    });

    it('should render children when all checks pass', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { role: 'operator' },
      };

      const mockAuthContext = {
        user: mockUser,
        session: { access_token: 'token' },
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updateProfile: jest.fn(),
      };

      const mockPermissionsContext = {
        hasPermission: jest.fn().mockReturnValue(true),
        userRole: 'operator',
      };

      renderWithProviders(
        <ProtectedRoute requiredPermission="farmers:read">
          <div>Authorized Content</div>
          <span>Nested Element</span>
        </ProtectedRoute>,
        {
          authContext: mockAuthContext,
          permissionsContext: mockPermissionsContext,
        }
      );

      expect(screen.getByText('Authorized Content')).toBeInTheDocument();
      expect(screen.getByText('Nested Element')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined user metadata gracefully', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        // No user_metadata
      };

      const mockAuthContext = {
        user: mockUser,
        session: { access_token: 'token' },
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updateProfile: jest.fn(),
      };

      const mockPermissionsContext = {
        hasPermission: jest.fn(),
        userRole: undefined,
      };

      renderWithProviders(
        <ProtectedRoute requiredRole="operator">
          <div>Content</div>
        </ProtectedRoute>,
        {
          authContext: mockAuthContext,
          permissionsContext: mockPermissionsContext,
        }
      );

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should handle empty permission string', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { role: 'operator' },
      };

      const mockAuthContext = {
        user: mockUser,
        session: { access_token: 'token' },
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updateProfile: jest.fn(),
      };

      const mockPermissionsContext = {
        hasPermission: jest.fn().mockReturnValue(true),
        userRole: 'operator',
      };

      renderWithProviders(
        <ProtectedRoute requiredPermission="">
          <div>Content</div>
        </ProtectedRoute>,
        {
          authContext: mockAuthContext,
          permissionsContext: mockPermissionsContext,
        }
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });
});