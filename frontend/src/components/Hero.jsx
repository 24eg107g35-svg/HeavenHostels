import React from 'react';
import './Hero.css';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';
const Hero = () => {
    return (
        <section className="hero-section">
            <div className="container hero-container">
                <div className="hero-text">
                    <h1 className="hero-title">
                        Heaven <br />
                        Hostels
                    </h1>
                    <p className="hero-subtitle">
                        Manage your hostel operations with our all-in-one mobile-first solution.
                        Manage rooms, fees, and students effortlessly.
                    </p>
                    <div className="hero-buttons">
                        <Link to="/auth/register"><button className="btn-hero-primary">
                            Register <ArrowRight size={20} />
                        </button></Link>
                        <Link to="/student/student-dashboard"><button className="btn-hero-primary">
                            Student <ArrowRight size={20} />
                        </button></Link>
                        <Link to="/admin/admin-dashboard"><button className="btn-hero-primary">Admin <ArrowRight size={20} /></button></Link>
                    </div>
                </div>

                <div className="hero-visual">
                    <div className="glass-card">
                        <div className="card-header">
                            <div className="dot red"></div>
                            <div className="dot yellow"></div>
                            <div className="dot green"></div>
                        </div> 
                        <div className="card-body">
                            <div className="stat-row">
                                <div className="stat-box">
                                    <span className="label">Hostels</span>
                                    <span className="value">3</span>
                                </div>
                                <div className="stat-box">
                                    <span className="label">Students</span>
                                    <span className="value">300+</span>
                                </div>
                            </div>
                            <div className="chart-placeholder">
                                <div className="bar" style={{ height: '40%' }}></div>
                                <div className="bar" style={{ height: '70%' }}></div>
                                <div className="bar" style={{ height: '50%' }}></div>
                                <div className="bar" style={{ height: '90%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
