package com.smartcampus.smart_campus_api.model;

import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "users")
public class User {
    @Id
    private String id;
    private String name;
    private String email;
    @JsonIgnore
    private String passwordHash;
    private String picture;
    private String profileImageUrl;
    private String bio;
    private String googleId;
    private List<String> roles;
    private Instant createdAt;
    private Instant updatedAt;
}