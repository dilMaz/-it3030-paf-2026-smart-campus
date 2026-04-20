package com.smartcampus.smart_campus_api.resource.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.smartcampus.smart_campus_api.resource.entity.Resource;
import com.smartcampus.smart_campus_api.resource.enums.ResourceStatus;
import com.smartcampus.smart_campus_api.resource.enums.ResourceType;

public interface ResourceRepository extends JpaRepository<Resource, Long> {

    @Query("""
        SELECT r
        FROM Resource r
        WHERE (:type IS NULL OR r.type = :type)
        AND (:location IS NULL OR LOWER(r.location) LIKE LOWER(CONCAT('%', :location, '%')))
        AND (:minCapacity IS NULL OR r.capacity >= :minCapacity)
        AND (:status IS NULL OR r.status = :status)
        ORDER BY r.name ASC
    """)
    List<Resource> search(
            @Param("type") ResourceType type,
            @Param("location") String location,
            @Param("minCapacity") Integer minCapacity,
            @Param("status") ResourceStatus status);
}
