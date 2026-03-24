/**
 * Unit Tests for Alert Component
 * Tests different alert types and styling
 */

import { render, screen } from '@testing-library/react';
import { Alert } from '../Alert';

describe('Alert Component', () => {
  describe('Rendering', () => {
    it('should render with success type', () => {
      render(<Alert type="success" message="Operation successful" />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('Operation successful');
      expect(alert).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800');
    });

    it('should render with error type', () => {
      render(<Alert type="error" message="Something went wrong" />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('Something went wrong');
      expect(alert).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800');
    });

    it('should render with warning type', () => {
      render(<Alert type="warning" message="Please be careful" />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('Please be careful');
      expect(alert).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800');
    });

    it('should render with info type', () => {
      render(<Alert type="info" message="Here is some information" />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('Here is some information');
      expect(alert).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800');
    });
  });

  describe('Styling', () => {
    it('should apply base classes to all alert types', () => {
      render(<Alert type="success" message="Test" />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('p-4', 'rounded-lg', 'border');
    });

    it('should apply custom className when provided', () => {
      render(<Alert type="error" message="Test" className="custom-class" />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('custom-class');
    });

    it('should combine base, type, and custom classes', () => {
      render(<Alert type="info" message="Test" className="my-custom-alert" />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass(
        'p-4',
        'rounded-lg',
        'border',
        'bg-blue-50',
        'border-blue-200',
        'text-blue-800',
        'my-custom-alert'
      );
    });
  });

  describe('Accessibility', () => {
    it('should have role="alert" for all alert types', () => {
      render(<Alert type="warning" message="Warning message" />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should display the message text', () => {
      const message = 'This is an important alert message';
      render(<Alert type="error" message={message} />);

      expect(screen.getByText(message)).toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('should handle empty message', () => {
      render(<Alert type="info" message="" />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('');
    });

    it('should handle long messages', () => {
      const longMessage = 'This is a very long alert message that contains a lot of text and should still be displayed properly within the alert component without any issues or truncation problems.';
      render(<Alert type="success" message={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle special characters', () => {
      const specialMessage = 'Alert: 50% complete! @#$%^&*()';
      render(<Alert type="warning" message={specialMessage} />);

      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it('should handle multiline messages', () => {
      const multilineMessage = 'Line 1\nLine 2\nLine 3';
      render(<Alert type="error" message={multilineMessage} />);

      // Check that each line is present
      expect(screen.getByText(/Line 1/)).toBeInTheDocument();
      expect(screen.getByText(/Line 2/)).toBeInTheDocument();
      expect(screen.getByText(/Line 3/)).toBeInTheDocument();
    });
  });

  describe('Type Validation', () => {
    it('should accept all valid types', () => {
      const validTypes: Array<'success' | 'error' | 'warning' | 'info'> = [
        'success',
        'error',
        'warning',
        'info'
      ];

      validTypes.forEach(type => {
        const { unmount } = render(<Alert type={type} message="Test" />);
        expect(screen.getByRole('alert')).toBeInTheDocument();
        unmount(); // Clean up before next iteration
      });
    });
  });

  describe('Props Handling', () => {
    it('should handle undefined className', () => {
      render(<Alert type="success" message="Test" className={undefined} />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      // Should not have undefined in className
      expect(alert.className).not.toContain('undefined');
    });

    it('should handle null className', () => {
      render(<Alert type="error" message="Test" className={null as any} />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should handle multiple className values', () => {
      render(<Alert type="info" message="Test" className="class1 class2 class3" />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('class1', 'class2', 'class3');
    });
  });

  describe('Visual Design', () => {
    it('should have consistent padding for all types', () => {
      render(<Alert type="success" message="Test" />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('p-4');
    });

    it('should have consistent border radius for all types', () => {
      render(<Alert type="warning" message="Test" />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('rounded-lg');
    });

    it('should have border for all types', () => {
      render(<Alert type="error" message="Test" />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('border');
    });
  });

  describe('Integration', () => {
    it('should work with React fragments', () => {
      render(
        <>
          <Alert type="success" message="First alert" />
          <Alert type="error" message="Second alert" />
        </>
      );

      expect(screen.getByText('First alert')).toBeInTheDocument();
      expect(screen.getByText('Second alert')).toBeInTheDocument();
      expect(screen.getAllByRole('alert')).toHaveLength(2);
    });

    it('should work within form elements', () => {
      render(
        <form>
          <Alert type="warning" message="Form validation error" />
          <input type="text" />
        </form>
      );

      expect(screen.getByText('Form validation error')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });
});