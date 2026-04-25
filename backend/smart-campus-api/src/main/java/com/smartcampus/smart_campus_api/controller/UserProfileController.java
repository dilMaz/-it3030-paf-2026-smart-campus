package com.smartcampus.smart_campus_api.controller;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.smartcampus.smart_campus_api.dto.UpdateProfileRequest;
import com.smartcampus.smart_campus_api.dto.UserProfileResponse;
import com.smartcampus.smart_campus_api.service.UserProfileService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"}, allowCredentials = "true")
public class UserProfileController {

    private final UserProfileService userProfileService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMyProfile(@AuthenticationPrincipal Object principal) {
        return ResponseEntity.ok(userProfileService.getCurrentProfile(principal));
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateMyProfile(
            @AuthenticationPrincipal Object principal,
            @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userProfileService.updateCurrentProfile(principal, request));
    }

    @PostMapping(value = "/upload-avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserProfileResponse> uploadAvatar(
            @AuthenticationPrincipal Object principal,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(userProfileService.uploadAvatar(principal, file));
    }

    @GetMapping
    public ResponseEntity<List<UserProfileResponse>> getAllProfiles(@AuthenticationPrincipal Object principal) {
        return ResponseEntity.ok(userProfileService.getAllProfiles(principal));
    }
}
