import { useNavigate } from 'react-router-dom';
import { User, Phone, MapPin, Clock, Package, ChevronRight, Truck, XCircle, Play, CreditCard } from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import { getStatusLabel, getStatusColor, getUrgencyClass } from '../utils/helpers';
import { updateOrder, archiveOrder } from '../utils/storage';
import '../styles/order-card.css';

const OrderCard = ({ order, onRefresh }) => {
  const navigate = useNavigate();
  const urgency = order.status === 'delivered' || order.status === 'cancelled' 
    ? 'done' 
    : getUrgencyClass(order.deliveryDate, order.deliveryTime);

  const handleStatusChange = (newStatus, e) => {
    e.stopPropagation();
    if (newStatus === 'delivered') {
      archiveOrder(order.id);
    } else {
      updateOrder(order.id, { status: newStatus });
    }
    if (onRefresh) onRefresh();
  };

  return (
    <div
      className={`order-card glass order-card-${urgency}`}
      onClick={() => navigate(`/orders/${order.id}`)}
    >
      <div className="order-card-header">
        <div className="order-card-title-row">
          <h3 className="order-card-title">{order.title || 'Buyurtma'}</h3>
          <div className="order-card-badges">
            <span
              className="status-badge"
              style={{ '--status-color': getStatusColor(order.status) }}
            >
              {getStatusLabel(order.status)}
            </span>
            <span
              className="payment-badge"
              title={order.paymentStatus === 'paid' ? 'To\'langan' : 'To\'lanmagani'}
            >
              {order.paymentStatus === 'paid' ? '✅ To\'langan' : '❌ To\'lanmagani'}
            </span>
            {order.source === 'telegram' && (
              <span className="source-badge" title="Telegram botdan">
                🤖 Telegram
              </span>
            )}
          </div>
        </div>
        <CountdownTimer
          deliveryDate={order.deliveryDate}
          deliveryTime={order.deliveryTime}
          status={order.status}
        />
      </div>

      <div className="order-card-body">
        <div className="order-info-grid">
          <div className="order-info-item">
            <User size={16} className="info-icon" />
            <span>{order.customerName}</span>
          </div>
          <div className="order-info-item">
            <Phone size={16} className="info-icon" />
            <span>{order.phone}</span>
          </div>
          <div className="order-info-item">
            <MapPin size={16} className="info-icon" />
            <span>{order.address}</span>
          </div>
          <div className="order-info-item">
            <Clock size={16} className="info-icon" />
            <span>{order.deliveryDate} {order.deliveryTime}</span>
          </div>
          <div className="order-info-item order-info-products">
            <Package size={16} className="info-icon" />
            <span>
              {order.products.map(p => `${p.quantity} ta ${p.name}`).join(', ')}
            </span>
          </div>
        </div>
      </div>

      <div className="order-card-actions">
        {order.status === 'pending' && (
          <button
            className="action-btn action-btn-progress"
            onClick={(e) => handleStatusChange('in-progress', e)}
            title="Jarayonga olish"
          >
            <Play size={14} />
            <span>Boshlash</span>
          </button>
        )}
        {(order.status === 'pending' || order.status === 'in-progress') && (
          <>
            <button
              className="action-btn action-btn-deliver"
              onClick={(e) => handleStatusChange('delivered', e)}
              title="Yetkazildi"
            >
              <Truck size={14} />
              <span>Yetkazildi</span>
            </button>
            <button
              className="action-btn action-btn-cancel"
              onClick={(e) => handleStatusChange('cancelled', e)}
              title="Bekor qilish"
            >
              <XCircle size={14} />
              <span>Bekor</span>
            </button>
          </>
        )}
        <button className="action-btn action-btn-view" onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}`); }}>
          <ChevronRight size={14} />
          <span>Batafsil</span>
        </button>
      </div>
    </div>
  );
};

export default OrderCard;
