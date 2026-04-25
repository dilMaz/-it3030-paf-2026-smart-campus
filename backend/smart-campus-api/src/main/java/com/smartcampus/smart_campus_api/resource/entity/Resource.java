package com.smartcampus.smart_campus_api.resource.entity;

import java.time.LocalDateTime;

import com.smartcampus.smart_campus_api.resource.enums.ResourceStatus;
import com.smartcampus.smart_campus_api.resource.enums.ResourceType;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@Document(collection = "resources")
public class Resource {

    @Id
    private String id;

    private String name;

    private ResourceType type;

    private Integer capacity;

    private String location;

    private String imageUrl;

    private LocalDateTime availableFrom;

    private LocalDateTime availableTo;

    private ResourceStatus status;

    private String description;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
