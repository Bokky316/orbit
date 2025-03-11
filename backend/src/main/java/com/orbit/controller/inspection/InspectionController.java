package com.orbit.controller.inspection;

import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.orbit.dto.inspection.InspectionRequestDto;
import com.orbit.dto.inspection.InspectionResponseDto;
import com.orbit.service.inspection.InspectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.List;
import java.util.Optional;

/**
 * 검수(Inspection) 컨트롤러
 * - 검수 목록 조회
 * - 특정 검수 조회
 * - 검수 등록
 * - 검수 수정
 */
@RestController
@RequestMapping("/api/inspections")
public class InspectionController {

    private final InspectionService inspectionService;

    public InspectionController(InspectionService inspectionService) {
        this.inspectionService = inspectionService;
    }

    // 전체 검수 목록 조회
    @GetMapping
    public ResponseEntity<List<InspectionResponseDto>> getAllInspections() {
        return ResponseEntity.ok(inspectionService.getCompletedContractInspections());
    }

    // 특정 검수 조회
    @GetMapping("/{id}")
    public ResponseEntity<InspectionResponseDto> getInspectionById(@PathVariable Long id) {
        Optional<InspectionResponseDto> inspection = inspectionService.getInspectionById(id);
        return inspection.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // 검수 등록
    @PostMapping
    public ResponseEntity<InspectionResponseDto> createInspection(@RequestBody InspectionRequestDto requestDto) {
        InspectionResponseDto createdInspection = inspectionService.saveInspection(requestDto);
        return ResponseEntity.ok(createdInspection);
    }

    // 검수 수정
    @PutMapping("/{id}")
    public ResponseEntity<InspectionResponseDto> updateInspection(@PathVariable Long id, @RequestBody InspectionRequestDto requestDto) {
        InspectionResponseDto updatedInspection = inspectionService.updateInspection(id, requestDto);
        return ResponseEntity.ok(updatedInspection);
    }
}
