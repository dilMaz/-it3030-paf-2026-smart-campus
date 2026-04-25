package com.smartcampus.smart_campus_api.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "incident_tickets")
public class IncidentTicket {

    @Id
    private String id;
    
    private String reporterId; // User who created the ticket
    private String title;
    private String category; // e.g., "PLUMBING", "ELECTRICAL", "IT_SUPPORT", "CLEANING"
    private String description;
    private String resourceOrLocation; // e.g., "Room 302", "Projector A"
    private String contactInformation; // Phone or email of reporter
    
    @Builder.Default
    private TicketPriority priority = TicketPriority.MEDIUM;
    
    @Builder.Default
    private TicketStatus status = TicketStatus.OPEN;
    
    private String rejectionReason; // Filled if status is REJECTED
    
    private String assignedTechnicianId; // ID of the technician handling it
    private String resolutionNotes; // Notes added by technician when resolved
    
    @Builder.Default
    private List<String> attachmentUrls = new ArrayList<>(); // Up to 3 image URLs
    
    @Builder.Default
    private List<Comment> comments = new ArrayList<>(); // Embedded comments or reference IDs, embedding might be easier for Mongo if list is small
    
    private LocalDateTime resolvedAt;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
