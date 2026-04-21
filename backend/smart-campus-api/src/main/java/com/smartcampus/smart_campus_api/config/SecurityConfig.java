package com.smartcampus.smart_campus_api.config;

import java.net.URI;
import java.util.Set;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final Set<String> FRONTEND_ORIGINS = Set.of(
            "http://localhost:5173",
            "http://localhost:5174");

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/register", "/api/auth/login", "/oauth2/**", "/login/**", "/error").permitAll()
                .requestMatchers(
                    "/api/auth/me",
                    "/api/auth/logout",
                    "/api/auth/users/**",
                    "/api/notifications/**",
                    "/api/facilities/**",
                    "/api/resources/**",
                    "/api/bookings/**"
                ).authenticated()
                .anyRequest().permitAll()
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
            )
            .oauth2Login(oauth2 -> oauth2
                .successHandler((request, response, authentication) -> {
                    String frontendBaseUrl = resolveFrontendBaseUrl(request);
                    response.sendRedirect(frontendBaseUrl + "/auth/callback");
                })
                .failureHandler((request, response, exception) -> {
                    String frontendBaseUrl = resolveFrontendBaseUrl(request);
                    response.sendRedirect(frontendBaseUrl + "/login?error");
                })
            );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(java.util.List.of("http://localhost:5173", "http://localhost:5174"));
        configuration.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(java.util.List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private String resolveFrontendBaseUrl(jakarta.servlet.http.HttpServletRequest request) {
        String origin = normalizeOrigin(request.getHeader("Origin"));
        if (origin != null && FRONTEND_ORIGINS.contains(origin)) {
            return origin;
        }

        String referer = request.getHeader("Referer");
        String refererOrigin = normalizeOrigin(referer);
        if (refererOrigin != null && FRONTEND_ORIGINS.contains(refererOrigin)) {
            return refererOrigin;
        }

        return "http://localhost:5173";
    }

    private String normalizeOrigin(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            URI uri = URI.create(value);
            if (uri.getScheme() == null || uri.getHost() == null || uri.getPort() < 0) {
                return null;
            }
            return uri.getScheme() + "://" + uri.getHost() + ":" + uri.getPort();
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }
}
