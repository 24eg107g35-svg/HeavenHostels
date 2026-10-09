import React from 'react';
import { Link } from 'react-router-dom';
import { Bed, CreditCard, Utensils, MessageSquareWarning, BarChart3, Bell } from 'lucide-react';
import './Features.css';

const Features = () => {
    const features = [
        { icon: <Bed size={24} />, title: 'Room Access', desc: 'You Can Access Your Room Details.', route: '/student/room-details' },
        { icon: <CreditCard size={24} />, title: 'Fee Management', desc: 'You Can Track Your Payment Recipts.', route: '/student/fee-management' },
        { icon: <Utensils size={24} />, title: 'Mess Management', desc: 'You Can Track Your Mess Details.', route: '/student/mess-menu' },
        { icon: <MessageSquareWarning size={24} />, title: 'Complaints', desc: 'You Can Raise Your Complaints.', route: '/student/raise-complaint' },
        { icon: <BarChart3 size={24} />, title: 'Reports', desc: 'You Can Track Your Payment Recipts.', route: '/student/fee-history' },
        { icon: <Bell size={24} />, title: 'Notifications', desc: 'View your hostel updates and alerts.', route: '/student/notifications' },
    ];

    return (
        <section id="features" className="section features-section">
            <div className="container">
                <div className="section-header text-center">
                    <h2 className="section-title">Everything You Need</h2>
                    <p className="section-subtitle">Powerful features to manage your hostel efficiently.</p>
                </div>

                <div className="features-grid">
                    {features.map((feature, index) => (
                        <Link key={index} to={feature.route} className="feature-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="feature-icon">
                                {feature.icon}
                            </div>
                            <h3 className="feature-title">{feature.title}</h3>
                            <p className="feature-desc">{feature.desc}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
