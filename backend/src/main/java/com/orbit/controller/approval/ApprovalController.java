package com.orbit.controller.approval;

import com.orbit.dto.approval.ApprovalLineCreateDTO;
import com.orbit.dto.approval.ApprovalLineResponseDTO;
import com.orbit.dto.approval.ApprovalProcessDTO;
import com.orbit.dto.approval.ApprovalTemplateDTO;
import com.orbit.service.procurement.ApprovalLineService;
import com.orbit.service.procurement.ApprovalTemplateService;
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
    private final ApprovalTemplateService approvalTemplateService;

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

    /**
     * 활성화된 결재선 템플릿 목록 조회
     */
    @GetMapping("/templates")
    public ResponseEntity<List<ApprovalTemplateDTO>> getAvailableTemplates() {
        List<ApprovalTemplateDTO> templates = approvalTemplateService.getActiveTemplates();
        return ResponseEntity.ok(templates);
    }

    /**
     * 템플릿 기반 결재선 생성
     */
    @PostMapping("/from-template")
    public ResponseEntity<ApprovalLineResponseDTO> createApprovalLineFromTemplate(
            @Valid @RequestBody ApprovalLineCreateDTO dto) {
        ApprovalLineResponseDTO createdLine = approvalLineService.createApprovalLineFromTemplate(dto);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(createdLine);
    }

    /**
     * 템플릿 상세 정보 조회
     */
    @GetMapping("/templates/{id}")
    public ResponseEntity<ApprovalTemplateDTO> getTemplateDetail(@PathVariable Long id) {
        ApprovalTemplateDTO template = approvalTemplateService.getTemplateById(id);
        return ResponseEntity.ok(template);
    }
}