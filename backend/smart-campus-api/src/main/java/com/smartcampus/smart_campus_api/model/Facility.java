package com.smartcampus.smart_campus_api.model;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.smartcampus.smart_campus_api.model.enums.FacilityStatus;
import com.smartcampus.smart_campus_api.model.enums.FacilityType;

import lombok.Data;

@Data
@Document(collection = "facilities")
public class Facility {
    @Id
    private String id;
    private String name;
    private FacilityType type;
    private Integer capacity;
    private String location;
    private FacilityStatus status;
    private String description;
    private List<AvailabilityWindow> availabilityWindows;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
