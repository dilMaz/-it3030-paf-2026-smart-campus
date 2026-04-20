package com.smartcampus.smart_campus_api.controller;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.smart_campus_api.dto.FacilityRequest;
import com.smartcampus.smart_campus_api.dto.FacilityStatusUpdateRequest;
import com.smartcampus.smart_campus_api.model.Facility;
import com.smartcampus.smart_campus_api.model.User;
import com.smartcampus.smart_campus_api.model.enums.FacilityStatus;
import com.smartcampus.smart_campus_api.model.enums.FacilityType;
import com.smartcampus.smart_campus_api.repository.UserRepository;
import com.smartcampus.smart_campus_api.service.FacilityService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/facilities")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class FacilityController {

    private final FacilityService facilityService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getFacilities(
            @RequestParam(required = false) FacilityType type,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) FacilityStatus status,
            @RequestParam(required = false) String search,
            @AuthenticationPrincipal Object principal) {

        Optional<User> currentUser = resolveCurrentUser(principal);
        if (currentUser.isEmpty()) {
            return unauthorized();
        }

        if (!hasAnyRole(currentUser.get(), "ADMIN", "USER", "TECHNICIAN", "MANAGER")) {
            return forbidden("Insufficient role to view facilities");
        }

        List<Facility> facilities = facilityService.findFacilities(type, location, minCapacity, status, search);
        return ResponseEntity.ok(facilities);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getFacilityById(
            @PathVariable String id,
            @AuthenticationPrincipal Object principal) {

        Optional<User> currentUser = resolveCurrentUser(principal);
        if (currentUser.isEmpty()) {
            return unauthorized();
        }

        if (!hasAnyRole(currentUser.get(), "ADMIN", "USER", "TECHNICIAN", "MANAGER")) {
            return forbidden("Insufficient role to view facilities");
        }

        try {
            return ResponseEntity.ok(facilityService.getFacilityById(id));
        } catch (NoSuchElementException exception) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", exception.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createFacility(
            @Valid @RequestBody FacilityRequest request,
            @AuthenticationPrincipal Object principal) {

        Optional<User> currentUser = resolveCurrentUser(principal);
        if (currentUser.isEmpty()) {
            return unauthorized();
        }

        if (!isAdmin(currentUser.get())) {
            return forbidden("Only admins can create facilities");
        }

        try {
            Facility created = facilityService.createFacility(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateFacility(
            @PathVariable String id,
            @Valid @RequestBody FacilityRequest request,
            @AuthenticationPrincipal Object principal) {

        Optional<User> currentUser = resolveCurrentUser(principal);
        if (currentUser.isEmpty()) {
            return unauthorized();
        }

        if (!isAdmin(currentUser.get())) {
            return forbidden("Only admins can update facilities");
        }

        try {
            return ResponseEntity.ok(facilityService.updateFacility(id, request));
        } catch (NoSuchElementException exception) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", exception.getMessage()));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateFacilityStatus(
            @PathVariable String id,
            @Valid @RequestBody FacilityStatusUpdateRequest request,
            @AuthenticationPrincipal Object principal) {

        Optional<User> currentUser = resolveCurrentUser(principal);
        if (currentUser.isEmpty()) {
            return unauthorized();
        }

        if (!isAdmin(currentUser.get())) {
            return forbidden("Only admins can update facility status");
        }

        try {
            return ResponseEntity.ok(facilityService.updateFacilityStatus(id, request.getStatus()));
        } catch (NoSuchElementException exception) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", exception.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFacility(
            @PathVariable String id,
            @AuthenticationPrincipal Object principal) {

        Optional<User> currentUser = resolveCurrentUser(principal);
        if (currentUser.isEmpty()) {
            return unauthorized();
        }

        if (!isAdmin(currentUser.get())) {
            return forbidden("Only admins can delete facilities");
        }

        try {
            facilityService.deleteFacility(id);
            return ResponseEntity.noContent().build();
        } catch (NoSuchElementException exception) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", exception.getMessage()));
        }
    }

    private Optional<User> resolveCurrentUser(Object principal) {
        if (principal == null) {
            return Optional.empty();
        }

        String email = extractEmail(principal);
        if (email == null || email.isBlank()) {
            return Optional.empty();
        }

        return userRepository.findAllByEmail(email.trim().toLowerCase()).stream().findFirst();
    }

    private String extractEmail(Object principal) {
        if (principal instanceof OAuth2User oauth2User) {
            Object emailAttribute = oauth2User.getAttribute("email");
            return emailAttribute instanceof String value ? value : null;
        }

        if (principal instanceof String email) {
            return email;
        }

        if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        }

        return null;
    }

    private boolean isAdmin(User user) {
        return hasAnyRole(user, "ADMIN");
    }

    private boolean hasAnyRole(User user, String... roles) {
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            return false;
        }

        for (String role : roles) {
            if (user.getRoles().contains(role)) {
                return true;
            }
        }
        return false;
    }

    private ResponseEntity<Map<String, String>> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
    }

    private ResponseEntity<Map<String, String>> forbidden(String message) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", message));
    }
}
