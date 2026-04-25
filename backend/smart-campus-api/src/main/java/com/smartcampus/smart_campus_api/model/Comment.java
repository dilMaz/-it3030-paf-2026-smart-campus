package com.smartcampus.smart_campus_api.model;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Comment {
    private String id;
    private String ticketId;
    private String authorId; // ID of the user or staff who made the comment
    private String authorName; // Can be useful to display without fetching user again
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
