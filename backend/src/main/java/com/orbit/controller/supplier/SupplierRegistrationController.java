package com.orbit.controller.supplier;

import com.orbit.dto.supplier.SupplierApprovalDto;
import com.orbit.dto.supplier.SupplierRegistrationRequestDto;
import com.orbit.dto.supplier.SupplierRegistrationResponseDto;
import com.orbit.entity.supplier.SupplierRegistration;
import com.orbit.service.supplier.SupplierRegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/supplier-registrations") // 기본 경로 유지
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPPLIER')") // 클래스 레벨 공통 권한 설정
public class SupplierRegistrationController {

    private final SupplierRegistrationService supplierRegistrationService;

    // 🟢 협력업체 목록 조회
    @GetMapping
    public ResponseEntity<List<SupplierRegistrationResponseDto>> getSuppliers(
            @RequestParam(required = false) String status) {

        try {
            List<SupplierRegistration> suppliers;
            if (status == null || status.isEmpty()) {
                suppliers = supplierRegistrationService.getSuppliers(null);
            } else {
                if (!Arrays.asList("PENDING", "APPROVED", "REJECTED", "SUSPENDED", "BLACKLIST")
                        .contains(status.toUpperCase())) {
                    return ResponseEntity.badRequest().body(List.of());
                }
                suppliers = supplierRegistrationService.getSuppliers(status.toUpperCase());
            }
            List<SupplierRegistrationResponseDto> response = suppliers.stream()
                    .map(SupplierRegistrationResponseDto::fromEntity)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }

    // 🟢 협력업체 상세 조회
    @GetMapping("/{id}/detail")
    public ResponseEntity<SupplierRegistrationResponseDto> getSupplier(@PathVariable Long id) {
        SupplierRegistration supplier = supplierRegistrationService.getSupplierById(id);
        return ResponseEntity.ok(SupplierRegistrationResponseDto.fromEntity(supplier));
    }

    // 🟢 협력업체 등록 (SUPPLIER 전용) - 파일 업로드 제거 후, 파일 경로만 받도록 변경
    @PostMapping
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<SupplierRegistrationResponseDto> registerSupplier(
            @RequestBody SupplierRegistrationRequestDto requestDto) {

        try {
            SupplierRegistration registration = supplierRegistrationService.registerSupplier(requestDto);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(SupplierRegistrationResponseDto.fromEntity(registration));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // 🟢 상태 업데이트 (ADMIN 전용)
    @PutMapping("/status/{id}") // 경로 구조 변경
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateSupplierStatus(
            @PathVariable Long id,
            @Valid @RequestBody SupplierApprovalDto requestDto) {

        switch(requestDto.getStatusCode().toUpperCase()) {
            case "REJECTED":
                supplierRegistrationService.rejectSupplier(id, requestDto.getRejectionReason());
                break;
            case "APPROVED":
                supplierRegistrationService.approveSupplier(id);
                break;
            case "SUSPENDED":
                supplierRegistrationService.suspendSupplier(id, requestDto.getRejectionReason());
                break;
            case "BLACKLIST":
                supplierRegistrationService.blacklistSupplier(id, requestDto.getRejectionReason());
                break;
            default:
                throw new IllegalArgumentException("Invalid status code");
        }
        return ResponseEntity.noContent().build();
    }
}
