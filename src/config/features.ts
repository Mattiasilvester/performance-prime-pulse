export const FEATURES = {
  NEW_LANDING: {
    enabled: import.meta.env.VITE_NEW_LANDING === 'true',
    percentage: parseInt(import.meta.env.VITE_NEW_LANDING_PERCENTAGE || '0'),
    forcedUsers: import.meta.env.VITE_FORCED_USERS?.split(',') || []
  }
};




