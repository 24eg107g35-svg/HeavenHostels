import React from 'react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer" id='contact'>
            <div className="container footer-content">
                <div className="footer-brand">
                    <h2 className="footer-logo">Heaven Hostels</h2>
                    <p className="footer-desc">
                       Your safety is our priority
                    </p>
                </div>

                <div className="footer-links">
                    <h3>Quick Links</h3>
                    <ul>
                        <li><a href="#">Home</a></li>
                        <li><a href="#">Features</a></li>
                        <li><a href="#">Pricing</a></li>
                        <li><a href="#">Contact</a></li>
                    </ul>
                </div>

                <div className="footer-contact">
                    <h3>Contact Us</h3>
                    <p>support@HeavenHostels.com</p>
                    <p>+91 9553573696</p>
                </div>
            </div>
            <div className="footer-bottom">
                <div className="container">
                    <p>&copy; 2025 Heaven Hostels. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
