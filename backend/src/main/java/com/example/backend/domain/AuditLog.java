package com.example.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 254)
    private String userEmail;

    @Column(nullable = false, length = 80)
    private String action;

    @Column(nullable = false, length = 80)
    private String entityName;

    @Column(length = 80)
    private String entityId;

    @Column(nullable = false, updatable = false)
    private Instant occurredAt = Instant.now();

    @Column(length = 45)
    private String ipAddress;

    protected AuditLog() {
    }

    public AuditLog(String userEmail, String action, String entityName, String entityId, String ipAddress) {
        this.userEmail = userEmail;
        this.action = action;
        this.entityName = entityName;
        this.entityId = entityId;
        this.ipAddress = ipAddress;
    }
}
