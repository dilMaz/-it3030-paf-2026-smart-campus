package com.smartcampus.smart_campus_api.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.smartcampus.smart_campus_api.dto.CreateIncidentTicketRequest;
import com.smartcampus.smart_campus_api.dto.IncidentTicketResponse;
import com.smartcampus.smart_campus_api.dto.UpdateTicketStatusRequest;
import com.smartcampus.smart_campus_api.exception.ResourceNotFoundException;
import com.smartcampus.smart_campus_api.model.IncidentTicket;
import com.smartcampus.smart_campus_api.model.TicketStatus;
import com.smartcampus.smart_campus_api.model.User;
import com.smartcampus.smart_campus_api.repository.IncidentTicketRepository;
import com.smartcampus.smart_campus_api.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class IncidentTicketServiceImpl implements IncidentTicketService {

    private final IncidentTicketRepository incidentTicketRepository;
    private final UserAuthorizationService userAuthorizationService;
    private final NotificationTriggerService notificationTriggerService;
    private final UserRepository userRepository;

    @Override
    public List<IncidentTicketResponse> getTickets(Object principal) {
        User user = userAuthorizationService.requireAuthenticatedUser(principal);

        List<IncidentTicket> tickets;
        if (hasAnyRole(user, "ADMIN", "TECHNICIAN", "MANAGER")) {
            tickets = incidentTicketRepository.findAllByOrderByCreatedAtDesc();
        } else {
            userAuthorizationService.requireAnyRole(user, "USER");
            tickets = incidentTicketRepository.findByReporterIdOrderByCreatedAtDesc(user.getId());
        }

        return tickets.stream()
                .map(ticket -> toResponse(ticket, findReporter(ticket.getReporterId())))
                .toList();
    }

    @Override
    public IncidentTicketResponse getTicketById(String ticketId, Object principal) {
        User user = userAuthorizationService.requireAuthenticatedUser(principal);
        IncidentTicket ticket = findTicketOrThrow(ticketId);

        if (!hasAnyRole(user, "ADMIN", "TECHNICIAN", "MANAGER") && !user.getId().equals(ticket.getReporterId())) {
            throw new IllegalArgumentException("Access denied to this ticket");
        }

        return toResponse(ticket, findReporter(ticket.getReporterId()));
    }

    @Override
    public IncidentTicketResponse createTicket(CreateIncidentTicketRequest request, Object principal) {
        User user = userAuthorizationService.requireAuthenticatedUser(principal);
        userAuthorizationService.requireAnyRole(user, "USER", "ADMIN", "TECHNICIAN", "MANAGER");

        LocalDateTime now = LocalDateTime.now();
        IncidentTicket ticket = IncidentTicket.builder()
                .reporterId(user.getId())
                .title(request.category().trim() + " Incident")
                .category(request.category().trim().toUpperCase())
                .description(request.description().trim())
                .resourceOrLocation(request.resourceOrLocation().trim())
                .contactInformation(request.contactInformation().trim())
                .priority(request.priority())
                .status(TicketStatus.OPEN)
                .attachmentUrls(cleanAttachmentUrls(request.attachmentUrls()))
                .createdAt(now)
                .updatedAt(now)
                .build();

        IncidentTicket saved = incidentTicketRepository.save(ticket);
        return toResponse(saved, user);
    }

    @Override
    public IncidentTicketResponse updateTicketStatus(String ticketId, UpdateTicketStatusRequest request, Object principal) {
        User user = userAuthorizationService.requireAuthenticatedUser(principal);
        userAuthorizationService.requireAnyRole(user, "ADMIN", "TECHNICIAN", "MANAGER");

        IncidentTicket ticket = findTicketOrThrow(ticketId);
        TicketStatus nextStatus = request.status();

        if (nextStatus == TicketStatus.REJECTED && isBlank(request.rejectionReason())) {
            throw new IllegalArgumentException("rejectionReason is required when rejecting a ticket");
        }

        if ((nextStatus == TicketStatus.RESOLVED || nextStatus == TicketStatus.CLOSED) && isBlank(request.resolutionNotes())) {
            throw new IllegalArgumentException("resolutionNotes are required when resolving or closing a ticket");
        }

        ticket.setStatus(nextStatus);
        ticket.setRejectionReason(nextStatus == TicketStatus.REJECTED ? trimToNull(request.rejectionReason()) : null);
        ticket.setResolutionNotes((nextStatus == TicketStatus.RESOLVED || nextStatus == TicketStatus.CLOSED)
                ? trimToNull(request.resolutionNotes())
                : null);

        if (!isBlank(request.assignedTechnicianId())) {
            ticket.setAssignedTechnicianId(request.assignedTechnicianId().trim());
        } else if (hasAnyRole(user, "TECHNICIAN")) {
            ticket.setAssignedTechnicianId(user.getId());
        }

        ticket.setUpdatedAt(LocalDateTime.now());

        IncidentTicket saved = incidentTicketRepository.save(ticket);
        notificationTriggerService.handleTicketStatusChanged(saved.getReporterId(), saved.getId(), saved.getStatus());

        return toResponse(saved, findReporter(saved.getReporterId()));
    }

    private IncidentTicket findTicketOrThrow(String ticketId) {
        return incidentTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found for id: " + ticketId));
    }

    private User findReporter(String reporterId) {
        if (isBlank(reporterId)) {
            return null;
        }
        return userRepository.findById(reporterId).orElse(null);
    }

    private IncidentTicketResponse toResponse(IncidentTicket ticket, User reporter) {
        return IncidentTicketResponse.builder()
                .id(ticket.getId())
                .reporterId(ticket.getReporterId())
                .reporterName(reporter == null ? null : reporter.getName())
                .reporterEmail(reporter == null ? null : reporter.getEmail())
                .title(ticket.getTitle())
                .category(ticket.getCategory())
                .description(ticket.getDescription())
                .resourceOrLocation(ticket.getResourceOrLocation())
                .contactInformation(ticket.getContactInformation())
                .priority(ticket.getPriority())
                .status(ticket.getStatus())
                .rejectionReason(ticket.getRejectionReason())
                .assignedTechnicianId(ticket.getAssignedTechnicianId())
                .resolutionNotes(ticket.getResolutionNotes())
                .attachmentUrls(ticket.getAttachmentUrls())
                .comments(ticket.getComments())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }

    private List<String> cleanAttachmentUrls(List<String> attachmentUrls) {
        if (attachmentUrls == null || attachmentUrls.isEmpty()) {
            return List.of();
        }

        return attachmentUrls.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(String::trim)
                .limit(3)
                .toList();
    }

    private boolean hasAnyRole(User user, String... roles) {
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            return false;
        }

        for (String role : roles) {
            boolean matched = user.getRoles().stream().anyMatch(value -> role.equalsIgnoreCase(value));
            if (matched) {
                return true;
            }
        }
        return false;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String trimToNull(String value) {
        if (isBlank(value)) {
            return null;
        }
        return value.trim();
    }
}
