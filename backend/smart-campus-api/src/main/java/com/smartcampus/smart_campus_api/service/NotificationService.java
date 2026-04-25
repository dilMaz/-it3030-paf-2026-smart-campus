package com.smartcampus.smart_campus_api.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.smartcampus.smart_campus_api.model.Notification;
import com.smartcampus.smart_campus_api.model.NotificationType;
import com.smartcampus.smart_campus_api.repository.NotificationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public Notification createNotification(String userId, NotificationType type, String message, String referenceId) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setMessage(message);
        notification.setReferenceId(referenceId);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        return notificationRepository.save(notification);
    }

    public List<Notification> getUserNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Notification getNotificationById(String notificationId) {
        return notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
    }

    public Notification markAsRead(String notificationId) {
        Notification notification = getNotificationById(notificationId);
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    public Notification markAsRead(String notificationId, String userId, boolean isAdmin) {
        Notification notification = getNotificationById(notificationId);
        if (!isAdmin && !notification.getUserId().equals(userId)) {
            throw new RuntimeException("Forbidden");
        }

        if (notification.isRead()) {
            return notification;
        }

        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    public long markAllAsRead(String userId) {
        List<Notification> unreadNotifications = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        if (unreadNotifications.isEmpty()) {
            return 0L;
        }

        unreadNotifications.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(unreadNotifications);
        return unreadNotifications.size();
    }

    public void deleteNotification(String notificationId) {
        notificationRepository.deleteById(notificationId);
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsRead(userId, false);
    }
}