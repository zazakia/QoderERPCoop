import { hasPermission, ROLE_PERMISSIONS } from '../supabase';
import type { UserRole } from '../supabase';

describe('Supabase Utilities', () => {
  describe('hasPermission', () => {
    it('should allow super_admin to access all permissions', () => {
      const superAdmin: UserRole = 'super_admin';
      
      expect(hasPermission(superAdmin, 'farmers:create')).toBe(true);
      expect(hasPermission(superAdmin, 'mills:update')).toBe(true);
      expect(hasPermission(superAdmin, 'reports:delete')).toBe(true);
      expect(hasPermission(superAdmin, 'any:permission')).toBe(true);
    });

    it('should restrict mill_owner permissions correctly', () => {
      const millOwner: UserRole = 'mill_owner';
      
      // Should have access to these
      expect(hasPermission(millOwner, 'mills:read')).toBe(true);
      expect(hasPermission(millOwner, 'mills:update')).toBe(true);
      expect(hasPermission(millOwner, 'farmers:create')).toBe(true);
      expect(hasPermission(millOwner, 'users:create')).toBe(true);
      
      // Should not have system-wide permissions
      expect(hasPermission(millOwner, 'system:admin')).toBe(false);
    });

    it('should restrict manager permissions correctly', () => {
      const manager: UserRole = 'manager';
      
      // Should have access to operational permissions
      expect(hasPermission(manager, 'farmers:create')).toBe(true);
      expect(hasPermission(manager, 'inventory:read')).toBe(true);
      expect(hasPermission(manager, 'procurement:create')).toBe(true);
      
      // Should not have mill management permissions
      expect(hasPermission(manager, 'mills:update')).toBe(false);
      expect(hasPermission(manager, 'users:create')).toBe(false);
    });

    it('should restrict operator permissions correctly', () => {
      const operator: UserRole = 'operator';

      // Should have basic operational permissions
      expect(hasPermission(operator, 'farmers:read')).toBe(true);
      expect(hasPermission(operator, 'procurement:create')).toBe(true);
      expect(hasPermission(operator, 'sales:create')).toBe(true);
      expect(hasPermission(operator, 'inventory:read')).toBe(true);

      // Should not have management permissions
      expect(hasPermission(operator, 'users:create')).toBe(false);
      expect(hasPermission(operator, 'mills:update')).toBe(false);
      expect(hasPermission(operator, 'reports:create')).toBe(false);
      expect(hasPermission(operator, 'farmers:create')).toBe(false);
    });

    it('should handle edge cases', () => {
      // Test with empty permission
      expect(hasPermission('operator', '')).toBe(false);
      
      // Test with undefined permission
      expect(hasPermission('operator', undefined as any)).toBe(false);
    });
  });

  describe('ROLE_PERMISSIONS constant', () => {
    it('should have all required roles defined', () => {
      expect(ROLE_PERMISSIONS).toHaveProperty('super_admin');
      expect(ROLE_PERMISSIONS).toHaveProperty('mill_owner');
      expect(ROLE_PERMISSIONS).toHaveProperty('manager');
      expect(ROLE_PERMISSIONS).toHaveProperty('operator');
    });

    it('should have super_admin with wildcard permission', () => {
      expect(ROLE_PERMISSIONS.super_admin).toContain('*');
    });

    it('should have hierarchical permission structure', () => {
      // Mill owner should have more permissions than manager
      expect(ROLE_PERMISSIONS.mill_owner.length).toBeGreaterThan(ROLE_PERMISSIONS.manager.length);
      
      // Manager should have more permissions than operator
      expect(ROLE_PERMISSIONS.manager.length).toBeGreaterThan(ROLE_PERMISSIONS.operator.length);
    });
  });
});