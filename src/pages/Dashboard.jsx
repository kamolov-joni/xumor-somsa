import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, PlusCircle, Clock, CheckCircle, AlertTriangle, TrendingUp, Package } from 'lucide-react';
import OrderCard from '../components/OrderCard';
import { isToday, isOverdue } from '../utils/helpers';
import '../styles/dashboard.css';

const Dashboard = ({ orders, onRefresh }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      inProgress: orders.filter(o => o.status === 'in-progress').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      overdue: orders.filter(o => 
        (o.status === 'pending' || o.status === 'in-progress') && 
        isOverdue(o.deliveryDate, o.deliveryTime)
      ).length,
    };
  }, [orders]);

  const categorizedOrders = useMemo(() => {
    const now = new Date();
    const active = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
    
    return {
      overdue: active.filter(o => isOverdue(o.deliveryDate, o.deliveryTime))
        .sort((a, b) => new Date(`${a.deliveryDate}T${a.deliveryTime}`) - new Date(`${b.deliveryDate}T${b.deliveryTime}`)),
      today: active.filter(o => isToday(o.deliveryDate) && !isOverdue(o.deliveryDate, o.deliveryTime))
        .sort((a, b) => new Date(`${a.deliveryDate}T${a.deliveryTime}`) - new Date(`${b.deliveryDate}T${b.deliveryTime}`)),
      upcoming: active.filter(o => !isToday(o.deliveryDate) && !isOverdue(o.deliveryDate, o.deliveryTime))
        .sort((a, b) => new Date(`${a.deliveryDate}T${a.deliveryTime}`) - new Date(`${b.deliveryDate}T${b.deliveryTime}`)),
      completed: orders.filter(o => o.status === 'delivered')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10),
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let result = [];
    
    switch (activeFilter) {
      case 'overdue': result = categorizedOrders.overdue; break;
      case 'today': result = categorizedOrders.today; break;
      case 'upcoming': result = categorizedOrders.upcoming; break;
      case 'completed': result = categorizedOrders.completed; break;
      default: result = [...categorizedOrders.overdue, ...categorizedOrders.today, ...categorizedOrders.upcoming];
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o =>
        o.customerName.toLowerCase().includes(q) ||
        o.address.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        (o.title && o.title.toLowerCase().includes(q)) ||
        o.products.some(p => p.name.toLowerCase().includes(q))
      );
    }

    return result;
  }, [activeFilter, searchQuery, categorizedOrders]);

  const filterTabs = [
    { key: 'all', label: 'Barchasi', count: stats.total - stats.delivered },
    { key: 'overdue', label: 'Kechikkan', count: stats.overdue },
    { key: 'today', label: 'Bugungi', count: categorizedOrders.today.length },
    { key: 'upcoming', label: 'Kelgusi', count: categorizedOrders.upcoming.length },
    { key: 'completed', label: 'Bajarilgan', count: stats.delivered },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Boshqaruv paneli</h1>
          <p className="dashboard-subtitle">Buyurtmalarni kuzating va boshqaring</p>
        </div>
        <button className="new-order-btn" onClick={() => navigate('/new-order')}>
          <PlusCircle size={20} />
          <span>Yangi buyurtma</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card glass stat-card-total">
          <div className="stat-icon-wrapper stat-icon-total">
            <Package size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Jami buyurtmalar</span>
          </div>
        </div>
        <div className="stat-card glass stat-card-pending">
          <div className="stat-icon-wrapper stat-icon-pending">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.pending + stats.inProgress}</span>
            <span className="stat-label">Faol buyurtmalar</span>
          </div>
        </div>
        <div className="stat-card glass stat-card-delivered">
          <div className="stat-icon-wrapper stat-icon-delivered">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.delivered}</span>
            <span className="stat-label">Yetkazilgan</span>
          </div>
        </div>
        <div className="stat-card glass stat-card-overdue">
          <div className="stat-icon-wrapper stat-icon-overdue">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.overdue}</span>
            <span className="stat-label">Kechikkan</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="dashboard-controls">
        <div className="search-wrapper glass">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buyurtma, mijoz yoki manzil qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-tabs">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              className={`filter-tab ${activeFilter === tab.key ? 'filter-tab-active' : ''}`}
              onClick={() => setActiveFilter(tab.key)}
            >
              {tab.label}
              {tab.count > 0 && <span className="filter-count">{tab.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Orders */}
      <div className="orders-section">
        {filteredOrders.length === 0 ? (
          <div className="empty-state glass">
            <Package size={48} className="empty-icon" />
            <h3>Buyurtmalar topilmadi</h3>
            <p>Hozircha bu bo'limda buyurtmalar yo'q</p>
            <button className="new-order-btn" onClick={() => navigate('/new-order')}>
              <PlusCircle size={18} />
              Yangi buyurtma yaratish
            </button>
          </div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map(order => (
              <OrderCard key={order.id} order={order} onRefresh={onRefresh} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
