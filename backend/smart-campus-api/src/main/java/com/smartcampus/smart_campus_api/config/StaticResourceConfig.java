package com.smartcampus.smart_campus_api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Value("${app.avatar-upload-dir:uploads/avatars}")
    private String avatarUploadDir;

    @Value("${app.ticket-upload-dir:uploads/tickets}")
    private String ticketUploadDir;

    @Value("${app.facility-upload-dir:uploads/facilities}")
    private String facilityUploadDir;

    @Value("${app.resource-upload-dir:uploads/resources}")
    private String resourceUploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String normalized = avatarUploadDir.replace("\\", "/");
        if (!normalized.endsWith("/")) {
            normalized = normalized + "/";
        }

        registry.addResourceHandler("/uploads/avatars/**")
                .addResourceLocations("file:" + normalized);

        String normalizedTickets = ticketUploadDir.replace("\\", "/");
        if (!normalizedTickets.endsWith("/")) {
            normalizedTickets = normalizedTickets + "/";
        }

        registry.addResourceHandler("/uploads/tickets/**")
                .addResourceLocations("file:" + normalizedTickets);

        String normalizedFacilities = facilityUploadDir.replace("\\", "/");
        if (!normalizedFacilities.endsWith("/")) {
            normalizedFacilities = normalizedFacilities + "/";
        }

        registry.addResourceHandler("/uploads/facilities/**")
            .addResourceLocations("file:" + normalizedFacilities);

        String normalizedResources = resourceUploadDir.replace("\\", "/");
        if (!normalizedResources.endsWith("/")) {
            normalizedResources = normalizedResources + "/";
        }

        registry.addResourceHandler("/uploads/resources/**")
            .addResourceLocations("file:" + normalizedResources);
    }
}
