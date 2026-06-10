import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import {
  ArrowLeft, User, Phone, MapPin, Clock, Package,
  FileText, Truck, Play, XCircle, Edit, Trash2, Calendar
} from 'lucide-react';
import CountdownTimer from '../components/CountdownTimer';
import { getOrderById, updateOrder, deleteOrder, archiveOrder } from '../utils/storage';
import { getStatusLabel, getStatusColor, formatDate } from '../utils/helpers';
import '../styles/order-detail.css';

const OrderDetail = ({ onRefresh }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    const o = getOrderById(id);
    if (o) {
      setOrder(o);
      setEditData(o);
    } else {
      navigate('/');
      toast.error('Buyurtma topilmadi');
    }
  }, [id, navigate]);

  if (!order) return null;

  const handleStatusChange = (status) => {
    if (status === 'delivered') {
      archiveOrder(order.id);
      setOrder({ ...order, status: 'delivered' });
      toast.success('✅ Buyurtma yetkazildi va arxivga joylandi!');
      if (onRefresh) onRefresh();
      navigate('/');
    } else {
      updateOrder(order.id, { status });
      setOrder({ ...order, status });
      if (onRefresh) onRefresh();
      toast.success(`Holat o'zgartirildi: ${getStatusLabel(status)}`);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Buyurtmani o\'chirishni xohlaysizmi?')) {
      deleteOrder(order.id);
      if (onRefresh) onRefresh();
      navigate('/');
      toast.success('Buyurtma o\'chirildi');
    }
  };

  const handleSaveEdit = () => {
    updateOrder(order.id, editData);
    setOrder({ ...order, ...editData });
    setIsEditing(false);
    if (onRefresh) onRefresh();
    toast.success('Buyurtma yangilandi');
  };

  return (
    <div className="order-detail">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>Orqaga</span>
        </button>
        <div className="detail-header-actions">
          <button className="detail-action-btn edit-btn" onClick={() => setIsEditing(!isEditing)}>
            <Edit size={16} />
            <span>{isEditing ? 'Bekor qilish' : 'Tahrirlash'}</span>
          </button>
          <button className="detail-action-btn delete-btn" onClick={handleDelete}>
            <Trash2 size={16} />
            <span>O'chirish</span>
          </button>
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-main glass">
          <div className="detail-title-row">
            <h1 className="detail-title">{order.title || 'Buyurtma'}</h1>
            <span
              className="status-badge status-badge-lg"
              style={{ '--status-color': getStatusColor(order.status) }}
            >
              {getStatusLabel(order.status)}
            </span>
          </div>

          <div className="detail-countdown-section">
            <CountdownTimer
              deliveryDate={order.deliveryDate}
              deliveryTime={order.deliveryTime}
              status={order.status}
            />
          </div>

          <div className="detail-info-grid">
            <div className="detail-info-card glass">
              <User size={20} className="detail-info-icon" />
              <div>
                <span className="detail-info-label">Mijoz</span>
                {isEditing ? (
                  <input
                    className="detail-edit-input"
                    value={editData.customerName}
                    onChange={(e) => setEditData({...editData, customerName: e.target.value})}
                  />
                ) : (
                  <span className="detail-info-value">{order.customerName}</span>
                )}
              </div>
            </div>

            <div className="detail-info-card glass">
              <Phone size={20} className="detail-info-icon" />
              <div>
                <span className="detail-info-label">Telefon</span>
                {isEditing ? (
                  <input
                    className="detail-edit-input"
                    value={editData.phone}
                    onChange={(e) => setEditData({...editData, phone: e.target.value})}
                  />
                ) : (
                  <a href={`tel:${order.phone}`} className="detail-info-value detail-phone-link">
                    {order.phone}
                  </a>
                )}
              </div>
            </div>

            <div className="detail-info-card glass">
              <MapPin size={20} className="detail-info-icon" />
              <div>
                <span className="detail-info-label">Manzil</span>
                {isEditing ? (
                  <input
                    className="detail-edit-input"
                    value={editData.address}
                    onChange={(e) => setEditData({...editData, address: e.target.value})}
                  />
                ) : (
                  <span className="detail-info-value">{order.address}</span>
                )}
              </div>
            </div>

            <div className="detail-info-card glass">
              <Calendar size={20} className="detail-info-icon" />
              <div>
                <span className="detail-info-label">Yetkazish vaqti</span>
                {isEditing ? (
                  <div className="detail-edit-row">
                    <input
                      type="date"
                      className="detail-edit-input"
                      value={editData.deliveryDate}
                      onChange={(e) => setEditData({...editData, deliveryDate: e.target.value})}
                    />
                    <input
                      type="time"
                      className="detail-edit-input"
                      value={editData.deliveryTime}
                      onChange={(e) => setEditData({...editData, deliveryTime: e.target.value})}
                    />
                  </div>
                ) : (
                  <span className="detail-info-value">{order.deliveryDate} — {order.deliveryTime}</span>
                )}
              </div>
            </div>

            <div className="detail-info-card glass detail-info-wide">
              <Package size={20} className="detail-info-icon" />
              <div>
                <span className="detail-info-label">Mahsulotlar</span>
                <div className="detail-products">
                  {order.products.map((p, i) => (
                    <span key={i} className="detail-product-tag">
                      {p.quantity} ta {p.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {order.notes && (
              <div className="detail-info-card glass detail-info-wide">
                <FileText size={20} className="detail-info-icon" />
                <div>
                  <span className="detail-info-label">Izoh</span>
                  <span className="detail-info-value">{order.notes}</span>
                </div>
              </div>
            )}
          </div>

          {isEditing && (
            <button className="save-edit-btn" onClick={handleSaveEdit}>
              Saqlash
            </button>
          )}

          {/* Status Actions */}
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div className="detail-status-actions">
              <h3 className="status-actions-title">Holatni o'zgartirish</h3>
              <div className="status-buttons">
                {order.status === 'pending' && (
                  <button className="status-action-btn status-btn-progress" onClick={() => handleStatusChange('in-progress')}>
                    <Play size={16} />
                    Jarayonga olish
                  </button>
                )}
                <button className="status-action-btn status-btn-deliver" onClick={() => handleStatusChange('delivered')}>
                  <Truck size={16} />
                  Yetkazildi
                </button>
                <button className="status-action-btn status-btn-cancel" onClick={() => handleStatusChange('cancelled')}>
                  <XCircle size={16} />
                  Bekor qilish
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Map section */}
        {order.location && (
          <div className="detail-map glass">
            <h3 className="detail-map-title">
              <MapPin size={18} />
              Yetkazish joyi
            </h3>
            <div className="detail-map-container">
              <MapContainer
                center={[order.location.lat, order.location.lng]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[order.location.lat, order.location.lng]} />
              </MapContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;
