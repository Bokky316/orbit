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
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 📌 검수(Inspection) 컨트롤러
 * - 검수 목록 조회
 * - 특정 검수 조회
 * - 검수 등록 (예외 처리 추가)
 * - 검수 수정 (예외 처리 추가)
 * - 계약 완료 시 검수 자동 등록
 */
@RestController
@RequestMapping("/api/inspections")
public class InspectionController {

    private final InspectionService inspectionService;

    public InspectionController(InspectionService inspectionService) {
        this.inspectionService = inspectionService;
    }

    /**
     * ✅ (1) 전체 검수 목록 조회
     * - 검수 완료된 계약 목록을 반환
     */
    @GetMapping
    public ResponseEntity<List<InspectionResponseDto>> getAllInspections() {
        return ResponseEntity.ok(inspectionService.getCompletedContractInspections());
    }

    /**
     * ✅ (2) 특정 검수 조회
     * - 검수 ID를 입력받아 검수 정보를 조회
     * - 존재하지 않으면 404 Not Found 반환
     */
    @GetMapping("/{id}")
    public ResponseEntity<InspectionResponseDto> getInspectionById(@PathVariable Long id) {
        return inspectionService.getInspectionById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * ✅ (3) 검수 등록 (예외 처리 추가)
     * - 요청 데이터를 바탕으로 검수 데이터를 생성
     * - 예외 발생 시 400 Bad Request 반환
     */
    @PostMapping
    public ResponseEntity<?> createInspection(@RequestBody InspectionRequestDto requestDto) {
        try {
            InspectionResponseDto createdInspection = inspectionService.saveInspection(requestDto);
            return ResponseEntity.ok(createdInspection);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("검수 등록 실패: " + e.getMessage());
        }
    }

    /**
     * ✅ (4) 검수 수정 (예외 처리 추가)
     * - 검수 ID와 요청 데이터를 바탕으로 검수 데이터를 수정
     * - 검수가 존재하지 않으면 404 Not Found 반환
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateInspection(@PathVariable Long id, @RequestBody InspectionRequestDto requestDto) {
        try {
            InspectionResponseDto updatedInspection = inspectionService.updateInspection(id, requestDto);
            return ResponseEntity.ok(updatedInspection);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("검수 수정 실패: " + e.getMessage());
        }
    }

    /**
     * ✅ (5) 계약 완료 시 검수 목록 자동 등록
     * - 계약이 완료된 경우 자동으로 검수 목록을 생성
     */
    @PostMapping("/create/{transactionNumber}")
    public ResponseEntity<String> createInspection(@PathVariable String transactionNumber) {
        try {
            inspectionService.createInspectionIfContractCompleted(transactionNumber);
            return ResponseEntity.ok("검수 목록이 성공적으로 생성되었습니다.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("검수 생성 실패: " + e.getMessage());
        }
    }
}