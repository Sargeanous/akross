import { createEncounterValidationWorker } from './encounter-validation.js';
import { createSessionCleanupWorker, scheduleSessionCleanup } from './session-cleanup.js';
import { createNotificationWorker } from './notification.js';

/**
 * Register all BullMQ workers and schedulers.
 * Called once during server bootstrap.
 */
export function registerWorkers() {
  createEncounterValidationWorker();
  createSessionCleanupWorker();
  createNotificationWorker();

  // Schedule recurring jobs
  scheduleSessionCleanup().catch((err) => {
    console.error('Failed to schedule session cleanup:', err);
  });

  console.log('[JOBS] All workers registered');
}
