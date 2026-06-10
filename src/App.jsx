import { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'leaflet/dist/leaflet.css';
import './index.css';

import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import NewOrder from './pages/NewOrder';
import OrdersPage from './pages/OrdersPage';
import OrderDetail from './pages/OrderDetail';
import Archive from './pages/Archive';
import NotificationPopup from './components/NotificationPopup';

import { getOrders, updateOrder, syncWithServer } from './utils/storage';
import { requestNotificationPermission, checkAndNotify } from './utils/notifications';
import { Wifi, WifiOff, Database } from 'lucide-react';

function App() {
  const [orders, setOrders] = useState([]);
  const [notificationData, setNotificationData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const intervalRef = useRef(null);

  const refreshOrders = useCallback(() => {
    setOrders(getOrders());
  }, []);

  // Sync function
  const handleSync = useCallback(async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    const result = await syncWithServer();
    setIsSyncing(false);
    
    if (result.success) {
      refreshOrders();
    }
  }, [refreshOrders]);

  // Request notification permission & handle connectivity events
  useEffect(() => {
    requestNotificationPermission();
    refreshOrders();

    const handleOnline = () => {
      setIsOnline(true);
      toast.success('🌐 Aloqa tiklandi! Ma\'lumotlar sinxronizatsiya qilinmoqda...', {
        position: 'top-right',
      });
      handleSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('⚠️ Aloqa uzildi! Tizim oflayn rejimda ishlamoqda. Ma\'lumotlar brauzerda saqlanadi.', {
        position: 'top-right',
        autoClose: false,
      });
    };

    // Enable audio reminders on first user interaction
    const handleInteraction = () => {
      setHasInteracted(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync
    handleSync();
    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [refreshOrders, handleSync]);

  // Auto-sync with server every 5 seconds so new orders (e.g. from the
  // Telegram bot) appear automatically without a manual page refresh.
  useEffect(() => {
    const pollId = setInterval(() => {
      if (navigator.onLine) {
        handleSync();
      }
    }, 5000);

    return () => clearInterval(pollId);
  }, [handleSync]);

  // Reminder check interval — every 30 seconds (needs user interaction for audio)
  useEffect(() => {
    if (!hasInteracted) return;

    const checkReminders = () => {
      const currentOrders = getOrders();
      setOrders(currentOrders);
      checkAndNotify(currentOrders, (data) => {
        setNotificationData(data);
        toast(data.message, {
          type: data.urgency === 'overdue' ? 'error' : data.urgency === 'critical' ? 'warning' : 'info',
          autoClose: data.urgency === 'overdue' ? false : 10000,
          position: 'top-right',
        });
      });
    };

    // Check immediately
    checkReminders();

    // Background operations (Reminder + Sync check)
    intervalRef.current = setInterval(() => {
      checkReminders();
      if (navigator.onLine) {
        handleSync();
      }
    }, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasInteracted, handleSync]);

  const handleDismissNotification = () => {
    setNotificationData(null);
  };

  const handleMarkDelivered = (orderId) => {
    updateOrder(orderId, { status: 'delivered' });
    refreshOrders();
    setNotificationData(null);
    toast.success('✅ Buyurtma yetkazildi deb belgilandi!');
    handleSync();
  };

  // Back up database manually
  const triggerManualBackup = async () => {
    if (!isOnline) {
      toast.error('Zaxira nusxa yaratish uchun internet aloqasi zarur');
      return;
    }
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const res = await fetch(`${apiUrl}/backup`, { method: 'POST' });
      if (res.ok) {
        toast.success('💾 Ma\'lumotlar bazasi zaxira nusxasi muvaffaqiyatli yaratildi!');
      } else {
        throw new Error('Backup failed');
      }
    } catch {
      toast.error('Zaxira nusxa yaratib bo\'lmadi');
    }
  };

  return (
    <Router>
      <div className="app-layout">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="main-content" onClick={() => sidebarOpen && setSidebarOpen(false)}>
          {/* Status Bar */}
          <div className="status-bar-container">
            {!isOnline ? (
              <div className="status-badge-bar offline-bar">
                <WifiOff size={16} />
                <span>Oflayn rejim (Barcha buyurtmalar qurilmangizda xavfsiz saqlanmoqda)</span>
              </div>
            ) : (
              <div className="status-badge-bar online-bar">
                <Wifi size={16} />
                <span>Onlayn (Ma'lumotlar bazasi bilan sinxronlangan)</span>
                {isSyncing && <span className="syncing-loader"></span>}
              </div>
            )}
            
            <button className="manual-backup-btn glass" onClick={triggerManualBackup} title="Zaxira nusxa (Backup) yaratish">
              <Database size={16} />
              <span>Zaxira nusxalash</span>
            </button>
          </div>

          {!hasInteracted && (
            <div className="interaction-banner">
              <div className="interaction-banner-content">
                <span className="interaction-icon">🔔</span>
                <span>Ovozli eslatmalarni yoqish uchun sahifaning istalgan joyiga bosing</span>
              </div>
            </div>
          )}
          
          <Routes>
            <Route path="/" element={<Dashboard orders={orders} onRefresh={refreshOrders} />} />
            <Route path="/new-order" element={<NewOrder onOrderCreated={refreshOrders} />} />
            <Route path="/orders" element={<OrdersPage orders={orders} onRefresh={refreshOrders} />} />
            <Route path="/orders/:id" element={<OrderDetail onRefresh={refreshOrders} />} />
            <Route path="/archive" element={<Archive onRefresh={refreshOrders} />} />
          </Routes>
        </main>

        {notificationData && (
          <NotificationPopup
            data={notificationData}
            onDismiss={handleDismissNotification}
            onMarkDelivered={handleMarkDelivered}
          />
        )}

        <ToastContainer
          position="top-right"
          autoClose={8000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss={false}
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </Router>
  );
}

export default App;
