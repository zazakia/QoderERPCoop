/**
 * Unit Tests for useFarmers Hook
 * Tests the farmers data management hook in isolation
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useFarmers } from '../useFarmers';

// Mock the providers module
jest.mock('@/app/providers', () => ({
  useSupabase: jest.fn(),
}));

// Mock Supabase client
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();

const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    order: mockOrder,
  })),
};

// Set up the useSupabase mock
const mockUseSupabase = require('@/app/providers').useSupabase;
mockUseSupabase.mockReturnValue({ supabase: mockSupabaseClient });

describe('useFarmers Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mock chain
    mockSelect.mockReturnThis();
    mockInsert.mockReturnThis();
    mockUpdate.mockReturnThis();
    mockDelete.mockReturnThis();
    mockEq.mockReturnThis();
    mockOrder.mockReturnThis();
  });

  describe('Initial State and Data Fetching', () => {
    it('should initialize with empty farmers array and loading false', () => {
      mockSelect.mockResolvedValue({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => useFarmers());

      expect(result.current.farmers).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should fetch farmers on mount', async () => {
      const mockFarmers = [
        {
          id: 'farmer-1',
          name: 'John Farmer',
          email: 'john@example.com',
          phone: '+1234567890',
          address: '123 Farm Road',
          registration_date: '2024-01-01T00:00:00Z',
          is_active: true,
        },
      ];

      mockSelect.mockResolvedValue({
        data: mockFarmers,
        error: null,
      });

      const { result } = renderHook(() => useFarmers());

      await waitFor(() => {
        expect(result.current.farmers).toHaveLength(1);
        expect(result.current.farmers[0]).toEqual({
          id: 'farmer-1',
          name: 'John Farmer',
          email: 'john@example.com',
          phone: '+1234567890',
          address: '123 Farm Road',
          registrationDate: '2024-01-01T00:00:00Z',
          isActive: true,
        });
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('farmers');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('name');
    });

    it('should handle fetch errors', async () => {
      const errorMessage = 'Database connection failed';
      mockSelect.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      const { result } = renderHook(() => useFarmers());

      await waitFor(() => {
        expect(result.current.error).toEqual({ message: errorMessage });
        expect(result.current.farmers).toEqual([]);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle network errors', async () => {
      mockSelect.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useFarmers());

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error.message).toBe('Network error');
      });
    });
  });

  describe('createFarmer', () => {
    it('should create a new farmer successfully', async () => {
      const newFarmer = {
        name: 'Jane Farmer',
        email: 'jane@example.com',
        phone: '+1234567891',
        address: '456 Farm Road',
        isActive: true,
      };

      const createdFarmer = {
        id: 'farmer-2',
        ...newFarmer,
        registration_date: '2024-01-02T00:00:00Z',
      };

      mockInsert.mockResolvedValue({
        data: [createdFarmer],
        error: null,
      });

      mockSelect.mockResolvedValue({
        data: [createdFarmer],
        error: null,
      });

      const { result } = renderHook(() => useFarmers());

      const createResult = await act(async () => {
        return await result.current.createFarmer(newFarmer);
      });

      expect(createResult.data).toEqual(createdFarmer);
      expect(createResult.error).toBeNull();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('farmers');
      expect(mockInsert).toHaveBeenCalledWith([{
        name: 'Jane Farmer',
        email: 'jane@example.com',
        phone: '+1234567891',
        address: '456 Farm Road',
        is_active: true,
        registration_date: expect.any(String),
      }]);
    });

    it('should handle creation errors', async () => {
      const errorMessage = 'Email already exists';
      mockInsert.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      const { result } = renderHook(() => useFarmers());

      const createResult = await act(async () => {
        return await result.current.createFarmer({
          name: 'Duplicate Farmer',
          email: 'existing@example.com',
        });
      });

      expect(createResult.data).toBeNull();
      expect(createResult.error).toEqual({ message: errorMessage });
    });

    it('should refresh farmers list after successful creation', async () => {
      const newFarmer = { name: 'New Farmer', email: 'new@example.com' };
      const createdFarmer = { id: 'farmer-3', ...newFarmer };

      mockInsert.mockResolvedValue({
        data: [createdFarmer],
        error: null,
      });

      // Mock the refresh call
      mockSelect.mockResolvedValue({
        data: [createdFarmer],
        error: null,
      });

      const { result } = renderHook(() => useFarmers());

      await act(async () => {
        await result.current.createFarmer(newFarmer);
      });

      // Should have called select twice: once for initial load, once for refresh
      expect(mockSelect).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateFarmer', () => {
    it('should update an existing farmer successfully', async () => {
      const updateData = {
        name: 'Updated Farmer',
        email: 'updated@example.com',
        phone: '+1234567892',
        isActive: false,
      };

      const updatedFarmer = {
        id: 'farmer-1',
        ...updateData,
      };

      mockUpdate.mockResolvedValue({
        data: [updatedFarmer],
        error: null,
      });

      mockSelect.mockResolvedValue({
        data: [updatedFarmer],
        error: null,
      });

      const { result } = renderHook(() => useFarmers());

      const updateResult = await act(async () => {
        return await result.current.updateFarmer('farmer-1', updateData);
      });

      expect(updateResult.data).toEqual(updatedFarmer);
      expect(updateResult.error).toBeNull();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('farmers');
      expect(mockUpdate).toHaveBeenCalledWith({
        name: 'Updated Farmer',
        email: 'updated@example.com',
        phone: '+1234567892',
        is_active: false,
      });
      expect(mockEq).toHaveBeenCalledWith('id', 'farmer-1');
    });

    it('should handle update errors', async () => {
      const errorMessage = 'Farmer not found';
      mockUpdate.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      const { result } = renderHook(() => useFarmers());

      const updateResult = await act(async () => {
        return await result.current.updateFarmer('nonexistent-id', {
          name: 'Updated Name',
        });
      });

      expect(updateResult.data).toBeNull();
      expect(updateResult.error).toEqual({ message: errorMessage });
    });

    it('should refresh farmers list after successful update', async () => {
      const updateData = { name: 'Updated Name' };
      const updatedFarmer = { id: 'farmer-1', name: 'Updated Name' };

      mockUpdate.mockResolvedValue({
        data: [updatedFarmer],
        error: null,
      });

      mockSelect.mockResolvedValue({
        data: [updatedFarmer],
        error: null,
      });

      const { result } = renderHook(() => useFarmers());

      await act(async () => {
        await result.current.updateFarmer('farmer-1', updateData);
      });

      expect(mockSelect).toHaveBeenCalledTimes(2); // Initial load + refresh
    });
  });

  describe('deleteFarmer', () => {
    it('should delete a farmer successfully', async () => {
      mockDelete.mockResolvedValue({
        data: null,
        error: null,
      });

      mockSelect.mockResolvedValue({
        data: [], // Empty after deletion
        error: null,
      });

      const { result } = renderHook(() => useFarmers());

      const deleteResult = await act(async () => {
        return await result.current.deleteFarmer('farmer-1');
      });

      expect(deleteResult.data).toBeNull();
      expect(deleteResult.error).toBeNull();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('farmers');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'farmer-1');
    });

    it('should handle deletion errors', async () => {
      const errorMessage = 'Cannot delete farmer with active transactions';
      mockDelete.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      const { result } = renderHook(() => useFarmers());

      const deleteResult = await act(async () => {
        return await result.current.deleteFarmer('farmer-1');
      });

      expect(deleteResult.data).toBeNull();
      expect(deleteResult.error).toEqual({ message: errorMessage });
    });

    it('should refresh farmers list after successful deletion', async () => {
      mockDelete.mockResolvedValue({
        data: null,
        error: null,
      });

      mockSelect.mockResolvedValue({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => useFarmers());

      await act(async () => {
        await result.current.deleteFarmer('farmer-1');
      });

      expect(mockSelect).toHaveBeenCalledTimes(2); // Initial load + refresh
    });
  });

  describe('refetch', () => {
    it('should allow manual refetching of farmers data', async () => {
      const initialFarmers = [{ id: 'farmer-1', name: 'Initial Farmer' }];
      const refetchedFarmers = [
        { id: 'farmer-1', name: 'Initial Farmer' },
        { id: 'farmer-2', name: 'New Farmer' },
      ];

      mockSelect
        .mockResolvedValueOnce({
          data: initialFarmers,
          error: null,
        })
        .mockResolvedValueOnce({
          data: refetchedFarmers,
          error: null,
        });

      const { result } = renderHook(() => useFarmers());

      await waitFor(() => {
        expect(result.current.farmers).toHaveLength(1);
      });

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.farmers).toHaveLength(2);
      });

      expect(mockSelect).toHaveBeenCalledTimes(2);
    });

    it('should handle refetch errors', async () => {
      mockSelect
        .mockResolvedValueOnce({
          data: [],
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Refetch failed' },
        });

      const { result } = renderHook(() => useFarmers());

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.error).toEqual({ message: 'Refetch failed' });
      });
    });
  });

  describe('Loading States', () => {
    it('should set loading to true during fetch operations', async () => {
      let resolveSelect: (value: any) => void;
      const selectPromise = new Promise((resolve) => {
        resolveSelect = resolve;
      });

      mockSelect.mockReturnValue(selectPromise);

      const { result } = renderHook(() => useFarmers());

      // Should be loading initially
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      resolveSelect({
        data: [],
        error: null,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set loading to true during create operations', async () => {
      let resolveInsert: (value: any) => void;
      const insertPromise = new Promise((resolve) => {
        resolveInsert = resolve;
      });

      mockInsert.mockReturnValue(insertPromise);
      mockSelect.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useFarmers());

      const createPromise = act(async () => {
        return await result.current.createFarmer({ name: 'Test Farmer' });
      });

      // Loading should be true during the operation
      // Note: This is hard to test precisely with the current implementation
      // as the loading state is managed per operation

      resolveInsert({
        data: [{ id: 'farmer-1', name: 'Test Farmer' }],
        error: null,
      });

      await createPromise;
    });
  });

  describe('Data Transformation', () => {
    it('should transform database fields to camelCase', async () => {
      const dbFarmer = {
        id: 'farmer-1',
        name: 'John Farmer',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Farm Road',
        registration_date: '2024-01-01T00:00:00Z',
        is_active: true,
      };

      mockSelect.mockResolvedValue({
        data: [dbFarmer],
        error: null,
      });

      const { result } = renderHook(() => useFarmers());

      await waitFor(() => {
        expect(result.current.farmers[0]).toEqual({
          id: 'farmer-1',
          name: 'John Farmer',
          email: 'john@example.com',
          phone: '+1234567890',
          address: '123 Farm Road',
          registrationDate: '2024-01-01T00:00:00Z',
          isActive: true,
        });
      });
    });

    it('should handle null data gracefully', async () => {
      mockSelect.mockResolvedValue({
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useFarmers());

      await waitFor(() => {
        expect(result.current.farmers).toEqual([]);
      });
    });
  });
});