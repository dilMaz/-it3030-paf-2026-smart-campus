package com.smartcampus.smart_campus_api.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Set;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.smartcampus.smart_campus_api.model.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private static final String INSECURE_DEFAULT_SECRET = "smart-campus-dev-secret-key";
    private static final Set<String> NON_ENFORCED_PROFILES = Set.of("local", "test", "dev");

    private final SecretKey signingKey;
    private final long jwtExpiration;

    public JwtService(
            @Value("${jwt.secret:smart-campus-dev-secret-key}") String secret,
            @Value("${spring.profiles.active:}") String activeProfiles,
            @Value("${jwt.expiration:86400000}") long jwtExpiration) {
        String normalizedSecret = normalizeSecret(secret);
        validateSecret(normalizedSecret, activeProfiles);
        this.signingKey = buildSigningKey(normalizedSecret);
        this.jwtExpiration = jwtExpiration;
    }

    public String generateToken(User user) {
        long now = System.currentTimeMillis();

        return Jwts.builder()
                .subject(user.getEmail())
                .claim("roles", user.getRoles() == null ? List.of() : user.getRoles())
                .issuedAt(new Date(now))
                .expiration(new Date(now + jwtExpiration))
                .signWith(signingKey)
                .compact();
    }

    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = extractAllClaims(token);
            Date expiration = claims.getExpiration();
            return expiration != null && expiration.after(new Date());
        } catch (RuntimeException exception) {
            return false;
        }
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private String normalizeSecret(String rawSecret) {
        if (rawSecret == null) {
            return INSECURE_DEFAULT_SECRET;
        }

        String normalized = rawSecret.trim();
        if (normalized.isBlank() || normalized.startsWith("${")) {
            return INSECURE_DEFAULT_SECRET;
        }

        return normalized;
    }

    private void validateSecret(String secret, String activeProfiles) {
        boolean hasActiveProfiles = activeProfiles != null && !activeProfiles.isBlank();
        boolean hasNonEnforcedProfile = hasActiveProfiles && Arrays.stream(activeProfiles.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .anyMatch(NON_ENFORCED_PROFILES::contains);

        if (hasActiveProfiles && !hasNonEnforcedProfile && INSECURE_DEFAULT_SECRET.equals(secret)) {
            throw new IllegalStateException("jwt.secret must be configured for non-local profiles");
        }
    }

    private SecretKey buildSigningKey(String rawSecret) {
        String secret = rawSecret == null ? INSECURE_DEFAULT_SECRET : rawSecret.trim();

        // Support both plain text secrets and base64 secrets while ensuring a stable 256-bit key.
        try {
            byte[] decoded = Decoders.BASE64.decode(secret);
            if (decoded.length >= 32) {
                return Keys.hmacShaKeyFor(decoded);
            }
        } catch (RuntimeException ignored) {
            // Fallback to hashing plain text secret.
        }

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = digest.digest(secret.getBytes(StandardCharsets.UTF_8));
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Unable to initialize JWT signing key", exception);
        }
    }
}
