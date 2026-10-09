import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import QuickAccess from '../components/QuickAccess';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import NoticeBoard from '../components/NoticeBoard';
import LocationMap from '../components/LocationMap';
import Footer from '../components/Footer';

const Home = () => {
    return (
        <>
            <Navbar />
            <main>
                <Hero />
                <QuickAccess />
                <Features />
                <HowItWorks />
                {/* <NoticeBoard /> */}
                <LocationMap />
            </main>
            <Footer />
        </>
    );
};

export default Home;
