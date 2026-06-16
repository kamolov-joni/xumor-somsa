import { getOrders, updateOrder } from './storage';
import { playUpcomingSound, playWarningSound, playCriticalSound, playOverdueSound } from './sounds';

export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

export const sendBrowserNotification = (title, body, tag) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '🍕',
        tag: tag || 'order-reminder',
        requireInteraction: true,
      });
    } catch (e) {
      console.warn('Notification failed:', e);
    }
  }
};

export const getTimeRemaining = (deliveryDate, deliveryTime) => {
  // "4:00" → "04:00" bo'lmasa ISO 8601 yaroqsiz → Invalid Date → NaN
  const paddedTime = deliveryTime ? deliveryTime.padStart(5, '0') : '00:00';
  const deliveryDateTime = new Date(`${deliveryDate}T${paddedTime}:00`);
  const now = new Date();
  const diff = deliveryDateTime.getTime() - now.getTime();
  return diff; // milliseconds
};

export const formatTimeRemaining = (ms) => {
  const isOverdue = ms < 0;
  const absDiff = Math.abs(ms);
  const hours = Math.floor(absDiff / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  return isOverdue ? `-${timeStr}` : timeStr;
};

export const checkAndNotify = (orders, setNotificationData) => {
  const now = new Date();
  
  orders.forEach(order => {
    if (order.status === 'delivered' || order.status === 'cancelled') return;
    
    const remaining = getTimeRemaining(order.deliveryDate, order.deliveryTime);
    const minutesRemaining = remaining / (1000 * 60);
    
    // Check if we should notify (every 10 minutes)
    const lastNotified = order.lastNotified ? new Date(order.lastNotified) : null;
    const timeSinceLastNotification = lastNotified ? (now.getTime() - lastNotified.getTime()) / (1000 * 60) : Infinity;
    
    if (timeSinceLastNotification < 9.5) return; // Not yet 10 minutes since last notification
    
    let shouldNotify = false;
    let soundType = 'upcoming';
    let urgency = 'normal';
    
    if (remaining < 0) {
      // Overdue
      shouldNotify = true;
      soundType = 'overdue';
      urgency = 'overdue';
    } else if (minutesRemaining <= 10) {
      // Critical - 10 min or less
      shouldNotify = true;
      soundType = 'critical';
      urgency = 'critical';
    } else if (minutesRemaining <= 30) {
      // Warning - 30 min or less
      shouldNotify = true;
      soundType = 'warning';
      urgency = 'warning';
    } else {
      // Standard reminder every 10 min
      shouldNotify = true;
      soundType = 'upcoming';
      urgency = 'normal';
    }
    
    if (shouldNotify) {
      // Play sound
      switch (soundType) {
        case 'overdue': playOverdueSound(); break;
        case 'critical': playCriticalSound(); break;
        case 'warning': playWarningSound(); break;
        default: playUpcomingSound(); break;
      }
      
      // Build notification message
      const productList = order.products.map(p => `${p.quantity} ta ${p.name}`).join(', ');
      const message = `Diqqat! ${order.customerName} uchun buyurtma mavjud. Soat ${order.deliveryTime} da ${order.address} manziliga ${productList} yetkazilishi kerak.`;
      
      // Browser notification
      sendBrowserNotification(
        remaining < 0 ? '⚠️ BUYURTMA KECHIKMOQDA!' : '🔔 Buyurtma eslatmasi',
        message,
        `order-${order.id}`
      );
      
      // Show popup
      if (setNotificationData) {
        setNotificationData({
          order,
          message,
          urgency,
          remaining,
        });
      }
      
      // Update lastNotified
      updateOrder(order.id, { lastNotified: now.toISOString() });
    }
  });
};
