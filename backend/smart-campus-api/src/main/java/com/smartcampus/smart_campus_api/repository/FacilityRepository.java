package com.smartcampus.smart_campus_api.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.smartcampus.smart_campus_api.model.Facility;

public interface FacilityRepository extends MongoRepository<Facility, String> {
}
