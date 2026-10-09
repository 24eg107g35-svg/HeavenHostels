import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, UserRound, X } from 'lucide-react';
import './Navbar.css';
import axios from 'axios';
import api from '../api';
import StudentNotificationBell from './StudentNotificationBell';
import AdminPaymentRequestBell from './AdminPaymentRequestBell';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState('');
  const [role, setRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let active = true;
    if (!localStorage.getItem('Token')) {
      return undefined;
    }
    axios.get(`${api}/api/auth/me`, { withCredentials: true })
      .then((response) => {
        if (active) setRole(response.data.role);
      })
      .catch((error) => {
        console.error('Unable to load navbar account:', error);
        if (active && error.response?.status === 401) {
          localStorage.removeItem('Token');
          setRole('');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleLoginClick = () => {
    navigate('/auth/login');
    setIsMobileMenuOpen(false);
  };

  const handleRegisterClick = () => {
    navigate('/auth/register');
    setIsMobileMenuOpen(false);
  };

  const handleLogoutClick = async () => {
    try {
        if (localStorage.getItem('Token')) {
          await axios.post(`${api}/api/auth/logout`);
        }
        localStorage.removeItem('Token');
        localStorage.removeItem('AdminToken');
        setRole('');
        setLogoutMessage('✓ Logout successful! Redirecting...');
        setTimeout(() => {
          setLogoutMessage('');
          navigate('/');
        }, 500);
      }
    catch (error) {
      console.error('Logout request failed:', error);
      localStorage.removeItem('Token');
      localStorage.removeItem('AdminToken');
      setRole('');
      setLogoutMessage('Local logout completed; the server could not revoke this session.');
      setTimeout(() => {
        setLogoutMessage('');
      }, 3000);
    }
  };

  const openDashboard = () => {
    navigate(role === 'ADMIN' ? '/admin/admin-dashboard' : '/student/student-dashboard');
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-content">
        <Link to="/" className="logo">
          Heaven<span className="text-gradient">Hostels</span>
        </Link>

        <div className="desktop-links">
          <Link to="/">Home</Link>
          <a href="#features">Features</a>
          <a href="#how-it-works">How it Works</a>
          <a href="#contact">Contact</a>
        </div>

        <div className="desktop-actions">
          {role === 'STUDENT' && <StudentNotificationBell />}
          {role === 'ADMIN' && <AdminPaymentRequestBell />}
          {role === 'ADMIN' && (
            <Link to="/admin/notifications" className="navbar-icon-link" aria-label="Send student notification" title="Send student notification">
              <Bell size={20} />
            </Link>
          )}
          {role ? (
            <>
              <button className="navbar-account-button" onClick={openDashboard} aria-label="Open account dashboard" title="Open account dashboard">
                <UserRound size={20} />
                <span>{role === 'ADMIN' ? 'Admin' : 'Account'}</span>
              </button>
              <button className="navbar-icon-link navbar-logout-button" onClick={handleLogoutClick} aria-label="Log out" title="Log out">
                <LogOut size={19} />
              </button>
            </>
          ) : (
            <>
              <button className="navbar-account-button" onClick={handleLoginClick} aria-label="Log in" title="Log in">
                <UserRound size={20} />
                <span>Log in</span>
              </button>
              <button className="btn-login" onClick={handleRegisterClick}>Register</button>
            </>
          )}
        </div>

        {logoutMessage && (
          <div className="logout-message" style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '6px',
            backgroundColor: logoutMessage.includes('✓') ? '#10b981' : '#ef4444',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: '9999',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            animation: 'slideIn 0.3s ease-out'
          }}>
            {logoutMessage}
          </div>
        )}

        <button
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-links">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
          <a href="#features" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
          <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)}>How it Works</a>
          <a href="#contact" onClick={() => setIsMobileMenuOpen(false)}>Contact</a>
          {role === 'STUDENT' && (
            <Link to="/student/notifications" onClick={() => setIsMobileMenuOpen(false)}>Notifications</Link>
          )}
          {role === 'ADMIN' && (
            <Link to="/admin/notifications" onClick={() => setIsMobileMenuOpen(false)}>Send student notification</Link>
          )}
          {role ? (
            <>
              <button className="btn-login mobile" onClick={openDashboard}>
                <UserRound size={18} /> {role === 'ADMIN' ? 'Admin dashboard' : 'My dashboard'}
              </button>
              <button className="btn-logout mobile" onClick={handleLogoutClick}>Log out</button>
            </>
          ) : (
            <>
              <button className="btn-login mobile" onClick={handleLoginClick}>Log in</button>
              <button className="btn-login mobile" onClick={handleRegisterClick}>Register</button>
            </>
          )}

        </div>
      </div>
    </nav>

  );
};

export default Navbar;
