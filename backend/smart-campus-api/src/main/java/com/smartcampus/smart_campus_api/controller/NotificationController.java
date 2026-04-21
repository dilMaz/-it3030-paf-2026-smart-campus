package com.smartcampus.smart_campus_api.controller;

import java.util.Map;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.smart_campus_api.model.Notification;
import com.smartcampus.smart_campus_api.model.User;
import com.smartcampus.smart_campus_api.notification.dto.CreateNotificationRequest;
import com.smartcampus.smart_campus_api.notification.dto.MarkAllReadResponse;
import com.smartcampus.smart_campus_api.repository.UserRepository;
import com.smartcampus.smart_campus_api.service.NotificationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"}, allowCredentials = "true")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getMyNotifications(@AuthenticationPrincipal Object principal) {
        Optional<User> currentUser = getCurrentUser(principal);
        if (currentUser.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        return ResponseEntity.ok(notificationService.getUserNotifications(currentUser.get().getId()));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyNotificationsCompat(@AuthenticationPrincipal Object principal) {
        return getMyNotifications(principal);
    }

    @PostMapping
    public ResponseEntity<?> createNotification(
            @Valid @RequestBody CreateNotificationRequest request,
            @AuthenticationPrincipal Object principal) {
        Optional<User> currentUser = getCurrentUser(principal);
        if (currentUser.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        if (!isAdmin(currentUser.get())) {
            return ResponseEntity.status(403).body(Map.of("error", "Only admins can create notifications via API"));
        }

        Notification created = notificationService.createNotification(
                request.userId(),
                request.type(),
                request.message(),
                request.referenceId());

        return ResponseEntity.ok(created);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable String id,
            @AuthenticationPrincipal Object principal) {
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

    @PatchMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(@AuthenticationPrincipal Object principal) {
        Optional<User> currentUser = getCurrentUser(principal);
        if (currentUser.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        long updatedCount = notificationService.markAllAsRead(currentUser.get().getId());
        return ResponseEntity.ok(new MarkAllReadResponse(updatedCount));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(
            @PathVariable String id,
            @AuthenticationPrincipal Object principal) {
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
    public ResponseEntity<?> getUnreadCount(@AuthenticationPrincipal Object principal) {
        Optional<User> currentUser = getCurrentUser(principal);
        if (currentUser.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        return ResponseEntity.ok(notificationService.getUnreadCount(currentUser.get().getId()));
    }

    private Optional<User> getCurrentUser(Object principal) {
        if (principal == null) {
            return Optional.empty();
        }

        String email = extractEmail(principal);
        if (email == null || email.isBlank()) {
            return Optional.empty();
        }

        return userRepository.findByEmail(email.trim().toLowerCase());
    }

    private String extractEmail(Object principal) {
        if (principal instanceof OAuth2User oauth2User) {
            Object email = oauth2User.getAttribute("email");
            return email instanceof String value ? value : null;
        }
        if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        }
        if (principal instanceof String value) {
            return value;
        }
        return null;
    }

    private boolean isAdmin(User user) {
        return user.getRoles() != null
                && user.getRoles().stream().anyMatch(role -> "ADMIN".equalsIgnoreCase(role));
    }
}