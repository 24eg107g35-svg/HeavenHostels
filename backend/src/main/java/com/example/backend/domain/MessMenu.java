package com.example.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "mess_menus", uniqueConstraints = @UniqueConstraint(name = "uk_mess_menus_date", columnNames = "menu_date"))
public class MessMenu {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "menu_date", nullable = false)
    private LocalDate date;

    @Column(length = 1000)
    private String breakfast;

    @Column(length = 1000)
    private String lunch;

    @Column(length = 1000)
    private String snacks;

    @Column(length = 1000)
    private String dinner;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected MessMenu() {
    }

    public MessMenu(LocalDate date, String breakfast, String lunch, String snacks, String dinner) {
        update(date, breakfast, lunch, snacks, dinner);
    }

    public void update(LocalDate date, String breakfast, String lunch, String snacks, String dinner) {
        this.date = date;
        this.breakfast = breakfast;
        this.lunch = lunch;
        this.snacks = snacks;
        this.dinner = dinner;
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public LocalDate getDate() { return date; }
    public String getBreakfast() { return breakfast; }
    public String getLunch() { return lunch; }
    public String getSnacks() { return snacks; }
    public String getDinner() { return dinner; }
}
