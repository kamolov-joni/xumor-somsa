const STORAGE_KEY = 'oms_orders';
const ARCHIVE_KEY = 'oms_archive';
const SYNC_QUEUE_KEY = 'oms_sync_queue';
// Deploy uchun: Netlify'da VITE_API_URL muhit o'zgaruvchisini hostlangan backend manziliga qo'ying.
// Masalan: VITE_API_URL=https://sizning-backend.onrender.com/api
const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

// --- Local Helpers ---
const getLocalOrders = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

const saveLocalOrders = (orders) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
};

const getLocalArchive = () => {
  try {
    const data = localStorage.getItem(ARCHIVE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

const saveLocalArchive = (orders) => {
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(orders));
};

const getSyncQueue = () => {
  try {
    const data = localStorage.getItem(SYNC_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

const saveSyncQueue = (queue) => {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
};

const addToSyncQueue = (action, data) => {
  const queue = getSyncQueue();
  // Filter out redundant actions for the same order if possible
  const filtered = queue.filter(item => !(item.data.id === data.id && item.action === action));
  filtered.push({ action, data, timestamp: Date.now() });
  saveSyncQueue(filtered);
};

// --- Sync Management ---
export const syncWithServer = async () => {
  if (!navigator.onLine) return { success: false, reason: 'offline' };

  try {
    // 1. Process sync queue (local changes -> server)
    const queue = getSyncQueue();
    if (queue.length > 0) {
      console.log(`Processing sync queue: ${queue.length} items pending`);
      const remainingQueue = [];

      for (const item of queue) {
        try {
          if (item.action === 'save') {
            await fetch(`${SERVER_URL}/orders`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data)
            });
          } else if (item.action === 'delete') {
            await fetch(`${SERVER_URL}/orders/${item.data.id}`, { method: 'DELETE' });
          } else if (item.action === 'archive') {
            await fetch(`${SERVER_URL}/orders/archive/${item.data.id}`, { method: 'POST' });
          } else if (item.action === 'restore') {
            await fetch(`${SERVER_URL}/archive/restore/${item.data.id}`, { method: 'POST' });
          }
        } catch (err) {
          console.warn('Failed to sync queue item:', item, err);
          remainingQueue.push(item);
        }
      }
      saveSyncQueue(remainingQueue);
    }

    // 2. Fetch fresh active orders from server -> update local storage
    const response = await fetch(`${SERVER_URL}/orders`);
    if (response.ok) {
      const serverOrders = await response.json();
      saveLocalOrders(serverOrders);
    }

    // 3. Fetch fresh archived orders -> update local archive cache
    const archiveResponse = await fetch(`${SERVER_URL}/archive`);
    if (archiveResponse.ok) {
      const serverArchive = await archiveResponse.json();
      saveLocalArchive(serverArchive);
    }

    return { success: true };
  } catch (error) {
    console.error('Synchronization failed:', error);
    return { success: false, error: error.message };
  }
};

// --- Core API Operations ---

export const getOrders = () => {
  // Returns local cache immediately. App triggers bg sync.
  return getLocalOrders();
};

export const getArchivedOrders = () => {
  return getLocalArchive();
};

export const addOrder = (order) => {
  const newOrder = {
    ...order,
    id: order.id || generateId(),
    status: order.status || 'pending',
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastNotified: null,
  };

  // Update local cache
  const orders = getLocalOrders();
  orders.push(newOrder);
  saveLocalOrders(orders);

  // Sync / queue
  if (navigator.onLine) {
    fetch(`${SERVER_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    }).catch(() => addToSyncQueue('save', newOrder));
  } else {
    addToSyncQueue('save', newOrder);
  }

  return newOrder;
};

export const updateOrder = (id, updates) => {
  const orders = getLocalOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return null;

  const updatedOrder = {
    ...orders[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  orders[index] = updatedOrder;
  saveLocalOrders(orders);

  if (navigator.onLine) {
    fetch(`${SERVER_URL}/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(() => addToSyncQueue('save', updatedOrder));
  } else {
    addToSyncQueue('save', updatedOrder);
  }

  return updatedOrder;
};

export const deleteOrder = (id) => {
  const orders = getLocalOrders().filter(o => o.id !== id);
  saveLocalOrders(orders);

  // Also remove from archive if deleted from there
  const archive = getLocalArchive().filter(o => o.id !== id);
  saveLocalArchive(archive);

  if (navigator.onLine) {
    fetch(`${SERVER_URL}/orders/${id}`, { method: 'DELETE' })
      .catch(() => addToSyncQueue('delete', { id }));
  } else {
    addToSyncQueue('delete', { id });
  }
};

export const getOrderById = (id) => {
  const activeOrder = getLocalOrders().find(o => o.id === id);
  if (activeOrder) return activeOrder;
  return getLocalArchive().find(o => o.id === id) || null;
};

// Archive an order
export const archiveOrder = (id) => {
  const orders = getLocalOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return false;

  const order = orders[index];
  order.status = 'delivered';
  order.archivedAt = new Date().toISOString();

  // Move locally
  const newActiveOrders = orders.filter(o => o.id !== id);
  saveLocalOrders(newActiveOrders);

  const archive = getLocalArchive();
  archive.unshift(order);
  saveLocalArchive(archive);

  if (navigator.onLine) {
    fetch(`${SERVER_URL}/orders/archive/${id}`, { method: 'POST' })
      .catch(() => addToSyncQueue('archive', { id }));
  } else {
    addToSyncQueue('archive', { id });
  }

  return true;
};

// Restore an order
export const restoreOrder = (id) => {
  const archive = getLocalArchive();
  const index = archive.findIndex(o => o.id === id);
  if (index === -1) return false;

  const order = archive[index];
  order.status = 'pending';
  order.lastNotified = null;
  order.updatedAt = new Date().toISOString();

  // Move locally
  const newArchive = archive.filter(o => o.id !== id);
  saveLocalArchive(newArchive);

  const activeOrders = getLocalOrders();
  activeOrders.push(order);
  saveLocalOrders(activeOrders);

  if (navigator.onLine) {
    fetch(`${SERVER_URL}/archive/restore/${id}`, { method: 'POST' })
      .catch(() => addToSyncQueue('restore', { id }));
  } else {
    addToSyncQueue('restore', { id });
  }

  return true;
};
