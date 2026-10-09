package com.example.backend.api;

import com.example.backend.api.dto.HostelDataDtos.MessMenuRequest;
import com.example.backend.api.dto.HostelDataDtos.MessMenuResponse;
import com.example.backend.service.ApiException;
import com.example.backend.service.MessMenuService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/mess/menus")
public class MessMenuController {
    private final MessMenuService menus;

    public MessMenuController(MessMenuService menus) {
        this.menus = menus;
    }

    @GetMapping("/{date}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT')")
    public MessMenuResponse byDate(@PathVariable LocalDate date) {
        MessMenuResponse menu = menus.byDate(date);
        if (menu == null) throw ApiException.notFound("Mess menu not found for " + date);
        return menu;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT')")
    public List<MessMenuResponse> week(@RequestParam(required = false) LocalDate from) {
        return menus.weekFrom(from == null ? LocalDate.now() : from);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN')")
    public MessMenuResponse save(@Valid @RequestBody MessMenuRequest request) {
        return menus.save(request);
    }
}
