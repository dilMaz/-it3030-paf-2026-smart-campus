package com.smartcampus.smart_campus_api.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.smartcampus.smart_campus_api.dto.UpdateProfileRequest;
import com.smartcampus.smart_campus_api.dto.UserProfileResponse;
import com.smartcampus.smart_campus_api.model.User;
import com.smartcampus.smart_campus_api.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserRepository userRepository;
    private final UserAuthorizationService userAuthorizationService;

    @Value("${app.avatar-upload-dir:uploads/avatars}")
    private String avatarUploadDir;

    public UserProfileResponse getCurrentProfile(Object principal) {
        User user = userAuthorizationService.requireAuthenticatedUser(principal);
        initializeTimestampsIfMissing(user);
        return toProfileResponse(user);
    }

    public UserProfileResponse updateCurrentProfile(Object principal, UpdateProfileRequest request) {
        User user = userAuthorizationService.requireAuthenticatedUser(principal);
        initializeTimestampsIfMissing(user);

        String nextName = request.name() == null ? "" : request.name().trim();
        String nextBio = request.bio() == null ? "" : request.bio().trim();
        String nextEmail = request.email() == null ? "" : request.email().trim().toLowerCase(Locale.ROOT);

        if (!nextName.isBlank()) {
            user.setName(nextName);
        }

        user.setBio(nextBio.isBlank() ? null : nextBio);

        if (isAdmin(user) && !nextEmail.isBlank() && !nextEmail.equalsIgnoreCase(user.getEmail())) {
            boolean emailTaken = userRepository.findAllByEmail(nextEmail).stream()
                    .anyMatch(existing -> !existing.getId().equals(user.getId()));
            if (emailTaken) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
            }
            user.setEmail(nextEmail);
        }

        user.setUpdatedAt(Instant.now());
        return toProfileResponse(userRepository.save(user));
    }

    public UserProfileResponse uploadAvatar(Object principal, MultipartFile file) {
        User user = userAuthorizationService.requireAuthenticatedUser(principal);
        initializeTimestampsIfMissing(user);

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please select an image to upload");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only image files are allowed");
        }

        String extension = extractExtension(file.getOriginalFilename());
        String fileName = user.getId() + "-" + UUID.randomUUID() + extension;

        Path uploadPath = Paths.get(avatarUploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadPath);
            Files.copy(file.getInputStream(), uploadPath.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to store avatar image", exception);
        }

        user.setProfileImageUrl("/uploads/avatars/" + fileName);
        user.setUpdatedAt(Instant.now());
        return toProfileResponse(userRepository.save(user));
    }

    public List<UserProfileResponse> getAllProfiles(Object principal) {
        User currentUser = userAuthorizationService.requireAuthenticatedUser(principal);
        userAuthorizationService.requireAnyRole(currentUser, "ADMIN");

        return userRepository.findAll().stream()
                .peek(this::initializeTimestampsIfMissing)
                .map(this::toProfileResponse)
                .toList();
    }

    private UserProfileResponse toProfileResponse(User user) {
        String profileImage = user.getProfileImageUrl();
        if ((profileImage == null || profileImage.isBlank()) && user.getPicture() != null && !user.getPicture().isBlank()) {
            profileImage = user.getPicture();
        }

        return new UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                resolveRole(user),
                profileImage,
                user.getBio(),
                user.getCreatedAt(),
                user.getUpdatedAt());
    }

    private String resolveRole(User user) {
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            return "USER";
        }

        String firstRole = user.getRoles().get(0);
        if (firstRole == null || firstRole.isBlank()) {
            return "USER";
        }

        return firstRole.replace("ROLE_", "").toUpperCase(Locale.ROOT);
    }

    private boolean isAdmin(User user) {
        return user.getRoles() != null && user.getRoles().stream()
                .filter(role -> role != null && !role.isBlank())
                .map(role -> role.replace("ROLE_", "").toUpperCase(Locale.ROOT))
                .anyMatch("ADMIN"::equals);
    }

    private void initializeTimestampsIfMissing(User user) {
        boolean changed = false;
        Instant now = Instant.now();

        if (user.getCreatedAt() == null) {
            user.setCreatedAt(now);
            changed = true;
        }

        if (user.getUpdatedAt() == null) {
            user.setUpdatedAt(now);
            changed = true;
        }

        if (changed) {
            userRepository.save(user);
        }
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
