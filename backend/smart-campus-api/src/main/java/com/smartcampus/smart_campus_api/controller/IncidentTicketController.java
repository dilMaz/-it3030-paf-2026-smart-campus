package com.smartcampus.smart_campus_api.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.smart_campus_api.dto.CreateIncidentTicketRequest;
import com.smartcampus.smart_campus_api.dto.IncidentTicketResponse;
import com.smartcampus.smart_campus_api.dto.UpdateTicketStatusRequest;
import com.smartcampus.smart_campus_api.service.IncidentTicketService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"}, allowCredentials = "true")
public class IncidentTicketController {

    private final IncidentTicketService incidentTicketService;

    @GetMapping
    public ResponseEntity<List<IncidentTicketResponse>> getTickets(@AuthenticationPrincipal Object principal) {
        return ResponseEntity.ok(incidentTicketService.getTickets(principal));
    }

    @GetMapping("/{ticketId}")
    public ResponseEntity<IncidentTicketResponse> getTicketById(
            @PathVariable String ticketId,
            @AuthenticationPrincipal Object principal) {
        return ResponseEntity.ok(incidentTicketService.getTicketById(ticketId, principal));
    }

    @PostMapping
    public ResponseEntity<IncidentTicketResponse> createTicket(
            @Valid @RequestBody CreateIncidentTicketRequest request,
            @AuthenticationPrincipal Object principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(incidentTicketService.createTicket(request, principal));
    }

    @PatchMapping("/{ticketId}/status")
    public ResponseEntity<IncidentTicketResponse> updateTicketStatus(
            @PathVariable String ticketId,
            @Valid @RequestBody UpdateTicketStatusRequest request,
            @AuthenticationPrincipal Object principal) {
        return ResponseEntity.ok(incidentTicketService.updateTicketStatus(ticketId, request, principal));
    }
}
