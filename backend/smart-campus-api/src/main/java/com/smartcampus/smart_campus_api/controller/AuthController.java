package com.smartcampus.smart_campus_api.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.smart_campus_api.dto.LoginRequest;
import com.smartcampus.smart_campus_api.dto.RegisterRequest;
import com.smartcampus.smart_campus_api.model.User;
import com.smartcampus.smart_campus_api.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    @Value("${app.admin.email:}")
    private String adminEmail;
    private static final Set<String> ALLOWED_ROLES = Set.of("USER", "ADMIN", "TECHNICIAN", "MANAGER");

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        String email = normalizeEmail(principal.getAttribute("email"));
        String name = principal.getAttribute("name");
        String picture = principal.getAttribute("picture");
        String googleId = principal.getAttribute("sub");

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Google account does not provide an email"));
        }

        Optional<User> existingUser = findFirstUserByEmail(email);

        User user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
            if (isBootstrapAdminEmail(email) && !isAdmin(user)) {
                user.setRoles(List.of("ADMIN"));
                user = userRepository.save(user);
            }
        } else {
            user = new User();
            user.setEmail(email);
            user.setName(name);
            user.setPicture(picture);
            user.setGoogleId(googleId);
            user.setRoles(resolveInitialRoles(email));
            user = userRepository.save(user);
        }

        return ResponseEntity.ok(user);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.email());

        if (request.name() == null || request.name().isBlank()
                || normalizedEmail == null || normalizedEmail.isBlank()
                || request.password() == null || request.password().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name, email, and password are required"));
        }

        if (!request.password().equals(request.confirmPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Passwords do not match"));
        }

        if (findFirstUserByEmail(normalizedEmail).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email already registered"));
        }

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRoles(resolveInitialRoles(normalizedEmail));

        return ResponseEntity.status(HttpStatus.CREATED).body(userRepository.save(user));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletRequest httpServletRequest) {
        if (request.email() == null || request.email().isBlank()
                || request.password() == null || request.password().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required"));
        }

        String normalizedEmail = normalizeEmail(request.email());
        List<User> matchedUsers = userRepository.findAllByEmail(normalizedEmail);

        Optional<User> authenticatedUser = matchedUsers.stream()
                .filter(user -> user.getPasswordHash() != null
                        && passwordEncoder.matches(request.password(), user.getPasswordHash()))
                .findFirst();

        if (authenticatedUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password"));
        }

        User loggedInUser = authenticatedUser.get();
        establishSessionAuthentication(loggedInUser, httpServletRequest);
        return ResponseEntity.ok(loggedInUser);
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(@AuthenticationPrincipal OAuth2User principal) {
        Optional<User> currentUser = resolveCurrentUser(principal);
        if (currentUser.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        if (!isAdmin(currentUser.get())) {
            return ResponseEntity.status(403).body(Map.of("error", "Only admins can view all users"));
        }

        return ResponseEntity.ok(userRepository.findAll());
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<?> updateUserRole(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal OAuth2User principal) {

        Optional<User> currentUser = resolveCurrentUser(principal);
        if (currentUser.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        if (!isAdmin(currentUser.get())) {
            return ResponseEntity.status(403).body(Map.of("error", "Only admins can update roles"));
        }

        String newRole = body.get("role");
        if (newRole == null || !ALLOWED_ROLES.contains(newRole)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role"));
        }

        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = optionalUser.get();
        user.setRoles(List.of(newRole));
        userRepository.save(user);

        return ResponseEntity.ok(user);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) {
        new SecurityContextLogoutHandler().logout(request, response, authentication);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    private Optional<User> resolveCurrentUser(OAuth2User principal) {
        if (principal == null) {
            return Optional.empty();
        }

        String email = normalizeEmail(principal.getAttribute("email"));
        if (email == null || email.isBlank()) {
            return Optional.empty();
        }

        return findFirstUserByEmail(email);
    }

    private Optional<User> findFirstUserByEmail(String email) {
        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail == null || normalizedEmail.isBlank()) {
            return Optional.empty();
        }

        List<User> matchedUsers = userRepository.findAllByEmail(normalizedEmail);
        if (matchedUsers.isEmpty()) {
            return Optional.empty();
        }

        return Optional.of(matchedUsers.get(0));
    }

    private List<String> resolveInitialRoles(String email) {
        if (isBootstrapAdminEmail(email)) {
            return List.of("ADMIN");
        }

        return List.of("USER");
    }

    private boolean isBootstrapAdminEmail(String email) {
        String configuredAdminEmail = normalizeEmail(adminEmail);
        String normalizedEmail = normalizeEmail(email);

        return configuredAdminEmail != null && !configuredAdminEmail.isBlank()
                && normalizedEmail != null && normalizedEmail.equals(configuredAdminEmail);
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }

        return email.trim().toLowerCase();
    }

    private boolean isAdmin(User user) {
        return user.getRoles() != null && user.getRoles().contains("ADMIN");
    }

    private void establishSessionAuthentication(User user, HttpServletRequest request) {
        List<GrantedAuthority> authorities = (user.getRoles() == null ? List.<String>of() : user.getRoles()).stream()
                .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
                .map(SimpleGrantedAuthority::new)
                .map(GrantedAuthority.class::cast)
                .toList();

        Authentication authentication = new UsernamePasswordAuthenticationToken(
                normalizeEmail(user.getEmail()),
                null,
                authorities);

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        request.getSession(true).setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);
    }
}
