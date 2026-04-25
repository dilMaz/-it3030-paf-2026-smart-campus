package com.smartcampus.smart_campus_api.service;

import java.io.IOException;
import java.time.DateTimeException;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.DayOfWeek;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.smartcampus.smart_campus_api.dto.AvailabilityWindowRequest;
import com.smartcampus.smart_campus_api.dto.FacilityRequest;
import com.smartcampus.smart_campus_api.model.AvailabilityWindow;
import com.smartcampus.smart_campus_api.model.Facility;
import com.smartcampus.smart_campus_api.model.enums.FacilityStatus;
import com.smartcampus.smart_campus_api.model.enums.FacilityType;
import com.smartcampus.smart_campus_api.repository.FacilityRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class FacilityService {

    private final FacilityRepository facilityRepository;

    @Value("${app.facility-upload-dir:uploads/facilities}")
    private String facilityUploadDir;

    public List<Facility> findFacilities(
            FacilityType type,
            String location,
            Integer minCapacity,
            FacilityStatus status,
            String search) {

        Stream<Facility> stream = facilityRepository.findAll().stream();

        if (type != null) {
            stream = stream.filter(facility -> facility.getType() == type);
        }

        if (status != null) {
            stream = stream.filter(facility -> facility.getStatus() == status);
        }

        if (minCapacity != null) {
            stream = stream.filter(facility -> facility.getCapacity() != null && facility.getCapacity() >= minCapacity);
        }

        if (location != null && !location.isBlank()) {
            String normalizedLocation = location.toLowerCase(Locale.ROOT);
            stream = stream.filter(facility -> containsIgnoreCase(facility.getLocation(), normalizedLocation));
        }

        if (search != null && !search.isBlank()) {
            String normalizedSearch = search.toLowerCase(Locale.ROOT);
            stream = stream.filter(facility ->
                    containsIgnoreCase(facility.getName(), normalizedSearch)
                    || containsIgnoreCase(facility.getLocation(), normalizedSearch)
                    || containsIgnoreCase(facility.getDescription(), normalizedSearch));
        }

        return stream
                .sorted(Comparator.comparing(Facility::getName, String.CASE_INSENSITIVE_ORDER))
                .collect(Collectors.toList());
    }

    public Facility getFacilityById(String id) {
        return facilityRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Facility not found"));
    }

    public Facility createFacility(FacilityRequest request) {
        Facility facility = new Facility();
        populateFacilityFields(facility, request);
        LocalDateTime now = LocalDateTime.now();
        facility.setCreatedAt(now);
        facility.setUpdatedAt(now);
        return facilityRepository.save(facility);
    }

    public Facility updateFacility(String id, FacilityRequest request) {
        Facility facility = getFacilityById(id);
        populateFacilityFields(facility, request);
        facility.setUpdatedAt(LocalDateTime.now());
        return facilityRepository.save(facility);
    }

    public Facility updateFacilityStatus(String id, FacilityStatus status) {
        Facility facility = getFacilityById(id);
        facility.setStatus(status);
        facility.setUpdatedAt(LocalDateTime.now());
        return facilityRepository.save(facility);
    }

    public Facility uploadFacilityImage(String id, MultipartFile file) {
        Facility facility = getFacilityById(id);
        facility.setImageUrl(storeImage(file, facilityUploadDir, id));
        facility.setUpdatedAt(LocalDateTime.now());
        return facilityRepository.save(facility);
    }

    public void deleteFacility(String id) {
        if (!facilityRepository.existsById(id)) {
            throw new NoSuchElementException("Facility not found");
        }
        facilityRepository.deleteById(id);
    }

    private void populateFacilityFields(Facility facility, FacilityRequest request) {
        facility.setName(request.getName().trim());
        facility.setType(request.getType());
        facility.setCapacity(request.getCapacity());
        facility.setLocation(request.getLocation().trim());
        facility.setStatus(request.getStatus());
        facility.setDescription(request.getDescription() == null ? null : request.getDescription().trim());
        facility.setAvailabilityWindows(mapAvailabilityWindows(request.getAvailabilityWindows()));
    }

    private List<AvailabilityWindow> mapAvailabilityWindows(List<AvailabilityWindowRequest> requests) {
        return requests.stream()
                .map(this::mapAvailabilityWindow)
                .collect(Collectors.toList());
    }

    private AvailabilityWindow mapAvailabilityWindow(AvailabilityWindowRequest request) {
        String day = normalizeDayOfWeek(request.getDayOfWeek());
        String startTime = request.getStartTime();
        String endTime = request.getEndTime();
        validateTimeWindow(startTime, endTime);

        AvailabilityWindow window = new AvailabilityWindow();
        window.setDayOfWeek(day);
        window.setStartTime(startTime);
        window.setEndTime(endTime);
        return window;
    }

    private String normalizeDayOfWeek(String rawDay) {
        String normalized = rawDay.trim().toUpperCase(Locale.ROOT);
        try {
            DayOfWeek.valueOf(normalized);
            return normalized;
        } catch (DateTimeException exception) {
            throw new IllegalArgumentException("Invalid dayOfWeek value: " + rawDay);
        }
    }

    private void validateTimeWindow(String startTime, String endTime) {
        try {
            LocalTime start = LocalTime.parse(startTime);
            LocalTime end = LocalTime.parse(endTime);
            if (!start.isBefore(end)) {
                throw new IllegalArgumentException("availability window startTime must be before endTime");
            }
        } catch (DateTimeException exception) {
            throw new IllegalArgumentException("Invalid time format in availability windows");
        }
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

        return "/uploads/facilities/" + fileName;
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
