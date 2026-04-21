package com.smartcampus.smart_campus_api.booking.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.smartcampus.smart_campus_api.booking.dto.BookingResponse;
import com.smartcampus.smart_campus_api.booking.dto.CreateBookingRequest;
import com.smartcampus.smart_campus_api.booking.entity.Booking;
import com.smartcampus.smart_campus_api.booking.enums.BookingStatus;
import com.smartcampus.smart_campus_api.booking.repository.BookingRepository;
import com.smartcampus.smart_campus_api.exception.ResourceNotFoundException;
import com.smartcampus.smart_campus_api.model.User;
import com.smartcampus.smart_campus_api.resource.entity.Resource;
import com.smartcampus.smart_campus_api.resource.enums.ResourceStatus;
import com.smartcampus.smart_campus_api.resource.repository.ResourceRepository;
import com.smartcampus.smart_campus_api.service.NotificationTriggerService;
import com.smartcampus.smart_campus_api.service.UserAuthorizationService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserAuthorizationService userAuthorizationService;
    private final NotificationTriggerService notificationTriggerService;

    @Override
    public List<BookingResponse> getBookings(Object principal) {
        User user = userAuthorizationService.requireAuthenticatedUser(principal);

        List<Booking> bookings;
        if (hasRole(user, "ADMIN")) {
            bookings = bookingRepository.findAllByOrderByCreatedAtDesc();
        } else {
            userAuthorizationService.requireAnyRole(user, "USER");
            bookings = bookingRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        }

        return bookings.stream().map(this::toResponse).toList();
    }

    @Override
    public BookingResponse createBooking(CreateBookingRequest request, Object principal) {
        User user = userAuthorizationService.requireAuthenticatedUser(principal);
        userAuthorizationService.requireAnyRole(user, "USER", "ADMIN");

        Resource resource = resourceRepository.findById(request.resourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found for id: " + request.resourceId()));

        if (resource.getStatus() != ResourceStatus.ACTIVE) {
            throw new IllegalArgumentException("Resource is not available for booking");
        }

        Booking booking = new Booking();
        booking.setResourceId(resource.getId());
        booking.setResourceName(resource.getName());
        booking.setUserId(user.getId());
        booking.setUserEmail(user.getEmail());
        booking.setUserName(user.getName());
        booking.setStartTime(request.startTime());
        booking.setEndTime(request.endTime());
        booking.setPurpose(request.purpose() == null ? null : request.purpose().trim());
        booking.setStatus(BookingStatus.PENDING);
        booking.setCreatedAt(LocalDateTime.now());

        return toResponse(bookingRepository.save(booking));
    }

    @Override
    public BookingResponse approveBooking(String bookingId, Object principal) {
        User user = userAuthorizationService.requireAuthenticatedUser(principal);
        userAuthorizationService.requireAnyRole(user, "ADMIN");

        Booking booking = findBookingOrThrow(bookingId);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalArgumentException("Only pending bookings can be approved");
        }

        booking.setStatus(BookingStatus.APPROVED);
        booking.setReviewedAt(LocalDateTime.now());
        booking.setReviewedBy(user.getEmail());
        Booking savedBooking = bookingRepository.save(booking);
        notificationTriggerService.handleBookingStatusChanged(savedBooking);

        return toResponse(savedBooking);
    }

    @Override
    public BookingResponse rejectBooking(String bookingId, Object principal) {
        User user = userAuthorizationService.requireAuthenticatedUser(principal);
        userAuthorizationService.requireAnyRole(user, "ADMIN");

        Booking booking = findBookingOrThrow(bookingId);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalArgumentException("Only pending bookings can be rejected");
        }

        booking.setStatus(BookingStatus.REJECTED);
        booking.setReviewedAt(LocalDateTime.now());
        booking.setReviewedBy(user.getEmail());
        Booking savedBooking = bookingRepository.save(booking);
        notificationTriggerService.handleBookingStatusChanged(savedBooking);

        return toResponse(savedBooking);
    }

    private Booking findBookingOrThrow(String bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found for id: " + bookingId));
    }

    private boolean hasRole(User user, String role) {
        return user.getRoles() != null && user.getRoles().stream().anyMatch(r -> role.equalsIgnoreCase(r));
    }

    private BookingResponse toResponse(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .resourceId(booking.getResourceId())
                .resourceName(booking.getResourceName())
                .userId(booking.getUserId())
                .userEmail(booking.getUserEmail())
                .userName(booking.getUserName())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .purpose(booking.getPurpose())
                .status(booking.getStatus())
                .createdAt(booking.getCreatedAt())
                .reviewedAt(booking.getReviewedAt())
                .reviewedBy(booking.getReviewedBy())
                .build();
    }
}
