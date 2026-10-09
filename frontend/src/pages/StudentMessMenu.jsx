import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../api';

const StudentMessMenu = () => {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWeek = async () => {
      const today = new Date();
      const from = new Date(today);
      from.setDate(today.getDate() - today.getDay());
      const date = localDateKey(from);

      try {
        const response = await axios.get(`${api}/api/mess/menus`, {
          params: { from: date },
          withCredentials: true,
        });
        setMenus(response.data || []);
      } catch (requestError) {
        console.error('Unable to load the mess menu:', requestError);
        setError(requestError.response?.data?.message || 'Unable to load the mess menu.');
      } finally {
        setLoading(false);
      }
    };

    fetchWeek();
  }, []);

  const dateLookup = new Map(menus.map((menu) => [menu.date, menu]));
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay());
  const week = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    const dateKey = localDateKey(date);
    return { date, dateKey, menu: dateLookup.get(dateKey) };
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      <Navbar />
      <main style={{ maxWidth: 1000, margin: '80px auto', padding: '32px 20px 80px' }}>
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)', padding: 24 }}>
          <h1 style={{ marginTop: 0 }}>Mess Menu</h1>
          <p style={{ color: '#475569', marginBottom: 24 }}>Published meal schedule for this week.</p>
          {loading && <p>Loading the published menu...</p>}
          {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
          {!loading && !error && menus.length === 0 && (
            <p style={{ color: '#64748b' }}>No mess menus have been published for this week.</p>
          )}
          <div style={{ display: 'grid', gap: 16 }}>
            {!loading && !error && week.map(({ date, dateKey, menu }) => (
              <div key={dateKey} style={{ border: '1px solid #e2e8f0', borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>
                  {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
                {!menu ? (
                  <p style={{ color: '#64748b', margin: 0 }}>No menu published for this date.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <MealBlock label="Breakfast" value={menu.breakfast} />
                    <MealBlock label="Lunch" value={menu.lunch} />
                    <MealBlock label="Snacks" value={menu.snacks} />
                    <MealBlock label="Dinner" value={menu.dinner} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const localDateKey = (date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0'),
].join('-');

const MealBlock = ({ label, value }) => (
  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
    <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.1, color: '#64748b', marginBottom: 8 }}>{label}</div>
    <div style={{ fontWeight: 600 }}>{value || 'Not published'}</div>
  </div>
);

export default StudentMessMenu;
