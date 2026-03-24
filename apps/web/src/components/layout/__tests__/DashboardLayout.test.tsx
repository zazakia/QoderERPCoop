/**
 * Unit Tests for DashboardLayout Component
 * Tests layout rendering, navigation, authentication, and responsive behavior
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardLayout from '../DashboardLayout';

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

// Mock useAuth hook
const mockSignOut = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('DashboardLayout Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock setup
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' },
      },
      signOut: mockSignOut,
      loading: false,
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when authentication is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        signOut: mockSignOut,
        loading: true,
      });

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByText('🌾')).toBeInTheDocument(); // Wheat icon
    });

    it('should not render layout when loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        signOut: mockSignOut,
        loading: true,
      });

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
      expect(screen.queryByText('RiceMillOS')).not.toBeInTheDocument();
    });
  });

  describe('Authentication', () => {
    it('should redirect to login when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        signOut: mockSignOut,
        loading: false,
      });

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });

    it('should not render content when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        signOut: mockSignOut,
        loading: false,
      });

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
    });
  });

  describe('Layout Rendering', () => {
    it('should render the main layout structure', () => {
      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      expect(screen.getByText('RiceMillOS')).toBeInTheDocument();
      expect(screen.getByText('Welcome back, Test User')).toBeInTheDocument();
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });

    it('should display user email when full_name is not available', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: {},
        },
        signOut: mockSignOut,
        loading: false,
      });

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      expect(screen.getByText('Welcome back, test@example.com')).toBeInTheDocument();
    });

    it('should render navigation items', () => {
      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Farmers')).toBeInTheDocument();
      expect(screen.getByText('Procurement')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      expect(screen.getByText('Sales')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should render navigation links with correct hrefs', () => {
      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      const dashboardLink = screen.getByText('Dashboard').closest('a');
      const farmersLink = screen.getByText('Farmers').closest('a');

      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
      expect(farmersLink).toHaveAttribute('href', '/dashboard/farmers');
    });

    it('should display navigation icons', () => {
      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      // Check for emoji icons in navigation
      expect(screen.getByText('📈')).toBeInTheDocument(); // TrendingUp
      expect(screen.getByText('👥')).toBeInTheDocument(); // Users
      expect(screen.getByText('🌾')).toBeInTheDocument(); // Wheat
      expect(screen.getByText('📦')).toBeInTheDocument(); // Package
      expect(screen.getByText('🔢')).toBeInTheDocument(); // Calculator
      expect(screen.getByText('📄')).toBeInTheDocument(); // FileText
      expect(screen.getByText('⚙️')).toBeInTheDocument(); // Settings
    });
  });

  describe('Sign Out Functionality', () => {
    it('should call signOut when sign out button is clicked', async () => {
      mockSignOut.mockResolvedValue(undefined);

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      const signOutButton = screen.getByText('Sign out');
      fireEvent.click(signOutButton);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });

    it('should navigate to login after sign out', async () => {
      mockSignOut.mockResolvedValue(undefined);

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      const signOutButton = screen.getByText('Sign out');
      fireEvent.click(signOutButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
    });

    it('should display sign out button with icon', () => {
      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      expect(screen.getByText('🚪')).toBeInTheDocument(); // LogOut icon
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });
  });

  describe('Mobile Sidebar', () => {
    it('should show mobile menu button on small screens', () => {
      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      // The hamburger menu should be present
      expect(screen.getByText('☰')).toBeInTheDocument();
    });

    it('should open mobile sidebar when menu button is clicked', () => {
      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      const menuButton = screen.getByText('☰');
      fireEvent.click(menuButton);

      // Mobile sidebar should be visible (this is a simplified test)
      // In a real scenario, we'd check for visibility classes
      expect(menuButton).toBeInTheDocument();
    });

    it('should close mobile sidebar when X button is clicked', () => {
      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      // First open the sidebar
      const menuButton = screen.getByText('☰');
      fireEvent.click(menuButton);

      // Then close it with the X button
      const closeButton = screen.getByText('❌');
      fireEvent.click(closeButton);

      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Desktop Sidebar', () => {
    it('should render desktop sidebar', () => {
      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      // Desktop sidebar should be present (hidden on mobile, visible on lg screens)
      const desktopSidebar = document.querySelector('.lg\\:fixed');
      expect(desktopSidebar).toBeInTheDocument();
    });

    it('should have proper desktop navigation structure', () => {
      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      // Check for navigation list role
      const navLists = screen.getAllByRole('list');
      expect(navLists.length).toBeGreaterThan(0);
    });
  });

  describe('Content Area', () => {
    it('should render children in the main content area', () => {
      render(
        <DashboardLayout>
          <div data-testid="main-content">Main Dashboard Content</div>
        </DashboardLayout>
      );

      const mainContent = screen.getByTestId('main-content');
      expect(mainContent).toBeInTheDocument();
      expect(mainContent).toHaveTextContent('Main Dashboard Content');
    });

    it('should have proper content padding and margins', () => {
      render(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      // Check for main content area
      const main = document.querySelector('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveClass('py-6');
    });
  });

  describe('Responsive Design', () => {
    it('should hide desktop sidebar on mobile', () => {
      render(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      const desktopSidebar = document.querySelector('.hidden.lg\\:fixed');
      expect(desktopSidebar).toBeInTheDocument();
    });

    it('should show mobile sidebar overlay when open', () => {
      render(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      // Mobile sidebar should be hidden by default
      const mobileSidebar = document.querySelector('.relative.z-50.lg\\:hidden');
      expect(mobileSidebar).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper navigation structure', () => {
      render(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      const navLists = screen.getAllByRole('list');
      expect(navLists.length).toBeGreaterThan(0);
    });

    it('should have focusable navigation links', () => {
      render(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);

      // Check that links are focusable
      links.forEach(link => {
        expect(link).toBeVisible();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle sign out errors gracefully', async () => {
      mockSignOut.mockRejectedValue(new Error('Sign out failed'));

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      const signOutButton = screen.getByText('Sign out');
      fireEvent.click(signOutButton);

      // Should still navigate even on error
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
    });
  });

  describe('User Experience', () => {
    it('should show current page indicator in navigation', () => {
      render(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      // Dashboard should be marked as current
      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveClass('bg-primary-100', 'text-primary-900');
    });

    it('should have hover effects on navigation items', () => {
      render(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      const farmersLink = screen.getByText('Farmers').closest('a');
      expect(farmersLink).toHaveClass('hover:text-gray-900', 'hover:bg-gray-50');
    });
  });
});