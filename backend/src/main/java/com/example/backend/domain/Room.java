package com.example.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rooms", uniqueConstraints = @UniqueConstraint(name = "uk_room_number", columnNames = "room_number"))
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_number", nullable = false, length = 30)
    private String roomNumber;

    @Column(nullable = false)
    private int capacity;

    @Column(nullable = false, precision = 10, scale = 2)
    private java.math.BigDecimal monthlyRate = java.math.BigDecimal.ZERO;

    @Column(nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "room")
    private List<Student> students = new ArrayList<>();

    protected Room() {
    }

    public Room(String roomNumber, int capacity, java.math.BigDecimal monthlyRate) {
        this.roomNumber = roomNumber;
        this.capacity = capacity;
        this.monthlyRate = monthlyRate;
    }

    public Long getId() { return id; }
    public String getRoomNumber() { return roomNumber; }
    public int getCapacity() { return capacity; }
    public java.math.BigDecimal getMonthlyRate() { return monthlyRate; }
    public boolean isActive() { return active; }
    public List<Student> getStudents() { return students; }
    public void update(String roomNumber, int capacity, java.math.BigDecimal monthlyRate, boolean active) {
        this.roomNumber = roomNumber;
        this.capacity = capacity;
        this.monthlyRate = monthlyRate;
        this.active = active;
    }
}
