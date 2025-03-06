package com.orbit.service.procurement;

import com.orbit.dto.procurement.ApprovalDTO;
import com.orbit.dto.procurement.ApprovalResponseDTO;
import com.orbit.entity.Member;
import com.orbit.entity.procurement.Approval;
import com.orbit.entity.procurement.PurchaseRequest;
import com.orbit.exception.ProjectNotFoundException;
import com.orbit.repository.MemberRepository;
import com.orbit.repository.procurement.ApprovalRepository;
import com.orbit.repository.procurement.PurchaseRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * ApprovalService에 대한 단위 테스트 클래스
 */
@ExtendWith(MockitoExtension.class)
public class ApprovalServiceTest {

    @Mock
    private ApprovalRepository approvalRepository;

    @Mock
    private PurchaseRequestRepository purchaseRequestRepository;

    @Mock
    private MemberRepository memberRepository;

    @InjectMocks
    private ApprovalService approvalService;

    private Approval approval1;
    private Approval approval2;
    private ApprovalDTO approvalDTO;

    /**
     * 각 테스트 메서드 실행 전에 호출되어 테스트 환경을 설정합니다.
     */
    @BeforeEach
    void setUp() {
        // 테스트에 사용될 객체 생성
        PurchaseRequest purchaseRequest = new PurchaseRequest();
        purchaseRequest.setId(1L);

        Member approver = new Member();
        approver.setId(1L);

        approval1 = new Approval();
        approval1.setId(1L);
        approval1.setPurchaseRequest(purchaseRequest);
        approval1.setApprover(approver);
        approval1.setApprovalDate(LocalDate.now());
        approval1.setStatus(Approval.ApprovalStatus.대기);
        approval1.setComments("Test Comments 1");

        approval2 = new Approval();
        approval2.setId(2L);
        approval2.setPurchaseRequest(purchaseRequest);
        approval2.setApprover(approver);
        approval2.setApprovalDate(LocalDate.now());
        approval2.setStatus(Approval.ApprovalStatus.승인);
        approval2.setComments("Test Comments 2");

        approvalDTO = new ApprovalDTO();
        approvalDTO.setPurchaseRequestId(1L);
        approvalDTO.setApproverId(1L);
        approvalDTO.setApprovalDate(LocalDate.now());
        approvalDTO.setStatus("대기");
        approvalDTO.setComments("Test Comments DTO");
    }

    /**
     * 모든 결재 정보를 조회하는 메서드에 대한 테스트
     */
    @Test
    void getAllApprovals_shouldReturnAllApprovals() {
        // Given
        when(approvalRepository.findAll()).thenReturn(Arrays.asList(approval1, approval2));

        // When
        List<ApprovalResponseDTO> approvals = approvalService.getAllApprovals();

        // Then
        assertEquals(2, approvals.size());
        assertEquals(approval1.getComments(), approvals.get(0).getComments());
        assertEquals(approval2.getComments(), approvals.get(1).getComments());
    }

    /**
     * 결재 ID로 결재 정보를 조회하는 메서드에 대한 테스트 (결재 정보가 존재하는 경우)
     */
    @Test
    void getApprovalById_shouldReturnApproval_whenApprovalExists() {
        // Given
        when(approvalRepository.findById(1L)).thenReturn(Optional.of(approval1));

        // When
        Optional<ApprovalResponseDTO> approval = approvalService.getApprovalById(1L);

        // Then
        assertTrue(approval.isPresent());
        assertEquals(approval1.getComments(), approval.get().getComments());
    }

    /**
     * 결재 ID로 결재 정보를 조회하는 메서드에 대한 테스트 (결재 정보가 존재하지 않는 경우)
     */
    @Test
    void getApprovalById_shouldReturnEmpty_whenApprovalDoesNotExist() {
        // Given
        when(approvalRepository.findById(3L)).thenReturn(Optional.empty());

        // When
        Optional<ApprovalResponseDTO> approval = approvalService.getApprovalById(3L);

        // Then
        assertFalse(approval.isPresent());
    }

    /**
     * 새로운 결재 정보를 생성하는 메서드에 대한 테스트
     */
    @Test
    void createApproval_shouldCreateNewApproval() {
        // Given
        when(purchaseRequestRepository.findById(1L)).thenReturn(Optional.of(approval1.getPurchaseRequest()));
        when(memberRepository.findById(1L)).thenReturn(Optional.of(approval1.getApprover()));
        when(approvalRepository.save(any(Approval.class))).thenReturn(approval1);

        // When
        ApprovalResponseDTO createdApproval = approvalService.createApproval(approvalDTO);

        // Then
        assertEquals(approval1.getComments(), createdApproval.getComments());
    }

    /**
     * 결재 정보를 업데이트하는 메서드에 대한 테스트 (결재 정보가 존재하는 경우)
     */
    @Test
    void updateApproval_shouldUpdateApproval_whenApprovalExists() {
        // Given
        when(approvalRepository.findById(1L)).thenReturn(Optional.of(approval1));
        when(approvalRepository.save(any(Approval.class))).thenReturn(approval1);

        ApprovalDTO approvalDTO = new ApprovalDTO();
        approvalDTO.setPurchaseRequestId(1L);
        approvalDTO.setApproverId(1L);
        approvalDTO.setApprovalDate(LocalDate.now());
        approvalDTO.setStatus("승인");
        approvalDTO.setComments("Updated Comments");

        // When
        ApprovalResponseDTO updatedApproval = approvalService.updateApproval(1L, approvalDTO);

        // Then
        assertEquals("Updated Comments", updatedApproval.getComments());
        assertEquals("승인", updatedApproval.getStatus());
    }

    /**
     * 결재 정보를 업데이트하는 메서드에 대한 테스트 (결재 정보가 존재하지 않는 경우)
     */
    @Test
    void updateApproval_shouldThrowException_whenApprovalDoesNotExist() {
        // Given
        when(approvalRepository.findById(4L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(ProjectNotFoundException.class, () -> approvalService.updateApproval(4L, approvalDTO));
    }
}
