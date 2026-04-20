package com.smartcampus.smart_campus_api.resource.dto;

import java.time.LocalDateTime;
import java.time.LocalTime;

import com.smartcampus.smart_campus_api.resource.enums.ResourceStatus;
import com.smartcampus.smart_campus_api.resource.enums.ResourceType;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ResourceResponse {
    Long id;
    String name;
    ResourceType type;
    Integer capacity;
    String location;
    LocalTime availableFrom;
    LocalTime availableTo;
    ResourceStatus status;
    String description;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
