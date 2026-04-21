package com.smartcampus.smart_campus_api.service;

import org.springframework.stereotype.Service;

import com.smartcampus.smart_campus_api.booking.entity.Booking;
import com.smartcampus.smart_campus_api.booking.enums.BookingStatus;
import com.smartcampus.smart_campus_api.model.NotificationType;
import com.smartcampus.smart_campus_api.model.TicketStatus;
import com.smartcampus.smart_campus_api.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationTriggerService {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public void handleBookingStatusChanged(Booking booking) {
        if (booking == null) {
            return;
        }

        String targetUserId = resolveBookingTargetUserId(booking);
        if (targetUserId == null || targetUserId.isBlank()) {
            return;
        }

        String resourceName = (booking.getResourceName() == null || booking.getResourceName().isBlank())
                ? "the resource"
                : booking.getResourceName();

        if (booking.getStatus() == BookingStatus.APPROVED) {
            notificationService.createNotification(
                    targetUserId,
                    NotificationType.BOOKING_APPROVED,
                    "Your booking for " + resourceName + " was approved.",
                    booking.getId());
        }

        if (booking.getStatus() == BookingStatus.REJECTED) {
            notificationService.createNotification(
                    targetUserId,
                    NotificationType.BOOKING_REJECTED,
                    "Your booking for " + resourceName + " was rejected.",
                    booking.getId());
        }
    }

    private String resolveBookingTargetUserId(Booking booking) {
        if (booking.getUserId() != null && !booking.getUserId().isBlank()) {
            return booking.getUserId();
        }

        if (booking.getUserEmail() == null || booking.getUserEmail().isBlank()) {
            return null;
        }

        return userRepository.findByEmail(booking.getUserEmail().trim().toLowerCase())
                .map(user -> user.getId())
                .orElse(null);
    }

    // Future ticket module integration point.
    public void handleTicketStatusChanged(String userId, String ticketId, TicketStatus status) {
        if (userId == null || userId.isBlank() || ticketId == null || ticketId.isBlank() || status == null) {
            return;
        }

        notificationService.createNotification(
                userId,
                NotificationType.TICKET_UPDATED,
                "Your ticket status changed to " + status.name() + ".",
                ticketId);
    }

    // Future ticket module integration point.
    public void handleTicketCommentAdded(String userId, String ticketId, String authorName) {
        if (userId == null || userId.isBlank() || ticketId == null || ticketId.isBlank()) {
            return;
        }

        String actor = (authorName == null || authorName.isBlank()) ? "Someone" : authorName.trim();
        notificationService.createNotification(
                userId,
                NotificationType.COMMENT_ADDED,
                actor + " added a new comment to your ticket.",
                ticketId);
    }
}
