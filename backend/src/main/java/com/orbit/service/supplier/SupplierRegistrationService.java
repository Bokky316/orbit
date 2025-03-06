package com.orbit.service.supplier;

import com.orbit.constant.SupplierStatus;
import com.orbit.entity.Member;
import com.orbit.entity.supplier.SupplierRegistration;
import com.orbit.repository.MemberRepository;
import com.orbit.repository.supplier.SupplierRegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SupplierRegistrationService {
    private final SupplierRegistrationRepository supplierRegistrationRepository;
    private final MemberRepository memberRepository;
    private final FileStorageService fileStorageService;

    // 협력업체 목록 조회
    public List<SupplierRegistration> getSuppliers(SupplierStatus status) {
        return supplierRegistrationRepository.findByStatus(status);
    }

    // 협력업체 상세 조회
    public SupplierRegistration getSupplierById(Long id) {
        return supplierRegistrationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("협력업체가 존재하지 않습니다."));
    }

    // 협력업체 등록 요청
    public SupplierRegistration registerSupplier(Long supplierId, String businessNo, String businessCategory, MultipartFile businessFile) {
        Member supplier = memberRepository.findById(supplierId)
                .orElseThrow(() -> new IllegalArgumentException("회원이 존재하지 않습니다."));

        // 파일 저장 처리
        String storedFileName = fileStorageService.storeFile(businessFile);

        SupplierRegistration registration = new SupplierRegistration();
        registration.setSupplier(supplier);
        registration.setBusinessNo(businessNo);
        registration.setBusinessCategory(businessCategory);
        registration.setBusinessFile(storedFileName); // 저장된 파일명만 DB에 저장
        registration.setStatus(SupplierStatus.PENDING);
        registration.setRegistrationDate(LocalDate.now());

        return supplierRegistrationRepository.save(registration);
    }

    // 협력업체 승인
    public void approveSupplier(Long id) {
        SupplierRegistration registration = getSupplierById(id);
        registration.setStatus(SupplierStatus.APPROVED);
    }

    // 협력업체 거절
    public void rejectSupplier(Long id, String reason) {
        SupplierRegistration registration = getSupplierById(id);
        registration.setStatus(SupplierStatus.REJECTED);
        registration.setRejectionReason(reason);
    }
}
