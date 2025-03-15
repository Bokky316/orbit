package com.orbit.controller.approval;

import com.orbit.dto.approval.ApprovalLineCreateDTO;
import com.orbit.dto.approval.ApprovalLineResponseDTO;
import com.orbit.dto.approval.ApprovalProcessDTO;
import com.orbit.dto.procurement.PurchaseRequestDTO;
import com.orbit.entity.procurement.PurchaseRequest;
import com.orbit.service.procurement.ApprovalLineService;
import com.orbit.service.procurement.PurchaseRequestService;
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

    private final ApprovalLineService approvalLineService;

    @PostMapping
    public ResponseEntity<ApprovalLineResponseDTO> createApprovalLine(
            @Valid @RequestBody ApprovalLineCreateDTO dto) {
        ApprovalLineResponseDTO createdLine = approvalLineService.createApprovalLine(dto);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(createdLine);
    }

    @PostMapping("/{lineId}/process")
    public ResponseEntity<ApprovalLineResponseDTO> processApproval(
            @PathVariable Long lineId,
            @Valid @RequestBody ApprovalProcessDTO dto) {
        ApprovalLineResponseDTO processedLine = approvalLineService.processApproval(lineId, dto);
        return ResponseEntity.ok(processedLine);
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