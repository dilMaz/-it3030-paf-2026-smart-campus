package com.smartcampus.smart_campus_api.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.smartcampus.smart_campus_api.model.IncidentTicket;

public interface IncidentTicketRepository extends MongoRepository<IncidentTicket, String> {
    List<IncidentTicket> findAllByOrderByCreatedAtDesc();

    List<IncidentTicket> findByReporterIdOrderByCreatedAtDesc(String reporterId);
}
