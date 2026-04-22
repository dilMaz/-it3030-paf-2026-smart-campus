package com.smartcampus.smart_campus_api.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;
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
import org.springframework.security.core.userdetails.UserDetails;
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
import com.smartcampus.smart_campus_api.dto.AuthResponse;
import com.smartcampus.smart_campus_api.dto.RegisterRequest;
import com.smartcampus.smart_campus_api.exception.ForbiddenOperationException;
import com.smartcampus.smart_campus_api.exception.ResourceNotFoundException;
import com.smartcampus.smart_campus_api.exception.UnauthorizedAccessException;
import com.smartcampus.smart_campus_api.model.User;
import com.smartcampus.smart_campus_api.repository.UserRepository;
import com.smartcampus.smart_campus_api.service.JwtService;
import com.smartcampus.smart_campus_api.service.UserAuthorizationService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"}, allowCredentials = "true")
@SuppressWarnings("null")
public class AuthController {

    private static final String DUMMY_BCRYPT_HASH = "$2a$10$7EqJtq98hPqEX7fNZaFWoOeR6Y7BoM4n5v1T7bGTFeoJq6Digw1u6";
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectProvider<JwtService> jwtServiceProvider;
    private final UserAuthorizationService userAuthorizationService;
    @Value("${app.admin.email:}")
    private String adminEmail;
    private static final Set<String> ALLOWED_ROLES = Set.of("USER", "ADMIN", "TECHNICIAN", "MANAGER");

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal Object principal) {
        if (principal == null) {
            throw new UnauthorizedAccessException("Not authenticated");
        }

        if (!(principal instanceof OAuth2User oauth2User)) {
            String email = normalizeEmail(extractEmail(principal));
            if (email == null || email.isBlank()) {
                throw new UnauthorizedAccessException("Unable to resolve authenticated user");
            }

            Optional<User> existingUser = findFirstUserByEmail(email);
            if (existingUser.isEmpty()) {
                throw new UnauthorizedAccessException("Authenticated user is not registered");
            }

            return ResponseEntity.ok(existingUser.get());
        }

        String email = normalizeEmail(oauth2User.getAttribute("email"));
        String name = oauth2User.getAttribute("name");
        String picture = oauth2User.getAttribute("picture");
        String googleId = oauth2User.getAttribute("sub");

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Google account does not provide an email");
        }

        Optional<User> existingUser = findFirstUserByEmail(email);

        User user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
            user.setEmail(email);

            if ((user.getProfileImageUrl() == null || user.getProfileImageUrl().isBlank())
                    && picture != null && !picture.isBlank()) {
                user.setProfileImageUrl(picture);
            }

            if (user.getCreatedAt() == null) {
                user.setCreatedAt(Instant.now());
            }

            user.setUpdatedAt(Instant.now());

            if (isBootstrapAdminEmail(email) && !isAdmin(user)) {
                user.setRoles(List.of("ADMIN"));
            }

            user = userRepository.save(user);
        } else {
            user = new User();
            user.setEmail(email);
            user.setName(name);
            user.setPicture(picture);
            user.setProfileImageUrl(picture);
            user.setGoogleId(googleId);
            user.setRoles(resolveInitialRoles(email));
            user.setCreatedAt(Instant.now());
            user.setUpdatedAt(Instant.now());
            user = userRepository.save(user);
        }

        return ResponseEntity.ok(user);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        String cleanedName = request.name() == null ? null : request.name().trim();
        String normalizedEmail = normalizeEmail(request.email());

        if (cleanedName == null || cleanedName.isBlank()
                || normalizedEmail == null || normalizedEmail.isBlank()
                || request.password() == null || request.password().isBlank()) {
            throw new IllegalArgumentException("Name, email, and password are required");
        }

        if (!request.password().equals(request.confirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        if (!isStrongPassword(request.password())) {
            throw new IllegalArgumentException(
                    "Password must be at least 8 characters and include uppercase, lowercase, number, and special character");
        }

        if (findFirstUserByEmail(normalizedEmail).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }

        User user = new User();
        user.setName(cleanedName);
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRoles(resolveInitialRoles(normalizedEmail));
        user.setCreatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());

        return ResponseEntity.status(HttpStatus.CREATED).body(userRepository.save(user));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpServletRequest) {
        if (request.email() == null || request.email().isBlank()
                || request.password() == null || request.password().isBlank()) {
            throw new IllegalArgumentException("Email and password are required");
        }

        String normalizedEmail = normalizeEmail(request.email());
        List<User> matchedUsers = userRepository.findAllByEmail(normalizedEmail);

        Optional<User> authenticatedUser = matchedUsers.stream()
                .filter(user -> user.getPasswordHash() != null
                        && passwordEncoder.matches(request.password(), user.getPasswordHash()))
                .findFirst();

        if (authenticatedUser.isEmpty()) {
            passwordEncoder.matches(request.password(), DUMMY_BCRYPT_HASH);
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        User loggedInUser = authenticatedUser.get();
        loggedInUser.setEmail(normalizedEmail);
        if (loggedInUser.getCreatedAt() == null) {
            loggedInUser.setCreatedAt(Instant.now());
        }
        loggedInUser.setUpdatedAt(Instant.now());
        loggedInUser = userRepository.save(loggedInUser);

        establishSessionAuthentication(loggedInUser, httpServletRequest);
        JwtService jwtService = jwtServiceProvider.getIfAvailable();
        String token = jwtService == null ? null : jwtService.generateToken(loggedInUser);
        return ResponseEntity.ok(new AuthResponse(loggedInUser, token));
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(@AuthenticationPrincipal Object principal) {
        User currentUser = userAuthorizationService.requireAuthenticatedUser(principal);
        if (!isAdmin(currentUser)) {
            throw new ForbiddenOperationException("Only admins can view all users");
        }

        return ResponseEntity.ok(userRepository.findAll());
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<?> updateUserRole(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal Object principal) {

        User currentUser = userAuthorizationService.requireAuthenticatedUser(principal);
        if (!isAdmin(currentUser)) {
            throw new ForbiddenOperationException("Only admins can update roles");
        }

        String newRole = body.get("role");
        if (newRole == null || !ALLOWED_ROLES.contains(newRole)) {
            throw new IllegalArgumentException("Invalid role");
        }

        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isEmpty()) {
            throw new ResourceNotFoundException("User not found");
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

    private boolean isStrongPassword(String password) {
        if (password == null || password.length() < 8) {
            return false;
        }

        boolean hasUpper = false;
        boolean hasLower = false;
        boolean hasDigit = false;
        boolean hasSpecial = false;

        for (char character : password.toCharArray()) {
            if (Character.isUpperCase(character)) {
                hasUpper = true;
            } else if (Character.isLowerCase(character)) {
                hasLower = true;
            } else if (Character.isDigit(character)) {
                hasDigit = true;
            } else if (!Character.isWhitespace(character)) {
                hasSpecial = true;
            }
        }

        return hasUpper && hasLower && hasDigit && hasSpecial;
    }

    private String extractEmail(Object principal) {
        if (principal instanceof OAuth2User oauth2User) {
            Object email = oauth2User.getAttribute("email");
            return email instanceof String value ? value : null;
        }
        if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        }
        if (principal instanceof String value) {
            return value;
        }
        return null;
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
