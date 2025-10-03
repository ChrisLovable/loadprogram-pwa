// User PIN data for admin users who can access all roles
export const ADMIN_USERS = {
  '1111': { name: 'Sebastiaan Steyn', role: 'admin' },
  '2222': { name: 'Adelaide', role: 'admin' },
  '3333': { name: 'Chris de Vries', role: 'admin' },
  '4444': { name: 'Andries Steyn', role: 'admin' }
};

export const validateAdminPIN = (pin: string): { name: string; role: string } | null => {
  return ADMIN_USERS[pin as keyof typeof ADMIN_USERS] || null;
};
