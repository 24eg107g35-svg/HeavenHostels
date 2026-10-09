import React from 'react';
import { Link } from 'react-router-dom';
import { User, Shield, BedDouble, Utensils } from 'lucide-react';
import './QuickAccess.css';

const QuickAccess = () => {
    const items = [
        { icon: <User size={24} />, label: 'Student Login', color: 'blue', route: '/auth/login' },
        { icon: <Shield size={24} />, label: 'Admin Login', color: 'purple', route: '/auth/login' },
        { icon: <BedDouble size={24} />, label: 'Room Access', color: 'green', route: '/student/room-details' },
        { icon: <Utensils size={24} />, label: 'Mess Menu', color: 'orange', route: '/student/mess-menu' },
    ];

    return (
        <section className="section quick-access-section">
            <div className="container">
                <div className="quick-access-grid">
                    {items.map((item, index) => (
                        <Link key={index} to={item.route} className="quick-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className={`icon-wrapper ${item.color}`}>
                                {item.icon}
                            </div>
                            <span className="card-label">{item.label}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default QuickAccess;
