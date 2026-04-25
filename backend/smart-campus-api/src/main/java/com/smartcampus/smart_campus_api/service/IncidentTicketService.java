package com.smartcampus.smart_campus_api.service;

import java.util.List;

import com.smartcampus.smart_campus_api.dto.AssignTechnicianRequest;
import com.smartcampus.smart_campus_api.dto.CreateIncidentTicketRequest;
import com.smartcampus.smart_campus_api.dto.CreateTicketCommentRequest;
import com.smartcampus.smart_campus_api.dto.IncidentTicketResponse;
import com.smartcampus.smart_campus_api.dto.UpdateTicketCommentRequest;
import com.smartcampus.smart_campus_api.dto.UpdateTicketStatusRequest;
import org.springframework.web.multipart.MultipartFile;

public interface IncidentTicketService {
    List<IncidentTicketResponse> getTickets(Object principal);

    IncidentTicketResponse getTicketById(String ticketId, Object principal);

    IncidentTicketResponse createTicket(CreateIncidentTicketRequest request, Object principal);

    IncidentTicketResponse updateTicketStatus(String ticketId, UpdateTicketStatusRequest request, Object principal);

    IncidentTicketResponse assignTechnician(String ticketId, AssignTechnicianRequest request, Object principal);

    IncidentTicketResponse addComment(String ticketId, CreateTicketCommentRequest request, Object principal);

    IncidentTicketResponse updateComment(String ticketId, String commentId, UpdateTicketCommentRequest request, Object principal);

    IncidentTicketResponse deleteComment(String ticketId, String commentId, Object principal);

    List<String> uploadAttachments(Object principal, List<MultipartFile> files);
}
