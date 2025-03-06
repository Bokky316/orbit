package com.orbit.controller.procurement;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orbit.dto.procurement.ApprovalDTO;
import com.orbit.dto.procurement.ApprovalResponseDTO;
import com.orbit.service.procurement.ApprovalService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * ApprovalController에 대한 통합 테스트 클래스
 *
 * @SpringBootTest: Spring Boot 기반 애플리케이션 컨텍스트를 로드하여 통합 테스트를 수행합니다.
 * @AutoConfigureMockMvc: MockMvc를 자동으로 구성하여 Controller를 테스트할 수 있도록 합니다.
 */
@SpringBootTest
@AutoConfigureMockMvc
public class ApprovalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ApprovalService approvalService;

    @Autowired
    private ObjectMapper objectMapper;

    @Configuration
    static class TestConfig {
        @Bean
        public ApprovalService approvalService() {
            return mock(ApprovalService.class);
        }

        @Bean
        public ObjectMapper objectMapper() {
            return new ObjectMapper();
        }
    }

    /**
     * 모든 결재 정보를 조회하는 API에 대한 테스트
     */
    @Test
    void getAllApprovals_shouldReturnAllApprovals() throws Exception {
        // Given
        ApprovalService mockApprovalService = mock(ApprovalService.class);
        ApprovalResponseDTO approval1 = new ApprovalResponseDTO();
        approval1.setId(1L);
        approval1.setComments("Test Comments 1");

        ApprovalResponseDTO approval2 = new ApprovalResponseDTO();
        approval2.setId(2L);
        approval2.setComments("Test Comments 2");

        List<ApprovalResponseDTO> approvals = Arrays.asList(approval1, approval2);
        when(mockApprovalService.getAllApprovals()).thenReturn(approvals);

        // When & Then
        mockMvc.perform(get("/api/approvals"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].comments").value("Test Comments 1"))
                .andExpect(jsonPath("$[1].comments").value("Test Comments 2"));
    }

    /**
     * 결재 ID로 결재 정보를 조회하는 API에 대한 테스트 (결재 정보가 존재하는 경우)
     */
    @Test
    void getApprovalById_shouldReturnApproval_whenApprovalExists() throws Exception {
        // Given
        ApprovalService mockApprovalService = mock(ApprovalService.class);
        ApprovalResponseDTO approval = new ApprovalResponseDTO();
        approval.setId(1L);
        approval.setComments("Test Comments");
        when(mockApprovalService.getApprovalById(1L)).thenReturn(Optional.of(approval));

        // When & Then
        mockMvc.perform(get("/api/approvals/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.comments").value("Test Comments"));
    }

    /**
     * 결재 ID로 결재 정보를 조회하는 API에 대한 테스트 (결재 정보가 존재하지 않는 경우)
     */
    @Test
    void getApprovalById_shouldReturnNotFound_whenApprovalDoesNotExist() throws Exception {
        // Given
        ApprovalService mockApprovalService = mock(ApprovalService.class);
        when(mockApprovalService.getApprovalById(3L)).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/api/approvals/3"))
                .andExpect(status().isNotFound());
    }

    /**
     * 새로운 결재 정보를 생성하는 API에 대한 테스트
     */
    @Test
    void createApproval_shouldCreateNewApproval() throws Exception {
        // Given
        ApprovalService mockApprovalService = mock(ApprovalService.class);
        ApprovalDTO approvalDTO = new ApprovalDTO();
        approvalDTO.setPurchaseRequestId(1L);
        approvalDTO.setApproverId(1L);
        approvalDTO.setApprovalDate(LocalDate.now());
        approvalDTO.setStatus("대기");
        approvalDTO.setComments("Test Comments");

        ApprovalResponseDTO createdApproval = new ApprovalResponseDTO();
        createdApproval.setId(1L);
        createdApproval.setPurchaseRequestId(1L);
        createdApproval.setApproverId(1L);
        createdApproval.setApprovalDate(LocalDate.now());
        createdApproval.setStatus("대기");
        createdApproval.setComments("Test Comments");

        when(mockApprovalService.createApproval(any(ApprovalDTO.class))).thenReturn(createdApproval);

        // When & Then
        mockMvc.perform(post("/api/approvals")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approvalDTO)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.comments").value("Test Comments"))
                .andExpect(jsonPath("$.status").value("대기"));
    }

    /**
     * 결재 정보를 업데이트하는 API에 대한 테스트
     */
    @Test
    void updateApproval_shouldUpdateApproval_whenApprovalExists() throws Exception {
        // Given
        ApprovalService mockApprovalService = mock(ApprovalService.class);
        ApprovalDTO approvalDTO = new ApprovalDTO();
        approvalDTO.setPurchaseRequestId(1L);
        approvalDTO.setApproverId(1L);
        approvalDTO.setApprovalDate(LocalDate.now());
        approvalDTO.setStatus("승인");
        approvalDTO.setComments("Updated Comments");

        ApprovalResponseDTO updatedApproval = new ApprovalResponseDTO();
        updatedApproval.setId(1L);
        updatedApproval.setPurchaseRequestId(1L);
        updatedApproval.setApproverId(1L);
        updatedApproval.setApprovalDate(LocalDate.now());
        updatedApproval.setStatus("승인");
        updatedApproval.setComments("Updated Comments");

        when(mockApprovalService.updateApproval(eq(1L), any(ApprovalDTO.class))).thenReturn(updatedApproval);

        // When & Then
        mockMvc.perform(put("/api/approvals/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approvalDTO)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.comments").value("Updated Comments"))
                .andExpect(jsonPath("$.status").value("승인"));
    }
}
