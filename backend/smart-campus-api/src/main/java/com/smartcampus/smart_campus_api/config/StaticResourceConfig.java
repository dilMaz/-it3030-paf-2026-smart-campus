package com.smartcampus.smart_campus_api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Value("${app.avatar-upload-dir:uploads/avatars}")
    private String avatarUploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String normalized = avatarUploadDir.replace("\\", "/");
        if (!normalized.endsWith("/")) {
            normalized = normalized + "/";
        }

        registry.addResourceHandler("/uploads/avatars/**")
                .addResourceLocations("file:" + normalized);
    }
}
