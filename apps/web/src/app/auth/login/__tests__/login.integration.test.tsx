import { renderWithProviders, mockUser, mockSession } from '@/test/test-utils';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../page';

// Integration test for login flow
describe('Login Integration', () => {
  const mockSignIn = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock next/navigation
    jest.mock('next/navigation', () => ({
      useRouter: () => ({
        push: mockPush,
      }),
    }));
  });

  it('should complete full login flow successfully', async () => {
    const user = userEvent.setup();
    
    // Mock successful login
    mockSignIn.mockResolvedValueOnce({ error: null });
    
    const { mockAuthContext } = renderWithProviders(<LoginPage />, {
      initialUser: null, // Start logged out
    });
    
    // Override the signIn function in context
    mockAuthContext.signIn = mockSignIn;
    
    // Fill in login form
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'test@ricemillos.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    // Verify signIn was called with correct credentials
    expect(mockSignIn).toHaveBeenCalledWith('test@ricemillos.com', 'password123');
    
    // Verify loading state appears
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    
    // Wait for success and navigation
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should handle login errors gracefully', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Invalid credentials';
    
    // Mock failed login
    mockSignIn.mockResolvedValueOnce({ error: { message: errorMessage } });
    
    const { mockAuthContext } = renderWithProviders(<LoginPage />, {
      initialUser: null,
    });
    
    mockAuthContext.signIn = mockSignIn;
    
    // Fill in login form with wrong credentials
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);
    
    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    
    // Verify no navigation occurred
    expect(mockPush).not.toHaveBeenCalled();
    
    // Verify form is still usable
    expect(emailInput).toBeEnabled();
    expect(passwordInput).toBeEnabled();
    expect(submitButton).toBeEnabled();
  });

  it('should validate form inputs', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<LoginPage />, { initialUser: null });
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);
    
    // Check for HTML5 validation
    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toBeInvalid();
  });

  it('should handle demo credentials quick fill', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<LoginPage />, { initialUser: null });
    
    // Demo credentials should be visible
    expect(screen.getByText(/demo credentials/i)).toBeInTheDocument();
    expect(screen.getByText(/demo@ricemillos.com/)).toBeInTheDocument();
    
    // Could add click handlers for quick demo login in the future
  });

  it('should be accessible', () => {
    renderWithProviders(<LoginPage />, { initialUser: null });
    
    // Check for proper form structure
    const form = screen.getByRole('form');
    expect(form).toBeInTheDocument();
    
    // Check for proper labels
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    
    // Check for proper headings
    expect(screen.getByRole('heading', { name: /ricemillos/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
  });
});