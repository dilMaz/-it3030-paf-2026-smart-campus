package com.smartcampus.smart_campus_api.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;
    private String userId;
    private NotificationType type;
    private String message;
    private String referenceId;
    private boolean isRead;
    private LocalDateTime createdAt;
}