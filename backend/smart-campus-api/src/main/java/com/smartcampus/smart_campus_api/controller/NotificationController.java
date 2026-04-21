package com.smartcampus.smart_campus_api.controller;

import java.util.Map;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.smart_campus_api.model.Notification;
import com.smartcampus.smart_campus_api.model.User;
import com.smartcampus.smart_campus_api.repository.UserRepository;
import com.smartcampus.smart_campus_api.service.NotificationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"}, allowCredentials = "true")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<?> getMyNotifications(@AuthenticationPrincipal OAuth2User principal) {
        Optional<User> currentUser = getCurrentUser(principal);
        if (currentUser.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        return ResponseEntity.ok(notificationService.getUserNotifications(currentUser.get().getId()));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserNotifications(
            @PathVariable String userId,
            @AuthenticationPrincipal OAuth2User principal) {

        Optional<User> currentUser = getCurrentUser(principal);
        if (currentUser.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        if (!isAdmin(currentUser.get())) {
            return ResponseEntity.status(403).body(Map.of("error", "Only admins can access another user's notifications"));
        }

        return ResponseEntity.ok(notificationService.getUserNotifications(userId));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable String id,
            @AuthenticationPrincipal OAuth2User principal) {

        Optional<User> currentUser = getCurrentUser(principal);
        if (currentUser.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        Notification notification = notificationService.getNotificationById(id);
        if (!notification.getUserId().equals(currentUser.get().getId()) && !isAdmin(currentUser.get())) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(
            @PathVariable String id,
            @AuthenticationPrincipal OAuth2User principal) {

        Optional<User> currentUser = getCurrentUser(principal);
        if (currentUser.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        Notification notification = notificationService.getNotificationById(id);
        if (!notification.getUserId().equals(currentUser.get().getId()) && !isAdmin(currentUser.get())) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        notificationService.deleteNotification(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/unread-count")
    public ResponseEntity<?> getUnreadCount(@AuthenticationPrincipal OAuth2User principal) {
        Optional<User> currentUser = getCurrentUser(principal);
        if (currentUser.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        return ResponseEntity.ok(notificationService.getUnreadCount(currentUser.get().getId()));
    }

    private Optional<User> getCurrentUser(OAuth2User principal) {
        if (principal == null) {
            return Optional.empty();
        }

        String email = principal.getAttribute("email");
        if (email == null || email.isBlank()) {
            return Optional.empty();
        }

        return userRepository.findByEmail(email);
    }

    private boolean isAdmin(User user) {
        return user.getRoles() != null && user.getRoles().contains("ADMIN");
    }
}