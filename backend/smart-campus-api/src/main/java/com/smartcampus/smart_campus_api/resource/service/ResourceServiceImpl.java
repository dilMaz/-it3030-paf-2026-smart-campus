package com.smartcampus.smart_campus_api.resource.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.smartcampus.smart_campus_api.exception.ResourceNotFoundException;
import com.smartcampus.smart_campus_api.model.User;
import com.smartcampus.smart_campus_api.resource.dto.ResourceRequest;
import com.smartcampus.smart_campus_api.resource.dto.ResourceResponse;
import com.smartcampus.smart_campus_api.resource.entity.Resource;
import com.smartcampus.smart_campus_api.resource.enums.ResourceStatus;
import com.smartcampus.smart_campus_api.resource.enums.ResourceType;
import com.smartcampus.smart_campus_api.resource.repository.ResourceRepository;
import com.smartcampus.smart_campus_api.service.UserAuthorizationService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ResourceServiceImpl implements ResourceService {

    private final ResourceRepository resourceRepository;
    private final UserAuthorizationService userAuthorizationService;

    @Override
    public List<ResourceResponse> getAllResources(Object principal) {
        User user = userAuthorizationService.requireAuthenticatedUser(principal);
        userAuthorizationService.requireAnyRole(user, "USER", "ADMIN");

        return resourceRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public ResourceResponse getResourceById(Long id, Object principal) {
        User user = userAuthorizationService.requireAuthenticatedUser(principal);
        userAuthorizationService.requireAnyRole(user, "USER", "ADMIN");

        return toResponse(findResourceOrThrow(id));
    }

    @Override
    public List<ResourceResponse> searchResources(
            ResourceType type,
            String location,
            Integer minCapacity,
            ResourceStatus status,
            Object principal) {

        User user = userAuthorizationService.requireAuthenticatedUser(principal);
        userAuthorizationService.requireAnyRole(user, "USER", "ADMIN");

        if (minCapacity != null && minCapacity < 1) {
            throw new IllegalArgumentException("minCapacity must be at least 1");
        }

        return resourceRepository.search(type, normalizeBlank(location), minCapacity, status)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public ResourceResponse createResource(ResourceRequest request, Object principal) {
        User user = userAuthorizationService.requireAuthenticatedUser(principal);
        userAuthorizationService.requireAnyRole(user, "ADMIN");

        Resource resource = new Resource();
        applyRequest(resource, request);
        return toResponse(resourceRepository.save(resource));
    }

    @Override
    public ResourceResponse updateResource(Long id, ResourceRequest request, Object principal) {
        User user = userAuthorizationService.requireAuthenticatedUser(principal);
        userAuthorizationService.requireAnyRole(user, "ADMIN");

        Resource resource = findResourceOrThrow(id);
        applyRequest(resource, request);
        return toResponse(resourceRepository.save(resource));
    }

    @Override
    public void deleteResource(Long id, Object principal) {
        User user = userAuthorizationService.requireAuthenticatedUser(principal);
        userAuthorizationService.requireAnyRole(user, "ADMIN");

        Resource resource = findResourceOrThrow(id);
        resourceRepository.delete(resource);
    }

    private Resource findResourceOrThrow(Long id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found for id: " + id));
    }

    private void applyRequest(Resource resource, ResourceRequest request) {
        resource.setName(request.getName().trim());
        resource.setType(request.getType());
        resource.setCapacity(request.getCapacity());
        resource.setLocation(request.getLocation().trim());
        resource.setAvailableFrom(request.getAvailableFrom());
        resource.setAvailableTo(request.getAvailableTo());
        resource.setStatus(request.getStatus());
        resource.setDescription(request.getDescription() == null ? null : request.getDescription().trim());
    }

    private ResourceResponse toResponse(Resource resource) {
        return ResourceResponse.builder()
                .id(resource.getId())
                .name(resource.getName())
                .type(resource.getType())
                .capacity(resource.getCapacity())
                .location(resource.getLocation())
                .availableFrom(resource.getAvailableFrom())
                .availableTo(resource.getAvailableTo())
                .status(resource.getStatus())
                .description(resource.getDescription())
                .createdAt(resource.getCreatedAt())
                .updatedAt(resource.getUpdatedAt())
                .build();
    }

    private String normalizeBlank(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
