package com.smartcampus.smart_campus_api.dto;

import java.util.List;

import com.smartcampus.smart_campus_api.model.enums.FacilityStatus;
import com.smartcampus.smart_campus_api.model.enums.FacilityType;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FacilityRequest {
    @NotBlank(message = "name is required")
    private String name;

    @NotNull(message = "type is required")
    private FacilityType type;

    @NotNull(message = "capacity is required")
    @Min(value = 1, message = "capacity must be at least 1")
    private Integer capacity;

    @NotBlank(message = "location is required")
    private String location;

    @NotNull(message = "status is required")
    private FacilityStatus status;

    private String description;

    @NotEmpty(message = "availabilityWindows must include at least one window")
    @Valid
    private List<AvailabilityWindowRequest> availabilityWindows;
}
