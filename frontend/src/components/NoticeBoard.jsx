import React from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import './NoticeBoard.css';

const NoticeBoard = () => {
    const notices = [
        { id: 1, title: 'Hostel Fee Payment Deadline Extended', date: 'Oct 24, 2023' },
        { id: 2, title: 'Maintenance Work in Block A', date: 'Oct 22, 2023' },
        { id: 3, title: 'New Mess Menu for November', date: 'Oct 20, 2023' },
    ];

    return (
        <section className="section notice-section">
            <div className="container">
                <div className="notice-header">
                    <h2 className="section-title">Notice Board</h2>
                    <button className="btn-view-all">
                        View All <ChevronRight size={16} />
                    </button>
                </div>

                <div className="notices-list">
                    {notices.map((notice) => (
                        <div key={notice.id} className="notice-card">
                            <div className="notice-date">
                                <Calendar size={14} /> {notice.date}
                            </div>
                            <h3 className="notice-title">{notice.title}</h3>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default NoticeBoard;
