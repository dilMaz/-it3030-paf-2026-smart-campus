package com.smartcampus.smart_campus_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class AvailabilityWindowRequest {
    @NotBlank(message = "dayOfWeek is required")
    @Pattern(
        regexp = "^(?i)(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)$",
        message = "dayOfWeek must be one of MONDAY...SUNDAY"
    )
    private String dayOfWeek;

    @NotBlank(message = "startTime is required")
    @Pattern(
        regexp = "^([01]\\d|2[0-3]):[0-5]\\d$",
        message = "startTime must be in HH:mm format"
    )
    private String startTime;

    @NotBlank(message = "endTime is required")
    @Pattern(
        regexp = "^([01]\\d|2[0-3]):[0-5]\\d$",
        message = "endTime must be in HH:mm format"
    )
    private String endTime;
}
