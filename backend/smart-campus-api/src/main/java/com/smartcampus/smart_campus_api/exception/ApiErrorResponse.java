package com.smartcampus.smart_campus_api.exception;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ApiErrorResponse {
    LocalDateTime timestamp;
    int status;
    String error;
    String message;
    String path;
    List<String> details;
}
