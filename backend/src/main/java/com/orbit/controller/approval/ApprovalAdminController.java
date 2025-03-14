package com.orbit.controller.approval;

import com.orbit.dto.approval.ApprovalTemplateDTO;
import com.orbit.dto.approval.DepartmentDTO;
import com.orbit.dto.approval.PositionDTO;
import com.orbit.service.procurement.ApprovalTemplateService;
import com.orbit.service.procurement.DepartmentService;
import com.orbit.service.procurement.PositionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 결재 관리자 컨트롤러
 * 결재선 템플릿, 부서, 직급 관리 API
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class ApprovalAdminController {

    private final ApprovalTemplateService templateService;
    private final DepartmentService departmentService;
    private final PositionService positionService;

    //=== 결재선 템플릿 API ===//

    /**
     * 모든 결재선 템플릿 조회
     */
    @GetMapping("/approval-templates")
    public ResponseEntity<List<ApprovalTemplateDTO>> getAllTemplates() {
        return ResponseEntity.ok(templateService.getAllTemplates());
    }

    /**
     * 활성화된 결재선 템플릿만 조회
     */
    @GetMapping("/approval-templates/active")
    public ResponseEntity<List<ApprovalTemplateDTO>> getActiveTemplates() {
        return ResponseEntity.ok(templateService.getActiveTemplates());
    }

    /**
     * 결재선 템플릿 단일 조회
     */
    @GetMapping("/approval-templates/{id}")
    public ResponseEntity<ApprovalTemplateDTO> getTemplateById(@PathVariable Long id) {
        return ResponseEntity.ok(templateService.getTemplateById(id));
    }

    /**
     * 결재선 템플릿 생성
     */
    @PostMapping("/approval-templates")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApprovalTemplateDTO> createTemplate(@Valid @RequestBody ApprovalTemplateDTO dto) {
        ApprovalTemplateDTO createdTemplate = templateService.createTemplate(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTemplate);
    }

    /**
     * 결재선 템플릿 수정
     */
    @PutMapping("/approval-templates/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApprovalTemplateDTO> updateTemplate(
            @PathVariable Long id,
            @Valid @RequestBody ApprovalTemplateDTO dto) {
        return ResponseEntity.ok(templateService.updateTemplate(id, dto));
    }

    /**
     * 결재선 템플릿 삭제
     */
    @DeleteMapping("/approval-templates/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long id) {
        templateService.deleteTemplate(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 결재선 템플릿 활성화/비활성화 토글
     */
    @PatchMapping("/approval-templates/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApprovalTemplateDTO> toggleTemplateActive(@PathVariable Long id) {
        return ResponseEntity.ok(templateService.toggleTemplateActive(id));
    }

    //=== 부서 API ===//

    /**
     * 모든 부서 조회
     */
    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentDTO>> getAllDepartments() {
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }

    /**
     * 부서 단일 조회
     */
    @GetMapping("/departments/{id}")
    public ResponseEntity<DepartmentDTO> getDepartmentById(@PathVariable Long id) {
        return ResponseEntity.ok(departmentService.getDepartmentById(id));
    }

    /**
     * 키워드로 부서 검색
     */
    @GetMapping("/departments/search")
    public ResponseEntity<List<DepartmentDTO>> searchDepartments(@RequestParam String keyword) {
        return ResponseEntity.ok(departmentService.searchDepartments(keyword));
    }

    /**
     * 부서 생성
     */
    @PostMapping("/departments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DepartmentDTO> createDepartment(@Valid @RequestBody DepartmentDTO dto) {
        DepartmentDTO createdDepartment = departmentService.createDepartment(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdDepartment);
    }

    /**
     * 부서 수정
     */
    @PutMapping("/departments/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DepartmentDTO> updateDepartment(
            @PathVariable Long id,
            @Valid @RequestBody DepartmentDTO dto) {
        return ResponseEntity.ok(departmentService.updateDepartment(id, dto));
    }

    /**
     * 부서 삭제
     */
    @DeleteMapping("/departments/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.noContent().build();
    }

    //=== 직급 API ===//

    /**
     * 모든 직급 조회
     */
    @GetMapping("/positions")
    public ResponseEntity<List<PositionDTO>> getAllPositions() {
        return ResponseEntity.ok(positionService.getAllPositions());
    }

    /**
     * 직급 단일 조회
     */
    @GetMapping("/positions/{id}")
    public ResponseEntity<PositionDTO> getPositionById(@PathVariable Long id) {
        return ResponseEntity.ok(positionService.getPositionById(id));
    }

    /**
     * 특정 레벨 이상의 직급 조회
     */
    @GetMapping("/positions/level/{minLevel}")
    public ResponseEntity<List<PositionDTO>> getPositionsByMinLevel(@PathVariable int minLevel) {
        return ResponseEntity.ok(positionService.getPositionsByMinLevel(minLevel));
    }

    /**
     * 직급 생성
     */
    @PostMapping("/positions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PositionDTO> createPosition(@Valid @RequestBody PositionDTO dto) {
        PositionDTO createdPosition = positionService.createPosition(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPosition);
    }

    /**
     * 직급 수정
     */
    @PutMapping("/positions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PositionDTO> updatePosition(
            @PathVariable Long id,
            @Valid @RequestBody PositionDTO dto) {
        return ResponseEntity.ok(positionService.updatePosition(id, dto));
    }

    /**
     * 직급 삭제
     */
    @DeleteMapping("/positions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePosition(@PathVariable Long id) {
        positionService.deletePosition(id);
        return ResponseEntity.noContent().build();
    }
}