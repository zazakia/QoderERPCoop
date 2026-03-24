/**
 * Unit Tests for usePaddyIntake Hook
 * Tests the paddy intake operations hook in isolation
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { usePaddyIntake } from '../usePaddyIntake';

// Mock the providers module first
jest.mock('@/app/providers', () => ({
  useSupabase: jest.fn(),
}));

// Mock Supabase client
const mockSelect = jest.fn();
const mockInsert = jest.fn();

const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
  })),
};

// Set up the useSupabase mock to return our mock client
const mockUseSupabase = require('@/app/providers').useSupabase;
mockUseSupabase.mockReturnValue({ supabase: mockSupabaseClient });

describe('usePaddyIntake Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mock chain
    mockSelect.mockReturnThis();
    mockInsert.mockReturnThis();
  });

  describe('Initial State', () => {
    it('should initialize with loading false and no error', () => {
      const { result } = renderHook(() => usePaddyIntake());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.submitPaddyIntake).toBe('function');
    });
  });

  describe('submitPaddyIntake', () => {
    const validPaddyIntakeData = {
      farmerId: 'farmer-123',
      weight: 1000,
      moistureContent: 14.5,
      qualityGrade: 'A' as const,
      pricePerKg: 25.50,
      totalAmount: 25500,
      date: '2024-01-01T00:00:00Z',
    };

    it('should submit paddy intake successfully', async () => {
      const expectedInsertData = {
        farmer_id: 'farmer-123',
        weight: 1000,
        moisture_content: 14.5,
        quality_grade: 'A',
        price_per_kg: 25.50,
        total_amount: 25500,
        intake_date: '2024-01-01T00:00:00Z',
        created_at: expect.any(String),
      };

      const mockResponse = {
        data: [{
          id: 'intake-1',
          ...expectedInsertData,
        }],
        error: null,
      };

      mockInsert.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePaddyIntake());

      const submitResult = await act(async () => {
        return await result.current.submitPaddyIntake(validPaddyIntakeData);
      });

      expect(submitResult.data).toEqual(mockResponse.data[0]);
      expect(submitResult.error).toBeNull();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('paddy_intakes');
      expect(mockInsert).toHaveBeenCalledWith([expectedInsertData]);
      expect(mockSelect).toHaveBeenCalledWith();
    });

    it('should handle submission errors', async () => {
      const errorMessage = 'Invalid farmer ID';
      mockInsert.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      const { result } = renderHook(() => usePaddyIntake());

      const submitResult = await act(async () => {
        return await result.current.submitPaddyIntake(validPaddyIntakeData);
      });

      expect(submitResult.data).toBeNull();
      expect(submitResult.error).toEqual({ message: errorMessage });
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network connection failed');
      mockInsert.mockRejectedValue(networkError);

      const { result } = renderHook(() => usePaddyIntake());

      const submitResult = await act(async () => {
        return await result.current.submitPaddyIntake(validPaddyIntakeData);
      });

      expect(submitResult.data).toBeNull();
      expect(submitResult.error).toBe(networkError);
    });

    it('should set loading to true during submission', async () => {
      let resolveInsert: (value: any) => void;
      const insertPromise = new Promise((resolve) => {
        resolveInsert = resolve;
      });

      mockInsert.mockReturnValue(insertPromise);

      const { result } = renderHook(() => usePaddyIntake());

      const submitPromise = act(async () => {
        return await result.current.submitPaddyIntake(validPaddyIntakeData);
      });

      // Loading should be true during submission
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      resolveInsert({
        data: [{ id: 'intake-1', ...validPaddyIntakeData }],
        error: null,
      });

      await submitPromise;

      // Loading should be false after completion
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set error state on failure', async () => {
      const errorMessage = 'Database constraint violation';
      mockInsert.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      const { result } = renderHook(() => usePaddyIntake());

      await act(async () => {
        await result.current.submitPaddyIntake(validPaddyIntakeData);
      });

      expect(result.current.error).toEqual({ message: errorMessage });
      expect(result.current.isLoading).toBe(false);
    });

    it('should clear previous error on new submission', async () => {
      // First submission fails
      mockInsert.mockResolvedValueOnce({
        data: null,
        error: { message: 'First error' },
      });

      // Second submission succeeds
      mockInsert.mockResolvedValueOnce({
        data: [{ id: 'intake-1', ...validPaddyIntakeData }],
        error: null,
      });

      const { result } = renderHook(() => usePaddyIntake());

      // First failed submission
      await act(async () => {
        await result.current.submitPaddyIntake(validPaddyIntakeData);
      });

      expect(result.current.error).toEqual({ message: 'First error' });

      // Second successful submission
      await act(async () => {
        await result.current.submitPaddyIntake(validPaddyIntakeData);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Data Validation and Transformation', () => {
    it('should transform data correctly for database insertion', async () => {
      const inputData = {
        farmerId: 'farmer-123',
        weight: 500.5,
        moistureContent: 12.3,
        qualityGrade: 'B' as const,
        pricePerKg: 22.75,
        totalAmount: 11375,
        date: '2024-01-15T10:30:00Z',
      };

      const expectedDbData = {
        farmer_id: 'farmer-123',
        weight: 500.5,
        moisture_content: 12.3,
        quality_grade: 'B',
        price_per_kg: 22.75,
        total_amount: 11375,
        intake_date: '2024-01-15T10:30:00Z',
        created_at: expect.any(String),
      };

      mockInsert.mockResolvedValue({
        data: [{ id: 'intake-1', ...expectedDbData }],
        error: null,
      });

      const { result } = renderHook(() => usePaddyIntake());

      await act(async () => {
        await result.current.submitPaddyIntake(inputData);
      });

      expect(mockInsert).toHaveBeenCalledWith([expectedDbData]);
    });

    it('should handle all quality grades', async () => {
      const qualityGrades = ['A', 'B', 'C'] as const;

      for (const grade of qualityGrades) {
        mockInsert.mockResolvedValueOnce({
          data: [{ id: `intake-${grade}`, quality_grade: grade }],
          error: null,
        });

        const { result } = renderHook(() => usePaddyIntake());

        await act(async () => {
          await result.current.submitPaddyIntake({
            ...validPaddyIntakeData,
            qualityGrade: grade,
          });
        });

        expect(mockInsert).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ quality_grade: grade })
          ])
        );
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockInsert.mockRejectedValue(new Error('Connection timeout'));

      const { result } = renderHook(() => usePaddyIntake());

      const submitResult = await act(async () => {
        return await result.current.submitPaddyIntake(validPaddyIntakeData);
      });

      expect(submitResult.error).toBeInstanceOf(Error);
      expect(submitResult.error.message).toBe('Connection timeout');
      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('should handle permission errors', async () => {
      mockInsert.mockResolvedValue({
        data: null,
        error: { message: 'Insufficient permissions', code: 'PGRST301' },
      });

      const { result } = renderHook(() => usePaddyIntake());

      await act(async () => {
        await result.current.submitPaddyIntake(validPaddyIntakeData);
      });

      expect(result.current.error).toEqual({
        message: 'Insufficient permissions',
        code: 'PGRST301'
      });
    });

    it('should handle constraint violations', async () => {
      mockInsert.mockResolvedValue({
        data: null,
        error: { message: 'Farmer does not exist', code: '23503' },
      });

      const { result } = renderHook(() => usePaddyIntake());

      await act(async () => {
        await result.current.submitPaddyIntake(validPaddyIntakeData);
      });

      expect(result.current.error).toEqual({
        message: 'Farmer does not exist',
        code: '23503'
      });
    });
  });

  describe('Loading State Management', () => {
    it('should reset loading state after successful submission', async () => {
      mockInsert.mockResolvedValue({
        data: [{ id: 'intake-1' }],
        error: null,
      });

      const { result } = renderHook(() => usePaddyIntake());

      expect(result.current.isLoading).toBe(false);

      await act(async () => {
        await result.current.submitPaddyIntake(validPaddyIntakeData);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should reset loading state after failed submission', async () => {
      mockInsert.mockResolvedValue({
        data: null,
        error: { message: 'Submission failed' },
      });

      const { result } = renderHook(() => usePaddyIntake());

      expect(result.current.isLoading).toBe(false);

      await act(async () => {
        await result.current.submitPaddyIntake(validPaddyIntakeData);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle multiple concurrent submissions', async () => {
      let resolveFirst: (value: any) => void;
      let resolveSecond: (value: any) => void;

      const firstPromise = new Promise((resolve) => {
        resolveFirst = resolve;
      });

      const secondPromise = new Promise((resolve) => {
        resolveSecond = resolve;
      });

      mockInsert
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise);

      const { result } = renderHook(() => usePaddyIntake());

      const firstSubmission = act(async () => {
        return await result.current.submitPaddyIntake({
          ...validPaddyIntakeData,
          farmerId: 'farmer-1',
        });
      });

      const secondSubmission = act(async () => {
        return await result.current.submitPaddyIntake({
          ...validPaddyIntakeData,
          farmerId: 'farmer-2',
        });
      });

      // Both should be loading
      expect(result.current.isLoading).toBe(true);

      // Resolve first submission
      resolveFirst({
        data: [{ id: 'intake-1' }],
        error: null,
      });

      await firstSubmission;

      // Should still be loading (second submission pending)
      expect(result.current.isLoading).toBe(true);

      // Resolve second submission
      resolveSecond({
        data: [{ id: 'intake-2' }],
        error: null,
      });

      await secondSubmission;

      // Should no longer be loading
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('should accept valid quality grades', async () => {
      const validGrades: Array<'A' | 'B' | 'C'> = ['A', 'B', 'C'];

      for (const grade of validGrades) {
        mockInsert.mockResolvedValueOnce({
          data: [{ id: `intake-${grade}` }],
          error: null,
        });

        const { result } = renderHook(() => usePaddyIntake());

        await act(async () => {
          await result.current.submitPaddyIntake({
            ...validPaddyIntakeData,
            qualityGrade: grade,
          });
        });
      }
    });

    it('should handle numeric values correctly', async () => {
      const numericData = {
        farmerId: 'farmer-123',
        weight: 1000.5,
        moistureContent: 14.25,
        qualityGrade: 'A' as const,
        pricePerKg: 25.99,
        totalAmount: 25990,
        date: '2024-01-01T00:00:00Z',
      };

      mockInsert.mockResolvedValue({
        data: [{ id: 'intake-1' }],
        error: null,
      });

      const { result } = renderHook(() => usePaddyIntake());

      await act(async () => {
        await result.current.submitPaddyIntake(numericData);
      });

      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          weight: 1000.5,
          moisture_content: 14.25,
          price_per_kg: 25.99,
          total_amount: 25990,
        })
      ]);
    });
  });
});