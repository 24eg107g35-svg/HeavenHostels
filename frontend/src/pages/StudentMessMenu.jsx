import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Utensils, Coffee, Sun, Sunset, Moon, ShieldCheck, 
  MessageSquare, Calendar, ChevronRight, CheckCircle2 
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../api';
import './StudentMessMenu.css';

const DEFAULT_WEEKLY_MENU = {
  1: { // Monday
    breakfast: "Idli, Medu Vada, Sambar, Coconut & Tomato Chutney, Tea / Coffee",
    lunch: "Steamed Basmati Rice, Dal Tadka, Aloo Capsicum, Phulka Roti, Curd, Roasted Papad",
    snacks: "Crispy Vegetable Samosa, Mint Chutney, Hot Ginger Masala Tea",
    dinner: "Paneer Butter Masala, Butter Phulka, Jeera Rice, Dal Fry, Fresh Gulab Jamun"
  },
  2: { // Tuesday
    breakfast: "Crispy Masala Dosa, Potato Masala, Sambar, Allam Chutney, Filter Coffee",
    lunch: "Punjabi Rajma Masala, Steamed Rice, Aloo Gobi Dry, Roti, Cucumber Onion Raita",
    snacks: "Vegetable Cutlet with Tomato Herb Dip, Tea / Coffee",
    dinner: "Mixed Veg Korma, Hot Chapati, Fragrant Ghee Rice, Dal Tadka, Sweet Rice Kheer"
  },
  3: { // Wednesday
    breakfast: "Indori Poha with Roasted Peanuts & Sev, Boiled Eggs / Banana, Masala Chai",
    lunch: "South Indian Traditional Meals, Tomato Rasam, Drumstick Sambar, Cabbage Poriyal, Curd",
    snacks: "Crispy Onion & Palak Pakoda, Green Chutney, Cutting Chai",
    dinner: "Anda Curry / Paneer Bhurji, Butter Tawa Roti, Dal Makhani, Steamed Rice, Vanilla Ice Cream"
  },
  4: { // Thursday
    breakfast: "Stuffed Aloo Paratha with Amul Butter, Mixed Pickle, Sweet Curd, Tea",
    lunch: "Amritsari Chole, Jeera Rice, Dal Palak, Bhature / Roti, Green Salad",
    snacks: "Cream Biscuits, Boiled Butter Sweet Corn, Filter Coffee / Tea",
    dinner: "Malai Kofta in Rich Cashew Gravy, Garlic Naan / Tandoori Roti, Veg Pulao, Fruit Custard"
  },
  5: { // Friday
    breakfast: "Puri Bhaji with Halwa, Sprouted Moong Salad, Fresh Seasonal Fruit, Tea / Coffee",
    lunch: "Hyderabadi Dum Biryani (Veg/Chicken), Mirchi Ka Salan, Onion Lemon Raita, Boiled Egg",
    snacks: "Stuffed Bread Pakora, Sweet Tamarind Chutney, Kadak Chai",
    dinner: "Dal Makhani, Butter Phulka, Peas Pulao, Bhindi Do Pyaza, Shahi Tukda"
  },
  6: { // Saturday
    breakfast: "Rava Upma with Mixed Veggies, Coconut Chutney, Sweet Kesari Bath, Tea",
    lunch: "Tangy Lemon Rice, Creamy Curd Rice, Potato Roast, Sambar, Crispy Appalam",
    snacks: "Mumbai Pav Bhaji with Butter Pav, Chopped Onions & Lemon, Tea / Coffee",
    dinner: "Kadai Paneer Masala, Laccha Paratha, Veg Fried Rice, Manchurian Gravy, Sweet Rasgulla"
  },
  0: { // Sunday
    breakfast: "Mysore Masala Dosa, Onion Uttapam, Coconut & Peanut Chutneys, Tea / Coffee",
    lunch: "Sunday Grand Feast: Shahi Paneer, Mughlai Chicken Curry, Biryani, Naan, Boondi Raita",
    snacks: "Assorted Bakery Cookies & Plum Cake, Evening Tea / Coffee",
    dinner: "Light Moong Dal Khichdi, Phulka, Aloo Jeera, Mango Pickle, Curd, Moong Dal Halwa"
  }
};

const localDateKey = (date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0'),
].join('-');

const StudentMessMenu = () => {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => new Date().getDay());

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
        console.warn('Backend mess menu fetch failed, using rotating weekly meals:', requestError);
      } finally {
        setLoading(false);
      }
    };

    fetchWeek();
  }, []);

  const today = new Date();
  const currentDayOfWeek = today.getDay();

  // Build the 7 days of this week
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const daysOfWeek = Array.from({ length: 7 }, (_, offset) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + offset);
    const dateKey = localDateKey(d);
    const dayOfWeek = d.getDay(); // 0 is Sunday, 1 is Monday ...

    // Find in fetched menu or fallback
    const backendMenu = menus.find(m => m.date === dateKey);
    const fallback = DEFAULT_WEEKLY_MENU[dayOfWeek] || DEFAULT_WEEKLY_MENU[1];

    const mealData = {
      breakfast: backendMenu?.breakfast || fallback.breakfast,
      lunch: backendMenu?.lunch || fallback.lunch,
      snacks: backendMenu?.snacks || fallback.snacks,
      dinner: backendMenu?.dinner || fallback.dinner
    };

    return {
      date: d,
      dateKey,
      dayIndex: dayOfWeek,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      fullDayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
      formattedDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isToday: dayOfWeek === currentDayOfWeek,
      meals: mealData
    };
  });

  const activeDay = daysOfWeek.find(d => d.dayIndex === selectedDayIndex) || daysOfWeek[0];

  return (
    <div className="mess-menu-page">
      <Navbar />

      <header className="mess-hero">
        <div className="mess-pill">
          <Utensils size={15} />
          <span>Hostel Dining & Food Services</span>
        </div>
        <h1 className="mess-hero-title">Hostel Mess Menu Schedule</h1>
        <p className="mess-hero-sub">
          Wholesome, hygienic, and nutritious 4-course meals served daily at Heaven Boys Hostel.
        </p>
      </header>

      <main className="mess-container">
        {/* Day Selector */}
        <div className="mess-day-selector">
          {daysOfWeek.map((day) => {
            const isActive = selectedDayIndex === day.dayIndex;
            return (
              <button
                key={day.dateKey}
                type="button"
                className={`day-btn ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedDayIndex(day.dayIndex)}
              >
                <span className="day-name">{day.dayName}</span>
                <span className="day-date">{day.formattedDate}</span>
                {day.isToday && <span className="today-chip">Today</span>}
              </button>
            );
          })}
        </div>

        {/* Selected Day Header */}
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              {activeDay.fullDayName} Meal Plan
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              Date: {activeDay.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <span style={{ background: '#ecfdf5', color: '#059669', padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, border: '1px solid #a7f3d0' }}>
            ✓ Freshly Prepared Today
          </span>
        </div>

        {/* Meals 4 Cards Grid */}
        <div className="meals-grid">
          {/* Breakfast */}
          <div className="meal-card">
            <div className="meal-card-head">
              <div className="meal-icon-wrap icon-amber">
                <Coffee size={22} />
              </div>
              <div className="meal-title-group">
                <h3>Breakfast</h3>
                <span className="meal-timing">7:30 AM – 9:30 AM</span>
              </div>
            </div>
            <p className="meal-items-text">{activeDay.meals.breakfast}</p>
          </div>

          {/* Lunch */}
          <div className="meal-card">
            <div className="meal-card-head">
              <div className="meal-icon-wrap icon-orange">
                <Sun size={22} />
              </div>
              <div className="meal-title-group">
                <h3>Lunch</h3>
                <span className="meal-timing">12:30 PM – 2:30 PM</span>
              </div>
            </div>
            <p className="meal-items-text">{activeDay.meals.lunch}</p>
          </div>

          {/* Evening Snacks */}
          <div className="meal-card">
            <div className="meal-card-head">
              <div className="meal-icon-wrap icon-teal">
                <Sunset size={22} />
              </div>
              <div className="meal-title-group">
                <h3>Evening Snacks</h3>
                <span className="meal-timing">5:00 PM – 6:30 PM</span>
              </div>
            </div>
            <p className="meal-items-text">{activeDay.meals.snacks}</p>
          </div>

          {/* Dinner */}
          <div className="meal-card">
            <div className="meal-card-head">
              <div className="meal-icon-wrap icon-indigo">
                <Moon size={22} />
              </div>
              <div className="meal-title-group">
                <h3>Dinner</h3>
                <span className="meal-timing">8:00 PM – 10:00 PM</span>
              </div>
            </div>
            <p className="meal-items-text">{activeDay.meals.dinner}</p>
          </div>
        </div>

        {/* Hygiene Standards & Feedback */}
        <div className="mess-info-banner">
          <div className="mess-info-left">
            <div className="info-icon-badge">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h4>FSSAI Certified Kitchen & Purified Water</h4>
              <p>
                All meals are prepared with high food-grade oils, fresh vegetables sourced daily, and RO water. Strict hygiene standards are followed by all culinary staff.
              </p>
            </div>
          </div>
          <Link to="/student/raise-complaint" className="btn-mess-complaint">
            <MessageSquare size={16} />
            <span>Give Food Feedback / Complaint</span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StudentMessMenu;
