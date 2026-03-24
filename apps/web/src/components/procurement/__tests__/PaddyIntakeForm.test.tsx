/**
 * TDD Example: PaddyIntakeForm Component Tests
 * Written BEFORE the component implementation
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockFarmers } from '../../../test/test-utils';
import { generateMockData, checkAccessibility } from '../../setup';
import PaddyIntakeForm from '../PaddyIntakeForm';

// Mock the hooks and APIs
const mockSubmitPaddyIntake = jest.fn();
const mockFetchFarmers = jest.fn();

jest.mock('@/hooks/usePaddyIntake', () => ({
  usePaddyIntake: () => ({
    submitPaddyIntake: mockSubmitPaddyIntake,
    isLoading: false,
    error: null,
  }),
}));

jest.mock('@/hooks/useFarmers', () => ({
  useFarmers: () => ({
    farmers: mockFarmers,
    isLoading: false,
    error: null,
  }),
}));

describe('PaddyIntakeForm Component (TDD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // RED: Write failing tests first
  describe('Component Structure', () => {
    it('should render form with all required fields', () => {
      renderWithProviders(<PaddyIntakeForm />);

      // Essential form fields
      expect(screen.getByLabelText(/farmer/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/weight.*kg/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/moisture.*content/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/quality.*grade/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/price.*per.*kg/i)).toBeInTheDocument();
      
      // Action buttons
      expect(screen.getByRole('button', { name: /calculate.*total/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit.*intake/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should render farmer selection dropdown with options', () => {
      renderWithProviders(<PaddyIntakeForm />);

      const farmerSelect = screen.getByLabelText(/farmer/i);
      expect(farmerSelect).toBeInTheDocument();
      expect(farmerSelect).toHaveAttribute('type', 'select');
    });

    it('should display calculated total amount field', () => {
      renderWithProviders(<PaddyIntakeForm />);

      const totalField = screen.getByLabelText(/total.*amount/i);
      expect(totalField).toBeInTheDocument();
      expect(totalField).toHaveAttribute('readonly');
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields before submission', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaddyIntakeForm />);

      const submitButton = screen.getByRole('button', { name: /submit.*intake/i });
      await user.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/farmer.*required/i)).toBeInTheDocument();
        expect(screen.getByText(/weight.*required/i)).toBeInTheDocument();
        expect(screen.getByText(/moisture.*content.*required/i)).toBeInTheDocument();
        expect(screen.getByText(/quality.*grade.*required/i)).toBeInTheDocument();
        expect(screen.getByText(/price.*required/i)).toBeInTheDocument();
      });

      expect(mockSubmitPaddyIntake).not.toHaveBeenCalled();
    });

    it('should validate weight is positive number', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaddyIntakeForm />);

      const weightInput = screen.getByLabelText(/weight.*kg/i);
      await user.type(weightInput, '-100');
      await user.tab(); // Trigger blur event

      await waitFor(() => {
        expect(screen.getByText(/weight.*must.*positive/i)).toBeInTheDocument();
      });
    });

    it('should validate moisture content range (10-25%)', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaddyIntakeForm />);

      const moistureInput = screen.getByLabelText(/moisture.*content/i);
      
      // Test below range
      await user.type(moistureInput, '5');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/moisture.*content.*between.*10.*25/i)).toBeInTheDocument();
      });

      // Test above range
      await user.clear(moistureInput);
      await user.type(moistureInput, '30');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/moisture.*content.*between.*10.*25/i)).toBeInTheDocument();
      });
    });

    it('should validate price is positive number', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaddyIntakeForm />);

      const priceInput = screen.getByLabelText(/price.*per.*kg/i);
      await user.type(priceInput, '-5');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/price.*must.*positive/i)).toBeInTheDocument();
      });
    });
  });

  describe('Calculations', () => {
    it('should calculate total amount automatically', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaddyIntakeForm />);

      const weightInput = screen.getByLabelText(/weight.*kg/i);
      const priceInput = screen.getByLabelText(/price.*per.*kg/i);
      const totalField = screen.getByLabelText(/total.*amount/i);

      await user.type(weightInput, '1000');
      await user.type(priceInput, '25.50');

      // Should auto-calculate or trigger calculation
      await waitFor(() => {
        expect(totalField).toHaveValue('25500.00');
      });
    });

    it('should update total when weight or price changes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaddyIntakeForm />);

      const weightInput = screen.getByLabelText(/weight.*kg/i);
      const priceInput = screen.getByLabelText(/price.*per.*kg/i);
      const totalField = screen.getByLabelText(/total.*amount/i);

      // Initial calculation
      await user.type(weightInput, '500');
      await user.type(priceInput, '20');
      
      await waitFor(() => {
        expect(totalField).toHaveValue('10000.00');
      });

      // Update weight
      await user.clear(weightInput);
      await user.type(weightInput, '750');

      await waitFor(() => {
        expect(totalField).toHaveValue('15000.00');
      });
    });

    it('should handle manual calculation trigger', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaddyIntakeForm />);

      const weightInput = screen.getByLabelText(/weight.*kg/i);
      const priceInput = screen.getByLabelText(/price.*per.*kg/i);
      const calculateButton = screen.getByRole('button', { name: /calculate.*total/i });
      const totalField = screen.getByLabelText(/total.*amount/i);

      await user.type(weightInput, '800');
      await user.type(priceInput, '22.75');
      await user.click(calculateButton);

      await waitFor(() => {
        expect(totalField).toHaveValue('18200.00');
      });
    });
  });

  describe('Form Submission', () => {
    const validFormData = {
      farmer: 'farmer-123',
      weight: '1000',
      moistureContent: '14.5',
      qualityGrade: 'A',
      pricePerKg: '25.50',
    };

    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      mockSubmitPaddyIntake.mockResolvedValue({ data: { id: 'intake-123' }, error: null });
      
      renderWithProviders(<PaddyIntakeForm />);

      // Fill form
      await user.selectOptions(screen.getByLabelText(/farmer/i), validFormData.farmer);
      await user.type(screen.getByLabelText(/weight.*kg/i), validFormData.weight);
      await user.type(screen.getByLabelText(/moisture.*content/i), validFormData.moistureContent);
      await user.selectOptions(screen.getByLabelText(/quality.*grade/i), validFormData.qualityGrade);
      await user.type(screen.getByLabelText(/price.*per.*kg/i), validFormData.pricePerKg);

      // Submit
      await user.click(screen.getByRole('button', { name: /submit.*intake/i }));

      await waitFor(() => {
        expect(mockSubmitPaddyIntake).toHaveBeenCalledWith({
          farmerId: validFormData.farmer,
          weight: 1000,
          moistureContent: 14.5,
          qualityGrade: validFormData.qualityGrade,
          pricePerKg: 25.50,
          totalAmount: 25500,
          date: expect.any(String),
        });
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      
      // Mock delayed response
      mockSubmitPaddyIntake.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: {}, error: null }), 100))
      );

      renderWithProviders(<PaddyIntakeForm />);

      // Fill and submit form
      await user.selectOptions(screen.getByLabelText(/farmer/i), validFormData.farmer);
      await user.type(screen.getByLabelText(/weight.*kg/i), validFormData.weight);
      await user.type(screen.getByLabelText(/moisture.*content/i), validFormData.moistureContent);
      await user.selectOptions(screen.getByLabelText(/quality.*grade/i), validFormData.qualityGrade);
      await user.type(screen.getByLabelText(/price.*per.*kg/i), validFormData.pricePerKg);

      const submitButton = screen.getByRole('button', { name: /submit.*intake/i });
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText(/submitting/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should handle submission errors', async () => {
      const user = userEvent.setup();
      mockSubmitPaddyIntake.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database connection failed' } 
      });

      renderWithProviders(<PaddyIntakeForm />);

      // Fill and submit form
      await user.selectOptions(screen.getByLabelText(/farmer/i), validFormData.farmer);
      await user.type(screen.getByLabelText(/weight.*kg/i), validFormData.weight);
      await user.type(screen.getByLabelText(/moisture.*content/i), validFormData.moistureContent);
      await user.selectOptions(screen.getByLabelText(/quality.*grade/i), validFormData.qualityGrade);
      await user.type(screen.getByLabelText(/price.*per.*kg/i), validFormData.pricePerKg);

      await user.click(screen.getByRole('button', { name: /submit.*intake/i }));

      await waitFor(() => {
        expect(screen.getByText(/database connection failed/i)).toBeInTheDocument();
      });

      // Form should remain interactive
      expect(screen.getByRole('button', { name: /submit.*intake/i })).not.toBeDisabled();
    });

    it('should reset form after successful submission', async () => {
      const user = userEvent.setup();
      mockSubmitPaddyIntake.mockResolvedValue({ data: { id: 'intake-123' }, error: null });

      renderWithProviders(<PaddyIntakeForm />);

      // Fill and submit form
      await user.selectOptions(screen.getByLabelText(/farmer/i), validFormData.farmer);
      await user.type(screen.getByLabelText(/weight.*kg/i), validFormData.weight);
      
      await user.click(screen.getByRole('button', { name: /submit.*intake/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/farmer/i)).toHaveValue('');
        expect(screen.getByLabelText(/weight.*kg/i)).toHaveValue('');
      });
    });
  });

  describe('User Experience', () => {
    it('should handle form cancellation', async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();
      
      renderWithProviders(<PaddyIntakeForm onCancel={mockOnCancel} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should show success message after submission', async () => {
      const user = userEvent.setup();
      mockSubmitPaddyIntake.mockResolvedValue({ data: { id: 'intake-123' }, error: null });

      renderWithProviders(<PaddyIntakeForm />);

      // Fill minimal form and submit
      await user.selectOptions(screen.getByLabelText(/farmer/i), validFormData.farmer);
      await user.type(screen.getByLabelText(/weight.*kg/i), validFormData.weight);
      await user.type(screen.getByLabelText(/moisture.*content/i), validFormData.moistureContent);
      await user.selectOptions(screen.getByLabelText(/quality.*grade/i), validFormData.qualityGrade);
      await user.type(screen.getByLabelText(/price.*per.*kg/i), validFormData.pricePerKg);

      await user.click(screen.getByRole('button', { name: /submit.*intake/i }));

      await waitFor(() => {
        expect(screen.getByText(/paddy intake.*recorded.*successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should be accessible to screen readers', () => {
      renderWithProviders(<PaddyIntakeForm />);
      
      const form = screen.getByRole('form');
      const accessibilityIssues = checkAccessibility(form);
      
      expect(accessibilityIssues).toHaveLength(0);
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaddyIntakeForm />);

      const farmerSelect = screen.getByLabelText(/farmer/i);
      farmerSelect.focus();
      expect(farmerSelect).toHaveFocus();

      // Tab through form fields
      await user.tab();
      expect(screen.getByLabelText(/weight.*kg/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/moisture.*content/i)).toHaveFocus();
    });

    it('should announce form errors to screen readers', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaddyIntakeForm />);

      await user.click(screen.getByRole('button', { name: /submit.*intake/i }));

      await waitFor(() => {
        const errorMessages = screen.getAllByRole('alert');
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance', () => {
    it('should render quickly with large farmer list', () => {
      const largeFarmerList = Array.from({ length: 1000 }, (_, i) => 
        generateMockData.farmer({ id: `farmer-${i}`, name: `Farmer ${i}` })
      );

      const startTime = performance.now();
      renderWithProviders(<PaddyIntakeForm farmers={largeFarmerList} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should render in under 100ms
    });
  });
});