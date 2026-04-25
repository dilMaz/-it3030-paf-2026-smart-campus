package com.smartcampus.smart_campus_api.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.smartcampus.smart_campus_api.model.Comment;
import com.smartcampus.smart_campus_api.model.TicketPriority;
import com.smartcampus.smart_campus_api.model.TicketStatus;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class IncidentTicketResponse {
    String id;
    String reporterId;
    String reporterName;
    String reporterEmail;
    String title;
    String category;
    String description;
    String resourceOrLocation;
    String contactInformation;
    TicketPriority priority;
    TicketStatus status;
    String rejectionReason;
    String assignedTechnicianId;
    String resolutionNotes;
    List<String> attachmentUrls;
    List<Comment> comments;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
