package com.example.backend.service;

import com.example.backend.api.dto.HostelDataDtos.MessMenuRequest;
import com.example.backend.api.dto.HostelDataDtos.MessMenuResponse;
import com.example.backend.domain.MessMenu;
import com.example.backend.repository.MessMenuRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class MessMenuService {
    private final MessMenuRepository menus;

    public MessMenuService(MessMenuRepository menus) {
        this.menus = menus;
    }

    @Transactional(readOnly = true)
    public MessMenuResponse byDate(LocalDate date) {
        return menus.findByDate(date).map(this::view).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<MessMenuResponse> weekFrom(LocalDate startDate) {
        return menus.findByDateBetweenOrderByDateAsc(startDate, startDate.plusDays(6))
                .stream().map(this::view).toList();
    }

    @Transactional
    public MessMenuResponse save(MessMenuRequest request) {
        MessMenu menu = menus.findByDate(request.date())
                .orElseGet(() -> new MessMenu(request.date(), null, null, null, null));
        menu.update(request.date(), request.breakfast(), request.lunch(), request.snacks(), request.dinner());
        return view(menus.save(menu));
    }

    private MessMenuResponse view(MessMenu menu) {
        return new MessMenuResponse(menu.getId(), menu.getDate(), menu.getBreakfast(),
                menu.getLunch(), menu.getSnacks(), menu.getDinner());
    }
}
