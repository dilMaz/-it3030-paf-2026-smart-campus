package com.smartcampus.smart_campus_api.dto;

public record RegisterRequest(String name, String email, String password, String confirmPassword) {
}