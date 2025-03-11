package com.orbit.controller.procurement;

import com.orbit.dto.procurement.ApprovalDTO;
import com.orbit.dto.procurement.ApprovalResponseDTO;
import com.orbit.service.procurement.ApprovalLineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/approvals")
public class ApprovalController {

    private final ApprovalLineService approvalService;

    /**
     * 생성자를 통한 의존성 주입
     * @param approvalService 결재 서비스
     */
    public ApprovalController(ApprovalLineService approvalService) {
        this.approvalService = approvalService;
    }

    /**
     * 모든 결재 정보를 조회합니다.
     * @return 결재 정보 목록
     */
    @GetMapping
    public ResponseEntity<List<ApprovalResponseDTO>> getAllApprovals() {
        List<ApprovalResponseDTO> approvals = approvalService.getAllApprovals();
        return new ResponseEntity<>(approvals, HttpStatus.OK);
    }

    @GetMapping("/{requestId}")
    public ResponseEntity<List<ApprovalLineResponseDTO>> getApprovalLines(
            @PathVariable Long requestId) {
        List<ApprovalLineResponseDTO> lines = approvalLineService.getApprovalLines(requestId);
        return ResponseEntity.ok(lines);
    }

    @GetMapping("/eligible-members")
    public ResponseEntity<List<ApprovalLineResponseDTO>> getEligibleApprovalMembers() {
        List<ApprovalLineResponseDTO> eligibleMembers = approvalLineService.findByPositionLevelGreaterThanEqual();
        return ResponseEntity.ok(eligibleMembers);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<ApprovalLineResponseDTO>> getPendingApprovals() {
        List<ApprovalLineResponseDTO> pendingApprovals = approvalLineService.getPendingApprovals();
        return ResponseEntity.ok(pendingApprovals);
    }

    @GetMapping("/completed")
    public ResponseEntity<List<ApprovalLineResponseDTO>> getCompletedApprovals() {
        List<ApprovalLineResponseDTO> completedApprovals = approvalLineService.getCompletedApprovals();
        return ResponseEntity.ok(completedApprovals);
    }
}