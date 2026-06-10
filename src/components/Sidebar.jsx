import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, ClipboardList, Menu, X, FolderArchive } from 'lucide-react';
import XumorLogo from './XumorLogo';
import '../styles/sidebar.css';

const Sidebar = ({ isOpen, onToggle }) => {
  const navItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Boshqaruv paneli' },
    { path: '/new-order', icon: <PlusCircle size={20} />, label: 'Yangi buyurtma' },
    { path: '/orders', icon: <ClipboardList size={20} />, label: 'Barcha buyurtmalar' },
    { path: '/archive', icon: <FolderArchive size={20} />, label: 'Arxiv' },
  ];

  return (
    <>
      <button className="hamburger-btn" onClick={onToggle}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      
      <aside className={`sidebar glass ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">
            <XumorLogo size={56} />
          </div>
          <h1 className="logo-text">xumor somsa</h1>
          <p className="logo-subtitle">Buyurtma boshqaruvi</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              onClick={() => onToggle && isOpen && onToggle()}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-text">
            <span className="footer-dot"></span>
            Tizim faol
          </div>
        </div>
      </aside>

      {isOpen && <div className="sidebar-overlay" onClick={onToggle}></div>}
    </>
  );
};

export default Sidebar;
