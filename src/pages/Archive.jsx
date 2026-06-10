import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Search, FolderOpen, ArrowLeft, RotateCcw, Trash2, Calendar, MapPin, Eye } from 'lucide-react';
import { getArchivedOrders, restoreOrder, deleteOrder, syncWithServer } from '../utils/storage';
import { formatDate } from '../utils/helpers';
import '../styles/archive.css';

const Archive = ({ onRefresh }) => {
  const navigate = useNavigate();
  const [archivedOrders, setArchivedOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchArchive = () => {
    setArchivedOrders(getArchivedOrders());
  };

  useEffect(() => {
    fetchArchive();
  }, []);

  const handleRestore = (id, customerName) => {
    const success = restoreOrder(id);
    if (success) {
      toast.success(`✅ ${customerName} uchun buyurtma tiklandi va faol holatga qaytarildi!`);
      fetchArchive();
      if (onRefresh) onRefresh();
      
      // Auto background sync
      if (navigator.onLine) {
        syncWithServer().then(onRefresh);
      }
    }
  };

  const handleDelete = (id, customerName) => {
    if (window.confirm(`${customerName} uchun buyurtmani arxivdan butunlay o'chirib tashlaysizmi? Bu amalni ortga qaytarib bo'lmaydi.`)) {
      deleteOrder(id);
      toast.success('❌ Buyurtma butunlay o\'chirib yuborildi.');
      fetchArchive();
      if (onRefresh) onRefresh();
      
      if (navigator.onLine) {
        syncWithServer().then(onRefresh);
      }
    }
  };

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return archivedOrders;
    const q = searchQuery.toLowerCase();
    return archivedOrders.filter(o =>
      o.customerName.toLowerCase().includes(q) ||
      o.address.toLowerCase().includes(q) ||
      o.phone.includes(q) ||
      (o.title && o.title.toLowerCase().includes(q)) ||
      o.products.some(p => p.name.toLowerCase().includes(q))
    );
  }, [archivedOrders, searchQuery]);

  return (
    <div className="archive-page">
      <div className="archive-header">
        <div>
          <button className="back-btn" onClick={() => navigate('/')} style={{ marginBottom: '16px' }}>
            <ArrowLeft size={18} />
            <span>Asosiy oyna</span>
          </button>
          <h1 className="archive-title">Buyurtmalar arxivi</h1>
          <p className="archive-subtitle">Barcha bajarilgan yoki bekor qilingan buyurtmalar ro'yxati</p>
        </div>
      </div>

      <div className="archive-controls">
        <div className="search-wrapper glass" style={{ width: '350px' }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Arxivdan qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="empty-state glass">
          <FolderOpen size={48} className="empty-icon" />
          <h3>Arxiv bo'sh</h3>
          <p>Hozircha arxivlangan buyurtmalar mavjud emas.</p>
        </div>
      ) : (
        <div className="archive-table-container glass">
          <table className="archive-table">
            <thead>
              <tr>
                <th>Buyurtma / Mijoz</th>
                <th>Mahsulotlar</th>
                <th>Manzil</th>
                <th>Vaqti</th>
                <th>Sana</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td>
                    <div className="archive-customer-info">
                      <span className="archive-customer-name">{order.customerName}</span>
                      <span className="archive-customer-phone">{order.phone}</span>
                    </div>
                  </td>
                  <td>
                    <span className="archive-products">
                      {order.products.map(p => `${p.quantity} ta ${p.name}`).join(', ')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                      <MapPin size={14} style={{ color: 'var(--accent)' }} />
                      <span>{order.address}</span>
                    </div>
                  </td>
                  <td>{order.deliveryTime}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                      <Calendar size={14} style={{ color: 'var(--secondary)' }} />
                      <span>{formatDate(order.deliveryDate)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="archive-actions">
                      <button
                        className="archive-btn"
                        onClick={() => navigate(`/orders/${order.id}`)}
                        title="Batafsil ko'rish"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="archive-btn archive-btn-restore"
                        onClick={() => handleRestore(order.id, order.customerName)}
                        title="Faol ro'yxatga qaytarish"
                      >
                        <RotateCcw size={14} />
                        <span>Tiklash</span>
                      </button>
                      <button
                        className="archive-btn archive-btn-delete"
                        onClick={() => handleDelete(order.id, order.customerName)}
                        title="Butunlay o'chirish"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Archive;
