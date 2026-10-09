package com.example.backend.service;

import com.example.backend.api.dto.HostelDataDtos.MessMenuRequest;
import com.example.backend.api.dto.HostelDataDtos.MessMenuResponse;
import com.example.backend.domain.MessMenu;
import com.example.backend.repository.MessMenuRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class MessMenuService {
    private final MessMenuRepository menus;

    public MessMenuService(MessMenuRepository menus) {
        this.menus = menus;
    }

    @Transactional(readOnly = true)
    public MessMenuResponse byDate(LocalDate date) {
        LocalDate target = date != null ? date : LocalDate.now();
        return menus.findByDate(target).map(this::view).orElseGet(() -> defaultMenuForDate(target));
    }

    @Transactional(readOnly = true)
    public List<MessMenuResponse> weekFrom(LocalDate startDate) {
        LocalDate start = startDate != null ? startDate : LocalDate.now();
        List<MessMenu> existing = menus.findByDateBetweenOrderByDateAsc(start, start.plusDays(6));
        Map<LocalDate, MessMenu> map = new HashMap<>();
        existing.forEach(m -> map.put(m.getDate(), m));

        List<MessMenuResponse> result = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate day = start.plusDays(i);
            if (map.containsKey(day)) {
                result.add(view(map.get(day)));
            } else {
                result.add(defaultMenuForDate(day));
            }
        }
        return result;
    }

    @Transactional
    public MessMenuResponse save(MessMenuRequest request) {
        MessMenu menu = menus.findByDate(request.date())
                .orElseGet(() -> new MessMenu(request.date(), null, null, null, null));
        menu.update(request.date(), request.breakfast(), request.lunch(), request.snacks(), request.dinner());
        return view(menus.save(menu));
    }

    public MessMenuResponse defaultMenuForDate(LocalDate date) {
        DayOfWeek dow = date.getDayOfWeek();
        return switch (dow) {
            case MONDAY -> new MessMenuResponse(null, date,
                    "Idli, Medu Vada, Sambar, Coconut & Tomato Chutney, Tea / Coffee",
                    "Steamed Basmati Rice, Dal Tadka, Aloo Capsicum, Phulka Roti, Curd, Roasted Papad",
                    "Crispy Vegetable Samosa, Mint Chutney, Hot Ginger Masala Tea",
                    "Paneer Butter Masala, Butter Phulka, Jeera Rice, Dal Fry, Fresh Gulab Jamun");
            case TUESDAY -> new MessMenuResponse(null, date,
                    "Crispy Masala Dosa, Potato Masala, Sambar, Allam Chutney, Filter Coffee",
                    "Punjabi Rajma Masala, Steamed Rice, Aloo Gobi Dry, Roti, Cucumber Onion Raita",
                    "Vegetable Cutlet with Tomato Herb Dip, Tea / Coffee",
                    "Mixed Veg Korma, Hot Chapati, Fragrant Ghee Rice, Dal Tadka, Sweet Rice Kheer");
            case WEDNESDAY -> new MessMenuResponse(null, date,
                    "Indori Poha with Roasted Peanuts & Sev, Boiled Eggs / Banana, Masala Chai",
                    "South Indian Traditional Meals, Tomato Rasam, Drumstick Sambar, Cabbage Poriyal, Curd",
                    "Crispy Onion & Palak Pakoda, Green Chutney, Cutting Chai",
                    "Anda Curry / Paneer Bhurji, Butter Tawa Roti, Dal Makhani, Steamed Rice, Vanilla Ice Cream");
            case THURSDAY -> new MessMenuResponse(null, date,
                    "Stuffed Aloo Paratha with Amul Butter, Mixed Pickle, Sweet Curd, Tea",
                    "Amritsari Chole, Jeera Rice, Dal Palak, Bhature / Roti, Green Salad",
                    "Cream Biscuits, Boiled Butter Sweet Corn, Filter Coffee / Tea",
                    "Malai Kofta in Rich Cashew Gravy, Garlic Naan / Tandoori Roti, Veg Pulao, Fruit Custard");
            case FRIDAY -> new MessMenuResponse(null, date,
                    "Puri Bhaji with Halwa, Sprouted Moong Salad, Fresh Seasonal Fruit, Tea / Coffee",
                    "Hyderabadi Dum Biryani (Veg/Chicken), Mirchi Ka Salan, Onion Lemon Raita, Boiled Egg",
                    "Stuffed Bread Pakora, Sweet Tamarind Chutney, Kadak Chai",
                    "Dal Makhani, Butter Phulka, Peas Pulao, Bhindi Do Pyaza, Shahi Tukda");
            case SATURDAY -> new MessMenuResponse(null, date,
                    "Rava Upma with Mixed Veggies, Coconut Chutney, Sweet Kesari Bath, Tea",
                    "Tangy Lemon Rice, Creamy Curd Rice, Potato Roast, Sambar, Crispy Appalam",
                    "Mumbai Pav Bhaji with Butter Pav, Chopped Onions & Lemon, Tea / Coffee",
                    "Kadai Paneer Masala, Laccha Paratha, Veg Fried Rice, Manchurian Gravy, Sweet Rasgulla");
            case SUNDAY -> new MessMenuResponse(null, date,
                    "Mysore Masala Dosa, Onion Uttapam, Coconut & Peanut Chutneys, Tea / Coffee",
                    "Sunday Grand Feast: Shahi Paneer, Mughlai Chicken Curry, Biryani, Naan, Boondi Raita",
                    "Assorted Bakery Cookies & Plum Cake, Evening Tea / Coffee",
                    "Light Moong Dal Khichdi, Phulka, Aloo Jeera, Mango Pickle, Curd, Moong Dal Halwa");
        };
    }

    private MessMenuResponse view(MessMenu menu) {
        return new MessMenuResponse(menu.getId(), menu.getDate(), menu.getBreakfast(),
                menu.getLunch(), menu.getSnacks(), menu.getDinner());
    }
}
