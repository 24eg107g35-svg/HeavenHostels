package com.example.backend.service;

import com.example.backend.domain.AuditLog;
import com.example.backend.repository.AuditLogRepository;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {
    private final AuditLogRepository logs;

    public AuditService(AuditLogRepository logs) {
        this.logs = logs;
    }

    @Transactional
    public void record(String userEmail, String action, String entity, Object entityId) {
        var attributes = RequestContextHolder.getRequestAttributes();
        String ip = attributes instanceof ServletRequestAttributes servletAttributes
                ? servletAttributes.getRequest().getRemoteAddr() : null;
        logs.save(new AuditLog(userEmail, action, entity,
                entityId == null ? null : entityId.toString(), ip));
    }
}
