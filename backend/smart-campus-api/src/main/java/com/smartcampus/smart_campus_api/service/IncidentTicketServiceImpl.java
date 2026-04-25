package com.smartcampus.smart_campus_api.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.ArrayList;
import java.util.Locale;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.io.IOException;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.smartcampus.smart_campus_api.dto.AssignTechnicianRequest;
import com.smartcampus.smart_campus_api.dto.CreateIncidentTicketRequest;
import com.smartcampus.smart_campus_api.dto.CreateTicketCommentRequest;
import com.smartcampus.smart_campus_api.dto.IncidentTicketResponse;
import com.smartcampus.smart_campus_api.dto.UpdateTicketCommentRequest;
import com.smartcampus.smart_campus_api.dto.UpdateTicketStatusRequest;
import com.smartcampus.smart_campus_api.exception.ForbiddenOperationException;
import com.smartcampus.smart_campus_api.exception.ResourceNotFoundException;
import com.smartcampus.smart_campus_api.model.Comment;
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

    @Value("${app.ticket-upload-dir:uploads/tickets}")
    private String ticketUploadDir;

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

        if (nextStatus == TicketStatus.RESOLVED && ticket.getResolvedAt() == null) {
            ticket.setResolvedAt(LocalDateTime.now());
        }

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

    @Override
    public IncidentTicketResponse assignTechnician(String ticketId, AssignTechnicianRequest request, Object principal) {
        User user = userAuthorizationService.requireAuthenticatedUser(principal);
        userAuthorizationService.requireAnyRole(user, "ADMIN");

        IncidentTicket ticket = findTicketOrThrow(ticketId);
        ticket.setAssignedTechnicianId(request.technicianId().trim());
        ticket.setUpdatedAt(LocalDateTime.now());

        IncidentTicket saved = incidentTicketRepository.save(ticket);
        return toResponse(saved, findReporter(saved.getReporterId()));
    }

    @Override
    public IncidentTicketResponse addComment(String ticketId, CreateTicketCommentRequest request, Object principal) {
        User user = userAuthorizationService.requireAuthenticatedUser(principal);
        IncidentTicket ticket = findTicketOrThrow(ticketId);
        requireTicketAccess(user, ticket);

        Comment comment = Comment.builder()
                .id(UUID.randomUUID().toString())
                .ticketId(ticket.getId())
                .authorId(user.getId())
                .authorName(user.getName())
                .content(request.content().trim())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        ticket.getComments().add(comment);
        ticket.setUpdatedAt(LocalDateTime.now());
        IncidentTicket saved = incidentTicketRepository.save(ticket);
        return toResponse(saved, findReporter(saved.getReporterId()));
    }

    @Override
    public IncidentTicketResponse updateComment(String ticketId, String commentId, UpdateTicketCommentRequest request, Object principal) {
        User user = userAuthorizationService.requireAuthenticatedUser(principal);
        IncidentTicket ticket = findTicketOrThrow(ticketId);
        requireTicketAccess(user, ticket);

        Comment comment = ticket.getComments()
                .stream()
                .filter(item -> commentId != null && commentId.equals(item.getId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        if (!user.getId().equals(comment.getAuthorId()) && !hasAnyRole(user, "ADMIN")) {
            throw new ForbiddenOperationException("Only the comment owner can edit this comment");
        }

        comment.setContent(request.content().trim());
        comment.setUpdatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());

        IncidentTicket saved = incidentTicketRepository.save(ticket);
        return toResponse(saved, findReporter(saved.getReporterId()));
    }

    @Override
    public IncidentTicketResponse deleteComment(String ticketId, String commentId, Object principal) {
        User user = userAuthorizationService.requireAuthenticatedUser(principal);
        IncidentTicket ticket = findTicketOrThrow(ticketId);
        requireTicketAccess(user, ticket);

        Comment comment = ticket.getComments()
                .stream()
                .filter(item -> commentId != null && commentId.equals(item.getId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        if (!user.getId().equals(comment.getAuthorId()) && !hasAnyRole(user, "ADMIN")) {
            throw new ForbiddenOperationException("Only the comment owner can delete this comment");
        }

        ticket.getComments().removeIf(item -> commentId.equals(item.getId()));
        ticket.setUpdatedAt(LocalDateTime.now());

        IncidentTicket saved = incidentTicketRepository.save(ticket);
        return toResponse(saved, findReporter(saved.getReporterId()));
    }

    @Override
    public byte[] generateResponseTimeReport(Object principal) {
        User user = userAuthorizationService.requireAuthenticatedUser(principal);
        userAuthorizationService.requireAnyRole(user, "ADMIN", "MANAGER");

        List<IncidentTicket> tickets = incidentTicketRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .filter(t -> t.getResolvedAt() != null && t.getCreatedAt() != null)
                .toList();

        try (java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
             java.io.PrintWriter writer = new java.io.PrintWriter(out)) {

            writer.println("Ticket ID,Category,Priority,Created At,Resolved At,Response Time (Hours),Performance Category");

            for (IncidentTicket t : tickets) {
                java.time.Duration duration = java.time.Duration.between(t.getCreatedAt(), t.getResolvedAt());
                long hours = duration.toHours();
                String category = "Green (Good)";
                if (hours > 24) {
                    category = "Red (Bad)";
                } else if (hours > 2) {
                    category = "Yellow (Mid)";
                }

                writer.printf("%s,%s,%s,%s,%s,%d,%s%n",
                        t.getId(),
                        t.getCategory(),
                        t.getPriority(),
                        t.getCreatedAt(),
                        t.getResolvedAt(),
                        hours,
                        category);
            }
            writer.flush();
            return out.toByteArray();

        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to generate report", e);
        }
    }

    @Override
    public List<String> uploadAttachments(Object principal, List<MultipartFile> files) {
        User user = userAuthorizationService.requireAuthenticatedUser(principal);
        userAuthorizationService.requireAnyRole(user, "USER", "ADMIN", "TECHNICIAN", "MANAGER");

        if (files == null || files.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please select images to upload");
        }

        if (files.size() > 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only up to 3 attachments are allowed");
        }

        Path uploadPath = Paths.get(ticketUploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadPath);
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to prepare upload directory", exception);
        }

        List<String> uploadedUrls = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only image files are allowed");
            }

            if (file.getSize() > 5 * 1024 * 1024) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each attachment must be <= 5MB");
            }

            String extension = extractImageExtension(file.getOriginalFilename());
            String fileName = user.getId() + "-" + UUID.randomUUID() + extension;

            try {
                Files.copy(file.getInputStream(), uploadPath.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException exception) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to store attachment", exception);
            }

            uploadedUrls.add("/uploads/tickets/" + fileName);
        }

        return uploadedUrls.stream().limit(3).toList();
    }

    private IncidentTicket findTicketOrThrow(String ticketId) {
        return incidentTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found for id: " + ticketId));
    }

    private void requireTicketAccess(User user, IncidentTicket ticket) {
        if (hasAnyRole(user, "ADMIN", "TECHNICIAN", "MANAGER")) {
            return;
        }

        userAuthorizationService.requireAnyRole(user, "USER");
        if (!user.getId().equals(ticket.getReporterId())) {
            throw new ForbiddenOperationException("Access denied to this ticket");
        }
    }

    private User findReporter(String reporterId) {
        if (isBlank(reporterId)) {
            return null;
        }
        return userRepository.findById(reporterId).orElse(null);
    }

    private User findTechnician(String technicianId) {
        if (isBlank(technicianId)) {
            return null;
        }
        return userRepository.findById(technicianId.trim()).orElse(null);
    }

    private IncidentTicketResponse toResponse(IncidentTicket ticket, User reporter) {
        User technician = findTechnician(ticket.getAssignedTechnicianId());
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
                .assignedTechnicianName(technician == null ? null : technician.getName())
                .assignedTechnicianEmail(technician == null ? null : technician.getEmail())
                .assignedTechnicianType(technician == null ? null : technician.getTechnicianType())
                .resolutionNotes(ticket.getResolutionNotes())
                .attachmentUrls(ticket.getAttachmentUrls())
                .comments(ticket.getComments())
                .resolvedAt(ticket.getResolvedAt())
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

    private String extractImageExtension(String fileName) {
        if (fileName == null || fileName.isBlank() || !fileName.contains(".")) {
            return ".png";
        }

        String extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase(Locale.ROOT);
        return switch (extension) {
            case ".jpg", ".jpeg", ".png", ".gif", ".webp" -> extension;
            default -> ".png";
        };
    }
}
