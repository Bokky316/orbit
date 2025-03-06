package com.orbit.controller.supplier;

import com.orbit.constant.SupplierStatus;
import com.orbit.dto.supplier.SupplierApprovalDto;
import com.orbit.dto.supplier.SupplierRegistrationRequestDto;
import com.orbit.dto.supplier.SupplierRegistrationResponseDto;
import com.orbit.entity.supplier.SupplierRegistration;
import com.orbit.service.supplier.SupplierRegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/suppliers")
@RequiredArgsConstructor
public class SupplierRegistrationController {
    private final SupplierRegistrationService supplierRegistrationService;

    // 협력업체 목록 조회
    @GetMapping
    public ResponseEntity<List<SupplierRegistrationResponseDto>> getSuppliers(@RequestParam(required = false) SupplierStatus status) {
        List<SupplierRegistrationResponseDto> suppliers = supplierRegistrationService.getSuppliers(status)
                .stream().map(SupplierRegistrationResponseDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(suppliers);
    }

    // 협력업체 상세 조회
    @GetMapping("/{id}")
    public ResponseEntity<SupplierRegistrationResponseDto> getSupplier(@PathVariable Long id) {
        SupplierRegistration supplier = supplierRegistrationService.getSupplierById(id);
        return ResponseEntity.ok(SupplierRegistrationResponseDto.fromEntity(supplier));
    }

    // 협력업체 등록 요청
    @PostMapping
    public ResponseEntity<SupplierRegistrationResponseDto> registerSupplier(
            @Valid @ModelAttribute SupplierRegistrationRequestDto requestDto) {

        SupplierRegistration registration = supplierRegistrationService.registerSupplier(
                requestDto.getSupplierId(),
                requestDto.getBusinessNo(),
                requestDto.getBusinessCategory(),
                requestDto.getBusinessFile()
        );

        return ResponseEntity.ok(SupplierRegistrationResponseDto.fromEntity(registration));
    }

    // 협력업체 승인/거절 처리
    @PutMapping("/{id}/status")
    public ResponseEntity<Void> updateSupplierStatus(@PathVariable Long id,
                                                     @Valid @RequestBody SupplierApprovalDto requestDto) {
        if (requestDto.getStatus() == SupplierStatus.REJECTED) {
            supplierRegistrationService.rejectSupplier(id, requestDto.getRejectionReason());
        } else {
            supplierRegistrationService.approveSupplier(id);
        }
        return ResponseEntity.ok().build();
    }
}
