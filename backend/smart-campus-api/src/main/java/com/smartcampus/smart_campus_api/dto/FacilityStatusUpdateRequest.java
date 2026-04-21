package com.smartcampus.smart_campus_api.dto;

import com.smartcampus.smart_campus_api.model.enums.FacilityStatus;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FacilityStatusUpdateRequest {
    @NotNull(message = "status is required")
    private FacilityStatus status;
}
