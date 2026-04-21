package com.smartcampus.smart_campus_api.resource.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.smartcampus.smart_campus_api.resource.entity.Resource;

public interface ResourceRepository extends MongoRepository<Resource, String> {
}
