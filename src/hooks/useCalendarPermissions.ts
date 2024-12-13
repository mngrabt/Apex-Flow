import { useAuthStore } from '../store/auth';

export function useCalendarPermissions() {
  const user = useAuthStore(state => state.user);
  
  // Check if user is Abdurauf
  const canManageEvents = user?.id === '00000000-0000-0000-0000-000000000001';

  return {
    canManageEvents
  };
} 