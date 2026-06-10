import { useState, useMemo } from 'react';
import { Search, Filter } from 'lucide-react';
import OrderCard from '../components/OrderCard';
import '../styles/dashboard.css';

const OrdersPage = ({ orders, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('delivery');

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(o => o.status === statusFilter);
    }

    // Search
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

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'delivery') {
        return new Date(`${a.deliveryDate}T${a.deliveryTime}`) - new Date(`${b.deliveryDate}T${b.deliveryTime}`);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return result;
  }, [orders, statusFilter, searchQuery, sortBy]);

  const statusOptions = [
    { value: 'all', label: 'Barchasi' },
    { value: 'pending', label: 'Kutilmoqda' },
    { value: 'in-progress', label: 'Jarayonda' },
    { value: 'delivered', label: 'Yetkazildi' },
    { value: 'cancelled', label: 'Bekor qilingan' },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Barcha buyurtmalar</h1>
          <p className="dashboard-subtitle">{orders.length} ta buyurtma mavjud</p>
        </div>
      </div>

      <div className="dashboard-controls">
        <div className="search-wrapper glass">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-tabs">
          {statusOptions.map(opt => (
            <button
              key={opt.value}
              className={`filter-tab ${statusFilter === opt.value ? 'filter-tab-active' : ''}`}
              onClick={() => setStatusFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="sort-controls">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select glass"
          >
            <option value="delivery">Yetkazish vaqti bo'yicha</option>
            <option value="created">Yaratilgan vaqt bo'yicha</option>
          </select>
        </div>
      </div>

      <div className="orders-section">
        {filteredOrders.length === 0 ? (
          <div className="empty-state glass">
            <Filter size={48} className="empty-icon" />
            <h3>Buyurtmalar topilmadi</h3>
            <p>Filtrlarni o'zgartirib ko'ring</p>
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

export default OrdersPage;
