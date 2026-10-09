import React from 'react';
import './LocationMap.css';

const LocationMap = () => {
    return (
        <section className="section location-section">
            <div className="container">
                <div className="section-header text-center">
                    <h2 className="section-title">Find Us</h2>
                    <p className="section-subtitle">Visit our hostel at this location.</p>
                </div>
                <div className="map-container">
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.7799759223226!2d78.6471448752112!3d17.42234358347081!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb9fbc2a520c4b%3A0x15e68870f7a5c44a!2sHeaven%20boys%20hostel!5e0!3m2!1sen!2sin!4v1766168417046!5m2!1sen!2sin"
                        width="100%"
                        height="450"
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Hostel Location"
                    ></iframe>
                </div>

                
            </div>
        </section>
    );
};

export default LocationMap;
