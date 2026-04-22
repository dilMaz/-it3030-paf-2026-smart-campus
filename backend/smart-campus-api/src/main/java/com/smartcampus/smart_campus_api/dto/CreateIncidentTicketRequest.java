package com.smartcampus.smart_campus_api.dto;

import java.util.List;

import com.smartcampus.smart_campus_api.model.TicketPriority;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateIncidentTicketRequest(
        @NotBlank(message = "resourceOrLocation is required")
        @Size(max = 150, message = "resourceOrLocation must not exceed 150 characters")
        String resourceOrLocation,
        @NotBlank(message = "category is required")
        @Size(max = 80, message = "category must not exceed 80 characters")
        String category,
        @NotBlank(message = "contactInformation is required")
        @Size(max = 120, message = "contactInformation must not exceed 120 characters")
        String contactInformation,
        @NotBlank(message = "description is required")
        @Size(max = 1500, message = "description must not exceed 1500 characters")
        String description,
        @NotNull(message = "priority is required")
        TicketPriority priority,
        @Size(max = 3, message = "Only up to 3 attachments are allowed")
        List<@Size(max = 300, message = "Attachment reference must not exceed 300 characters") String> attachmentUrls) {
}
