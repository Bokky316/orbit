package com.orbit.controller.supplier;

import com.orbit.constant.SupplierStatus;
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
@RequestMapping("/api/supplier-registrations")  // 경로를 Security Config와 일치시킴
@RequiredArgsConstructor
public class SupplierRegistrationController {
    private final SupplierRegistrationService supplierRegistrationService;

    // ✅ 협력업체 목록 조회 (ADMIN만 접근 가능)
    //@PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<?> getSuppliers(@RequestParam(required = false) String status) {
        try {
            System.out.println("🔍 API 호출됨: /api/supplier-registrations, 상태값: " + status);

            List<SupplierRegistration> suppliers;

            if (status == null || status.isEmpty()) {
                System.out.println("✅ status 값 없음 → 전체 데이터 조회");
                suppliers = supplierRegistrationService.getSuppliers(null);
            } else {
                // 유효한 status 값 검증 (PENDING, APPROVED, REJECTED, SUSPENDED, BLACKLIST)
                if (!Arrays.asList("PENDING", "APPROVED", "REJECTED", "SUSPENDED", "BLACKLIST").contains(status.toUpperCase())) {
                    return ResponseEntity.badRequest().body("❌ 잘못된 상태 값입니다. (PENDING, APPROVED, REJECTED, SUSPENDED, BLACKLIST 중 하나여야 함)");
                }
                suppliers = supplierRegistrationService.getSuppliers(status.toUpperCase());
            }

            System.out.println("✅ 조회된 협력업체 수: " + suppliers.size());

            List<SupplierRegistrationResponseDto> response = suppliers.stream()
                    .map(SupplierRegistrationResponseDto::fromEntity)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ 서버 오류 발생: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("❌ 서버 오류 발생: " + e.getMessage());
        }
    }

    // ✅ 협력업체 상세 조회 (ADMIN만 접근 가능)
    //@PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<SupplierRegistrationResponseDto> getSupplier(@PathVariable Long id) {
        SupplierRegistration supplier = supplierRegistrationService.getSupplierById(id);
        return ResponseEntity.ok(SupplierRegistrationResponseDto.fromEntity(supplier));
    }

    // ✅ 협력업체 등록 요청 (SUPPLIER만 가능)
    //@PreAuthorize("hasRole('SUPPLIER')")
    @PostMapping
    public ResponseEntity<SupplierRegistrationResponseDto> registerSupplier(
            @Valid @ModelAttribute SupplierRegistrationRequestDto requestDto) {

        SupplierRegistration registration = supplierRegistrationService.registerSupplier(
                requestDto.getSupplierId(),
                requestDto.getBusinessNo(),
                requestDto.getCeoName(),
                requestDto.getBusinessType(),
                requestDto.getBusinessCategory(),
                requestDto.getSourcingCategory(),
                requestDto.getSourcingSubCategory(),
                requestDto.getPhoneNumber(),
                requestDto.getHeadOfficeAddress(),
                requestDto.getComments(),
                requestDto.getBusinessFile()
        );

        return ResponseEntity.ok(SupplierRegistrationResponseDto.fromEntity(registration));
    }

    // ✅ 협력업체 승인/거절 처리 (ADMIN만 가능)
    //@PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/status")
    public ResponseEntity<Void> updateSupplierStatus(@PathVariable Long id,
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
                throw new IllegalArgumentException("지원하지 않는 상태 코드입니다.");
        }
        return ResponseEntity.ok().build();
    }
}
