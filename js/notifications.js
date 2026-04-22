/**
 * notifications.js — Web Push & scheduled local notifications
 */

import { getCycleDay, getPhase, getNotifMessage } from './cycle.js';

let swRegistration = null;

/**
 * Register service worker and return registration
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    swRegistration = await navigator.serviceWorker.register('/service-worker.js');
    return swRegistration;
  } catch (err) {
    console.warn('SW registration failed:', err);
    return null;
  }
}

/**
 * Request notification permission
 * @returns {Promise<boolean>} true if granted
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

/**
 * Schedule the next daily notification at a given hour:minute
 * Uses setTimeout via the SW message channel
 * @param {string} timeStr - "HH:MM" format
 * @param {string} cycleStartDate - ISO date string
 * @param {number} cycleLength
 */
export function scheduleNextNotification(timeStr, cycleStartDate, cycleLength = 29) {
  if (!swRegistration) return;
  if (Notification.permission !== 'granted') return;

  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);

  // If the time has already passed today, schedule for tomorrow
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  const delayMs = next.getTime() - now.getTime();

  // Get tomorrow's cycle day for the notification
  const targetDate = new Date(next);
  const cycleDay = getCycleDay(cycleStartDate, targetDate);
  const phase = getPhase(cycleDay, cycleLength);
  const { title, body } = getNotifMessage(phase);

  // Post to service worker
  if (swRegistration.active) {
    swRegistration.active.postMessage({
      type: 'SCHEDULE_NOTIFICATION',
      title: `${title} — Day ${cycleDay}`,
      body,
      delayMs
    });
  }
}

/**
 * Listen for RESCHEDULE messages from SW (after notification fires)
 */
export function listenForReschedule(cycleStartDate, cycleLength, notifTime) {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'RESCHEDULE') {
      scheduleNextNotification(notifTime, cycleStartDate, cycleLength);
    }
  });
}

/**
 * Fire an immediate test notification
 */
export function sendTestNotification(cycleDay, phase) {
  if (Notification.permission !== 'granted') return;
  const { title, body } = getNotifMessage(phase);
  if (swRegistration) {
    swRegistration.showNotification(`${title} — Day ${cycleDay}`, {
      body,
      icon: '/icons/icon-192.png',
      tag: 'lunasync-test'
    });
  } else {
    new Notification(`${title} — Day ${cycleDay}`, { body });
  }
}
