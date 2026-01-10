
// Defines the authoritative list of User Roles
export const USER_ROLES = {
    OWNER: 'Owner',
    STORE_MANAGER: 'Store Manager',
    PHARMACIST: 'Pharmacist',
    COUNTER_SALESMAN: 'Counter Salesman',
    ACCOUNTANT: 'Accountant',
    HELPER: 'Helper / Peon',

    // Legacy / System Roles
    ADMIN: 'Admin',
    SUPER_ADMIN: 'Super Admin'
};

// Helper: Group roles by common access levels if needed
export const ROLES = {
    ADMINS: [USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    MANAGERS: [USER_ROLES.STORE_MANAGER, USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    SALES: [USER_ROLES.COUNTER_SALESMAN, USER_ROLES.PHARMACIST, USER_ROLES.STORE_MANAGER, USER_ROLES.OWNER, USER_ROLES.ADMIN],
};
