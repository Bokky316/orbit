package com.orbit.controller.procurement;

import com.orbit.dto.approval.ApprovalDTO;
import com.orbit.dto.procurement.ApprovalResponseDTO;
import com.orbit.service.procurement.ApprovalLineService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * 결재 관련 RESTful API를 처리하는 컨트롤러 클래스
 */
@RestController
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
    public ResponseEntity<ApprovalResponseDTO> createApproval(@Valid @RequestBody ApprovalDTO approvalDTO) {
        ApprovalResponseDTO createdApproval = approvalService.createApproval(approvalDTO);
        return new ResponseEntity<>(createdApproval, HttpStatus.CREATED);
    }

    /**
     * 결재 정보를 업데이트합니다.
     * @param id 업데이트할 결재 ID
     * @param approvalDTO 업데이트할 결재 정보
     * @return 업데이트된 결재 정보
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApprovalResponseDTO> updateApproval(@PathVariable Long id, @Valid @RequestBody ApprovalDTO approvalDTO) {
        ApprovalResponseDTO updatedApproval = approvalService.updateApproval(id, approvalDTO);
        return new ResponseEntity<>(updatedApproval, HttpStatus.OK);
    }
}
