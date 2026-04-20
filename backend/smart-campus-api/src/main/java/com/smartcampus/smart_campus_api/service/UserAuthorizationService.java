package com.smartcampus.smart_campus_api.service;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import com.smartcampus.smart_campus_api.exception.ForbiddenOperationException;
import com.smartcampus.smart_campus_api.exception.UnauthorizedAccessException;
import com.smartcampus.smart_campus_api.model.User;
import com.smartcampus.smart_campus_api.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserAuthorizationService {

    private final UserRepository userRepository;

    public User requireAuthenticatedUser(Object principal) {
        if (principal == null) {
            throw new UnauthorizedAccessException("Authentication is required");
        }

        String email = extractEmail(principal);
        if (email == null || email.isBlank()) {
            throw new UnauthorizedAccessException("Unable to resolve authenticated user");
        }

        return userRepository.findAllByEmail(email.trim().toLowerCase())
                .stream()
                .findFirst()
                .orElseThrow(() -> new UnauthorizedAccessException("Authenticated user is not registered"));
    }

    public void requireAnyRole(User user, String... allowedRoles) {
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            throw new ForbiddenOperationException("No roles assigned for this operation");
        }

        Set<String> normalizedUserRoles = user.getRoles().stream()
                .map(this::normalizeRole)
                .collect(Collectors.toSet());

        boolean allowed = Arrays.stream(allowedRoles)
                .map(this::normalizeRole)
                .anyMatch(normalizedUserRoles::contains);

        if (!allowed) {
            throw new ForbiddenOperationException("Insufficient role privileges for this operation");
        }
    }

    private String normalizeRole(String role) {
        if (role == null) {
            return "";
        }

        String normalized = role.trim().toUpperCase(Locale.ROOT);
        if (normalized.startsWith("ROLE_")) {
            return normalized.substring("ROLE_".length());
        }

        return normalized;
    }

    private String extractEmail(Object principal) {
        if (principal instanceof OAuth2User oauth2User) {
            Object emailAttribute = oauth2User.getAttribute("email");
            return emailAttribute instanceof String value ? value : null;
        }
        if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        }
        if (principal instanceof String value) {
            return value;
        }
        return null;
    }
}
