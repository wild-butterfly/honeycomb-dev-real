import { useAuth } from "../context/AuthContext";

export interface Permissions {
  isAdmin: boolean;
  isStaff: boolean;
  canViewJobs: boolean;
  canCreateJob: boolean;
  canEditJob: boolean;
  canAddTime: boolean;
  canAccessSettings: boolean;
  canManageEmployees: boolean;
}

/**
 * Returns permission flags based on the current user's role.
 * Admin: full access.
 * Staff (or legacy 'employee'): view assigned jobs + add time only.
 */
export const usePermissions = (): Permissions => {
  const { user } = useAuth();
  const role = user?.role ?? "staff";

  const isAdmin = role === "admin" || role === "superadmin";
  const isStaff = !isAdmin;

  return {
    isAdmin,
    isStaff,
    canViewJobs: true,
    canCreateJob: isAdmin,
    canEditJob: isAdmin,
    canAddTime: true,
    canAccessSettings: isAdmin,
    canManageEmployees: isAdmin,
  };
};
