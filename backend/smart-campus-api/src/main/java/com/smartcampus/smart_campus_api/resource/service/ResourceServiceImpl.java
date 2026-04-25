package com.smartcampus.smart_campus_api.resource.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Stream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

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

    @Value("${app.resource-upload-dir:uploads/resources}")
    private String resourceUploadDir;

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
    public ResourceResponse getResourceById(String id, Object principal) {
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

        Stream<Resource> stream = resourceRepository.findAll().stream();

        if (type != null) {
            stream = stream.filter(resource -> resource.getType() == type);
        }

        if (status != null) {
            stream = stream.filter(resource -> resource.getStatus() == status);
        }

        if (minCapacity != null) {
            stream = stream.filter(resource -> resource.getCapacity() != null && resource.getCapacity() >= minCapacity);
        }

        String normalizedLocation = normalizeBlank(location);
        if (normalizedLocation != null) {
            String locationSearch = normalizedLocation.toLowerCase(Locale.ROOT);
            stream = stream.filter(resource -> containsIgnoreCase(resource.getLocation(), locationSearch));
        }

        return stream
                .sorted(Comparator.comparing(Resource::getName, String.CASE_INSENSITIVE_ORDER))
                .map(this::toResponse)
                .toList();
    }

    @Override
    public ResourceResponse createResource(ResourceRequest request, Object principal) {
        User user = userAuthorizationService.requireAuthenticatedUser(principal);
        userAuthorizationService.requireAnyRole(user, "ADMIN");

        Resource resource = new Resource();
        applyRequest(resource, request);
        LocalDateTime now = LocalDateTime.now();
        resource.setCreatedAt(now);
        resource.setUpdatedAt(now);
        return toResponse(resourceRepository.save(resource));
    }

    @Override
    public ResourceResponse updateResource(String id, ResourceRequest request, Object principal) {
        User user = userAuthorizationService.requireAuthenticatedUser(principal);
        userAuthorizationService.requireAnyRole(user, "ADMIN");

        Resource resource = findResourceOrThrow(id);
        applyRequest(resource, request);
        if (resource.getCreatedAt() == null) {
            resource.setCreatedAt(LocalDateTime.now());
        }
        resource.setUpdatedAt(LocalDateTime.now());
        return toResponse(resourceRepository.save(resource));
    }

    @Override
    public ResourceResponse uploadResourceImage(String id, MultipartFile file, Object principal) {
        User user = userAuthorizationService.requireAuthenticatedUser(principal);
        userAuthorizationService.requireAnyRole(user, "ADMIN");

        Resource resource = findResourceOrThrow(id);
        resource.setImageUrl(storeImage(file, resourceUploadDir, id));
        resource.setUpdatedAt(LocalDateTime.now());
        return toResponse(resourceRepository.save(resource));
    }

    @Override
    public void deleteResource(String id, Object principal) {
        User user = userAuthorizationService.requireAuthenticatedUser(principal);
        userAuthorizationService.requireAnyRole(user, "ADMIN");

        Resource resource = findResourceOrThrow(id);
        resourceRepository.delete(resource);
    }

    private Resource findResourceOrThrow(String id) {
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
                .imageUrl(resource.getImageUrl())
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

    private boolean containsIgnoreCase(String value, String normalizedSearch) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(normalizedSearch);
    }

    private String storeImage(MultipartFile file, String uploadDir, String entityId) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please select an image to upload");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only image files are allowed");
        }

        String extension = extractExtension(file.getOriginalFilename());
        String fileName = entityId + "-" + UUID.randomUUID() + extension;
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(uploadPath);
            Files.copy(file.getInputStream(), uploadPath.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to store image", exception);
        }

        return "/uploads/resources/" + fileName;
    }

    private String extractExtension(String fileName) {
        if (fileName == null || fileName.isBlank() || !fileName.contains(".")) {
            return ".png";
        }

        String extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase(Locale.ROOT);
        return switch (extension) {
            case ".jpg", ".jpeg", ".png", ".gif", ".webp" -> extension;
            default -> ".png";
        };
    }
}
