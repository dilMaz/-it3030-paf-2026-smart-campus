package com.smartcampus.smart_campus_api.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.smartcampus.smart_campus_api.model.Notification;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Notification> findByUserIdAndIsRead(String userId, boolean isRead);
    long countByUserIdAndIsRead(String userId, boolean isRead);
}