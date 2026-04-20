package com.smartcampus.smart_campus_api.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.smartcampus.smart_campus_api.config.SecurityConfig;
import com.smartcampus.smart_campus_api.model.Facility;
import com.smartcampus.smart_campus_api.model.User;
import com.smartcampus.smart_campus_api.model.enums.FacilityStatus;
import com.smartcampus.smart_campus_api.model.enums.FacilityType;
import com.smartcampus.smart_campus_api.repository.UserRepository;
import com.smartcampus.smart_campus_api.service.FacilityService;

@WebMvcTest(controllers = FacilityController.class)
@Import(SecurityConfig.class)
class FacilityControllerAccessTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private FacilityService facilityService;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    @SuppressWarnings("unused")
    private ClientRegistrationRepository clientRegistrationRepository;

    @MockitoBean
    @SuppressWarnings("unused")
    private OAuth2AuthorizedClientService oAuth2AuthorizedClientService;

    @Test
    void getFacilitiesWithoutAuthenticationReturns401() throws Exception {
        mockMvc.perform(get("/api/facilities"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getFacilitiesAsUserReturns200() throws Exception {
        User user = user("u-1", "student@campus.com", List.of("USER"));
        Facility facility = facility("f-1", "Lab A", FacilityType.LAB, FacilityStatus.ACTIVE);

        when(userRepository.findAllByEmail("student@campus.com")).thenReturn(List.of(user));
        when(facilityService.findFacilities(null, null, null, null, null)).thenReturn(List.of(facility));

        mockMvc.perform(get("/api/facilities")
                        .with(oauth2Login().attributes(attrs -> attrs.put("email", "student@campus.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("f-1"))
                .andExpect(jsonPath("$[0].name").value("Lab A"))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));
    }

    @Test
    void createFacilityAsUserReturns403() throws Exception {
        User user = user("u-1", "student@campus.com", List.of("USER"));
        when(userRepository.findAllByEmail("student@campus.com")).thenReturn(List.of(user));

        mockMvc.perform(post("/api/facilities")
                        .with(oauth2Login().attributes(attrs -> attrs.put("email", "student@campus.com")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validFacilityRequestJson()))
                .andExpect(status().isForbidden());
    }

    @Test
    void createFacilityAsAdminReturns201() throws Exception {
        User admin = user("u-1", "admin@campus.com", List.of("ADMIN"));
        Facility created = facility("f-1", "Hall A", FacilityType.LECTURE_HALL, FacilityStatus.ACTIVE);
        when(userRepository.findAllByEmail("admin@campus.com")).thenReturn(List.of(admin));
        when(facilityService.createFacility(any())).thenReturn(created);

        mockMvc.perform(post("/api/facilities")
                        .with(oauth2Login().attributes(attrs -> attrs.put("email", "admin@campus.com")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validFacilityRequestJson()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("f-1"))
                .andExpect(jsonPath("$.type").value("LECTURE_HALL"));
    }

    private User user(String id, String email, List<String> roles) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setRoles(roles);
        return user;
    }

    private Facility facility(String id, String name, FacilityType type, FacilityStatus status) {
        Facility facility = new Facility();
        facility.setId(id);
        facility.setName(name);
        facility.setType(type);
        facility.setStatus(status);
        facility.setCapacity(20);
        facility.setLocation("Main Building");
        return facility;
    }

    private String validFacilityRequestJson() {
        return """
                {
                  "name": "Hall A",
                  "type": "LECTURE_HALL",
                  "capacity": 120,
                  "location": "Block A",
                  "status": "ACTIVE",
                  "description": "Main lecture hall",
                  "availabilityWindows": [
                    { "dayOfWeek": "MONDAY", "startTime": "08:00", "endTime": "18:00" }
                  ]
                }
                """;
    }
}
