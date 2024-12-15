import { checkOverdueProtocols } from './notificationService';

// Check every hour for overdue protocols
export function startCronJobs() {
  // Initial check
  checkOverdueProtocols();

  // Set up hourly checks
  setInterval(() => {
    checkOverdueProtocols();
  }, 60 * 60 * 1000); // 1 hour in milliseconds
} 