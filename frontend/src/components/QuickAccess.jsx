import React from 'react';
import { User, Shield, BedDouble, ClipboardList } from 'lucide-react';
import './QuickAccess.css';

const QuickAccess = () => {
    const items = [
        { icon: <User size={24} />, label: 'Student Login', color: 'blue' },
        { icon: <Shield size={24} />, label: 'Admin Login', color: 'purple' },
        { icon: <BedDouble size={24} />, label: 'Availability', color: 'green' },
        { icon: <ClipboardList size={24} />, label: 'Notice Board', color: 'orange' },
    ];

    return (
        <section className="section quick-access-section">
            <div className="container">
                <div className="quick-access-grid">
                    {items.map((item, index) => (
                        <div key={index} className="quick-card">
                            <div className={`icon-wrapper ${item.color}`}>
                                {item.icon}
                            </div>
                            <span className="card-label">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default QuickAccess;
