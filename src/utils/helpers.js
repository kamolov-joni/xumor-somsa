export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  });
};

export const formatDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return '';
  return `${formatDate(dateStr)}, ${timeStr}`;
};

export const isToday = (dateStr) => {
  const today = new Date();
  const date = new Date(dateStr);
  return date.toDateString() === today.toDateString();
};

export const isOverdue = (deliveryDate, deliveryTime) => {
  const delivery = new Date(`${deliveryDate}T${deliveryTime}:00`);
  return new Date() > delivery;
};

export const getStatusColor = (status) => {
  switch(status) {
    case 'pending': return '#f59e0b';
    case 'in-progress': return '#3b82f6';
    case 'delivered': return '#10b981';
    case 'cancelled': return '#ef4444';
    default: return '#94a3b8';
  }
};

export const getStatusLabel = (status) => {
  switch(status) {
    case 'pending': return 'Kutilmoqda';
    case 'in-progress': return 'Jarayonda';
    case 'delivered': return 'Yetkazildi';
    case 'cancelled': return 'Bekor qilindi';
    default: return status;
  }
};

export const getUrgencyClass = (deliveryDate, deliveryTime) => {
  const delivery = new Date(`${deliveryDate}T${deliveryTime}:00`);
  const diff = delivery.getTime() - new Date().getTime();
  const minutes = diff / (1000 * 60);
  
  if (minutes < 0) return 'overdue';
  if (minutes <= 10) return 'critical';
  if (minutes <= 30) return 'warning';
  return 'normal';
};
