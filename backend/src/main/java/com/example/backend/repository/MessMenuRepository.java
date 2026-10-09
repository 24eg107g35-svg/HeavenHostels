package com.example.backend.repository;

import com.example.backend.domain.MessMenu;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MessMenuRepository extends JpaRepository<MessMenu, Long> {
    Optional<MessMenu> findByDate(LocalDate date);
    List<MessMenu> findByDateBetweenOrderByDateAsc(LocalDate startDate, LocalDate endDate);
}
