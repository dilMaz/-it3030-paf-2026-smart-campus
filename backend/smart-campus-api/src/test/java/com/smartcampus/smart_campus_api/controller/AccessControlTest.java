package com.smartcampus.smart_campus_api.controller;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.smartcampus.smart_campus_api.config.SecurityConfig;
import com.smartcampus.smart_campus_api.model.Notification;
import com.smartcampus.smart_campus_api.model.User;
import com.smartcampus.smart_campus_api.repository.UserRepository;
import com.smartcampus.smart_campus_api.service.NotificationService;

@WebMvcTest(controllers = { AuthController.class, NotificationController.class })
@Import(SecurityConfig.class)
@TestPropertySource(properties = "app.admin.email=admin@campus.com")
class AccessControlTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private NotificationService notificationService;

    @MockitoBean
    @SuppressWarnings("unused")
    private ClientRegistrationRepository clientRegistrationRepository;

    @MockitoBean
    @SuppressWarnings("unused")
    private OAuth2AuthorizedClientService oAuth2AuthorizedClientService;

    @Test
    void getUsersWithoutAuthenticationReturns401() throws Exception {
        mockMvc.perform(get("/api/auth/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getUsersAsNonAdminReturns403() throws Exception {
        User nonAdmin = user("u-1", "user1@campus.com", List.of("USER"));
        when(userRepository.findByEmail("user1@campus.com")).thenReturn(Optional.of(nonAdmin));

        mockMvc.perform(get("/api/auth/users")
                        .with(oauth2Login().attributes(attrs -> attrs.put("email", "user1@campus.com"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void markNotificationReadWithoutAuthenticationReturns401() throws Exception {
        mockMvc.perform(patch("/api/notifications/n-1/read"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void markNotificationReadAsNonOwnerReturns403() throws Exception {
        User nonAdmin = user("u-1", "user1@campus.com", List.of("USER"));
        Notification anotherUsersNotification = notification("n-1", "u-2");

        when(userRepository.findByEmail("user1@campus.com")).thenReturn(Optional.of(nonAdmin));
        when(notificationService.getNotificationById("n-1")).thenReturn(anotherUsersNotification);
        when(notificationService.markAsRead(anyString())).thenAnswer(invocation -> anotherUsersNotification);

        mockMvc.perform(patch("/api/notifications/n-1/read")
                        .with(oauth2Login().attributes(attrs -> attrs.put("email", "user1@campus.com"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void registerConfiguredAdminEmailCreatesAdminUser() throws Exception {
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{" +
                                "\"name\":\"Admin User\"," +
                                "\"email\":\"admin@campus.com\"," +
                                "\"password\":\"Password123!\"," +
                                "\"confirmPassword\":\"Password123!\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("admin@campus.com"))
                .andExpect(jsonPath("$.roles[0]").value("ADMIN"));
    }

    @Test
    void registerRegularEmailKeepsUserRole() throws Exception {
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{" +
                                "\"name\":\"Regular User\"," +
                                "\"email\":\"student@campus.com\"," +
                                "\"password\":\"Password123!\"," +
                                "\"confirmPassword\":\"Password123!\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("student@campus.com"))
                .andExpect(jsonPath("$.roles[0]").value("USER"));
    }

    private User user(String id, String email, List<String> roles) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setRoles(roles);
        return user;
    }

    private Notification notification(String id, String userId) {
        Notification notification = new Notification();
        notification.setId(id);
        notification.setUserId(userId);
        return notification;
    }
}
