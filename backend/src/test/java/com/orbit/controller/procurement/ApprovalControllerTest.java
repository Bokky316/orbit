package com.orbit.controller.procurement;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orbit.dto.procurement.ApprovalDTO;
import com.orbit.dto.procurement.ApprovalResponseDTO;
import com.orbit.service.MemberService;
import com.orbit.service.AccessTokenService;
import com.orbit.service.procurement.ApprovalService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import com.orbit.config.jwt.RefreshTokenCheckFilter; // RefreshTokenCheckFilter import

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * ApprovalController에 대한 단위 테스트 클래스
 * Spring MVC 기반의 테스트 환경에서 ApprovalController의 API 엔드포인트를 테스트
 */
@WebMvcTest(value = ApprovalController.class, excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = RefreshTokenCheckFilter.class))
public class ApprovalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ApprovalService approvalService;

    @MockitoBean
    private AccessTokenService accessTokenService; // AccessTokenService를 Mock으로 대체

    @MockitoBean // MemberService를 MockitoBean으로 주입
    private MemberService memberService;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * 모든 Approval 목록을 가져오는 API 테스트
     * @throws Exception
     */
    @Test
    void getAllApprovals_shouldReturnAllApprovals() throws Exception {
        // Given
        ApprovalResponseDTO approval1 = new ApprovalResponseDTO();
        approval1.setId(1L);
        approval1.setComments("Test Comments 1");

        ApprovalResponseDTO approval2 = new ApprovalResponseDTO();
        approval2.setId(2L);
        approval2.setComments("Test Comments 2");

        List<ApprovalResponseDTO> approvals = Arrays.asList(approval1, approval2);
        when(approvalService.getAllApprovals()).thenReturn(approvals);

        // When & Then
        mockMvc.perform(get("/api/approvals"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].comments").value("Test Comments 1"))
                .andExpect(jsonPath("$[1].comments").value("Test Comments 2"));
    }

    /**
     * 특정 ID의 Approval을 가져오는 API 테스트 (Approval이 존재하는 경우)
     * @throws Exception
     */
    @Test
    void getApprovalById_shouldReturnApproval_whenApprovalExists() throws Exception {
        // Given
        ApprovalResponseDTO approval = new ApprovalResponseDTO();
        approval.setId(1L);
        approval.setComments("Test Comments");
        when(approvalService.getApprovalById(1L)).thenReturn(Optional.of(approval));

        // When & Then
        mockMvc.perform(get("/api/approvals/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.comments").value("Test Comments"));
    }

    /**
     * 특정 ID의 Approval을 가져오는 API 테스트 (Approval이 존재하지 않는 경우)
     * @throws Exception
     */
    @Test
    void getApprovalById_shouldReturnNotFound_whenApprovalDoesNotExist() throws Exception {
        // Given
        when(approvalService.getApprovalById(3L)).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/api/approvals/3"))
                .andExpect(status().isNotFound());
    }

    /**
     * 새로운 Approval을 생성하는 API 테스트
     * @throws Exception
     */
    @Test
    void createApproval_shouldCreateNewApproval() throws Exception {
        // Given
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

        when(approvalService.createApproval(any(ApprovalDTO.class))).thenReturn(createdApproval);

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
     * 기존 Approval을 업데이트하는 API 테스트 (Approval이 존재하는 경우)
     * @throws Exception
     */
    @Test
    void updateApproval_shouldUpdateApproval_whenApprovalExists() throws Exception {
        // Given
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

        when(approvalService.updateApproval(eq(1L), any(ApprovalDTO.class))).thenReturn(updatedApproval);

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
