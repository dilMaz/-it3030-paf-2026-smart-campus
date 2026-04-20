package com.smartcampus.smart_campus_api.resource.dto;

import java.time.LocalTime;

import com.smartcampus.smart_campus_api.resource.enums.ResourceStatus;
import com.smartcampus.smart_campus_api.resource.enums.ResourceType;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResourceRequest {

    @NotBlank(message = "name is required")
    @Size(max = 120, message = "name must not exceed 120 characters")
    private String name;

    @NotNull(message = "type is required")
    private ResourceType type;

    @NotNull(message = "capacity is required")
    @Min(value = 1, message = "capacity must be at least 1")
    private Integer capacity;

    @NotBlank(message = "location is required")
    @Size(max = 160, message = "location must not exceed 160 characters")
    private String location;

    @NotNull(message = "availableFrom is required")
    private LocalTime availableFrom;

    @NotNull(message = "availableTo is required")
    private LocalTime availableTo;

    @NotNull(message = "status is required")
    private ResourceStatus status;

    @Size(max = 1200, message = "description must not exceed 1200 characters")
    private String description;

    @AssertTrue(message = "availableFrom must be before availableTo")
    public boolean isTimeRangeValid() {
        if (availableFrom == null || availableTo == null) {
            return true;
        }
        return availableFrom.isBefore(availableTo);
    }
}
