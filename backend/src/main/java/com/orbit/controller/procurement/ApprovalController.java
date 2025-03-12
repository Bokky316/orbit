package com.orbit.controller.procurement;

import com.orbit.dto.approval.ApprovalLineCreateDTO;
import com.orbit.dto.approval.ApprovalLineResponseDTO;
import com.orbit.dto.approval.ApprovalProcessDTO;
import com.orbit.service.procurement.ApprovalLineService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/approvals")
public class ApprovalController {

    private final ApprovalLineService approvalLineService;

    public ApprovalController(ApprovalLineService approvalLineService) {
        this.approvalLineService = approvalLineService;
    }

    @PostMapping
    public ResponseEntity<Void> createApprovalLine(@Valid @RequestBody ApprovalLineCreateDTO dto) {
        approvalLineService.createApprovalLine(dto);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }

    @PostMapping("/{lineId}/process")
    public ResponseEntity<Void> processApproval(
            @PathVariable Long lineId,
            @Valid @RequestBody ApprovalProcessDTO dto) {
        approvalLineService.processApproval(lineId, dto);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @GetMapping("/{requestId}")
    public ResponseEntity<List<ApprovalLineResponseDTO>> getApprovalLines(@PathVariable Long requestId) {
        List<ApprovalLineResponseDTO> lines = approvalLineService.getApprovalLines(requestId);
        return new ResponseEntity<>(lines, HttpStatus.OK);
    }

    @GetMapping("/eligible-members")
    public ResponseEntity<List<ApprovalLineResponseDTO>> getEligibleApprovalMembers() {
        List<ApprovalLineResponseDTO> eligibleMembers = approvalLineService.findEligibleApprovalMembers();
        return ResponseEntity.ok(eligibleMembers);
    }
}