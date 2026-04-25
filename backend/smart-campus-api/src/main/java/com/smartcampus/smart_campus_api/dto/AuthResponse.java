package com.smartcampus.smart_campus_api.dto;

import com.smartcampus.smart_campus_api.model.User;

public record AuthResponse(User user, String token) {
}
