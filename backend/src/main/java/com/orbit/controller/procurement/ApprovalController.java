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

    /**
     * 결재 ID로 결재 정보를 조회합니다.
     * @param id 결재 ID
     * @return 조회된 결재 정보 (존재하지 않으면 404 상태 코드 반환)
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApprovalResponseDTO> getApprovalById(@PathVariable Long id) {
        Optional<ApprovalResponseDTO> approval = approvalService.getApprovalById(id);
        return approval.map(response -> new ResponseEntity<>(response, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /**
     * 새로운 결재 정보를 생성합니다.
     * @param approvalDTO 생성할 결재 정보
     * @return 생성된 결재 정보 (201 상태 코드 반환)
     */
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