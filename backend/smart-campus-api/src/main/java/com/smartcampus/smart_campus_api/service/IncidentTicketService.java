package com.smartcampus.smart_campus_api.service;

import java.util.List;

import com.smartcampus.smart_campus_api.dto.CreateIncidentTicketRequest;
import com.smartcampus.smart_campus_api.dto.IncidentTicketResponse;
import com.smartcampus.smart_campus_api.dto.UpdateTicketStatusRequest;

public interface IncidentTicketService {
    List<IncidentTicketResponse> getTickets(Object principal);

    IncidentTicketResponse getTicketById(String ticketId, Object principal);

    IncidentTicketResponse createTicket(CreateIncidentTicketRequest request, Object principal);

    IncidentTicketResponse updateTicketStatus(String ticketId, UpdateTicketStatusRequest request, Object principal);
}
