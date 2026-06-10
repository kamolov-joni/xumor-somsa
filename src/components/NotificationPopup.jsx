import { formatTimeRemaining } from '../utils/notifications';
import { getStatusLabel } from '../utils/helpers';
import { X, Truck, Clock, AlertTriangle, MapPin, Package, User } from 'lucide-react';
import '../styles/notification-popup.css';

const NotificationPopup = ({ data, onDismiss, onMarkDelivered }) => {
  if (!data) return null;

  const { order, message, urgency, remaining } = data;

  return (
    <div className="notification-overlay" onClick={onDismiss}>
      <div
        className={`notification-popup glass notification-${urgency}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="notification-close" onClick={onDismiss}>
          <X size={20} />
        </button>

        <div className="notification-header">
          <div className={`notification-icon-wrapper notification-icon-${urgency}`}>
            {urgency === 'overdue' ? <AlertTriangle size={32} /> : <Clock size={32} />}
          </div>
          <h2 className="notification-title">
            {urgency === 'overdue'
              ? '🚨 BUYURTMA KECHIKMOQDA!'
              : urgency === 'critical'
              ? '⚠️ JUDA MUHIM!'
              : urgency === 'warning'
              ? '⏰ Ogohlantirish!'
              : '🔔 Buyurtma eslatmasi'}
          </h2>
        </div>

        <div className="notification-countdown">
          <span className={`notification-time notification-time-${urgency}`}>
            {formatTimeRemaining(remaining)}
          </span>
          <span className="notification-time-label">
            {remaining < 0 ? 'Kechikkan vaqt' : 'Qolgan vaqt'}
          </span>
        </div>

        <div className="notification-details">
          <div className="notification-detail-item">
            <User size={18} />
            <div>
              <span className="detail-label">Mijoz</span>
              <span className="detail-value">{order.customerName}</span>
            </div>
          </div>
          <div className="notification-detail-item">
            <Package size={18} />
            <div>
              <span className="detail-label">Mahsulot</span>
              <span className="detail-value">
                {order.products.map(p => `${p.quantity} ta ${p.name}`).join(', ')}
              </span>
            </div>
          </div>
          <div className="notification-detail-item">
            <MapPin size={18} />
            <div>
              <span className="detail-label">Manzil</span>
              <span className="detail-value">{order.address}</span>
            </div>
          </div>
          <div className="notification-detail-item">
            <Clock size={18} />
            <div>
              <span className="detail-label">Yetkazish vaqti</span>
              <span className="detail-value">{order.deliveryDate} — {order.deliveryTime}</span>
            </div>
          </div>
        </div>

        <p className="notification-message">{message}</p>

        <div className="notification-actions">
          <button
            className="notification-btn notification-btn-deliver"
            onClick={() => onMarkDelivered(order.id)}
          >
            <Truck size={18} />
            Yetkazildi deb belgilash
          </button>
          <button
            className="notification-btn notification-btn-dismiss"
            onClick={onDismiss}
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPopup;
