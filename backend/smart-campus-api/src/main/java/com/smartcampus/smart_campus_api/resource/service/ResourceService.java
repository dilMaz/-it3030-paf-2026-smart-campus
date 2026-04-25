package com.smartcampus.smart_campus_api.resource.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.smartcampus.smart_campus_api.resource.dto.ResourceRequest;
import com.smartcampus.smart_campus_api.resource.dto.ResourceResponse;
import com.smartcampus.smart_campus_api.resource.enums.ResourceStatus;
import com.smartcampus.smart_campus_api.resource.enums.ResourceType;

public interface ResourceService {
    List<ResourceResponse> getAllResources(Object principal);
    ResourceResponse getResourceById(String id, Object principal);
    List<ResourceResponse> searchResources(ResourceType type, String location, Integer minCapacity, ResourceStatus status, Object principal);
    ResourceResponse createResource(ResourceRequest request, Object principal);
    ResourceResponse updateResource(String id, ResourceRequest request, Object principal);
    ResourceResponse uploadResourceImage(String id, MultipartFile file, Object principal);
    void deleteResource(String id, Object principal);
}
