package com.orbit.service.supplier;

import com.orbit.dto.supplier.SupplierRegistrationRequestDto;
import com.orbit.entity.member.Member;
import com.orbit.entity.state.SystemStatus;
import com.orbit.entity.supplier.SupplierRegistration;
import com.orbit.repository.member.MemberRepository;
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

    /**
     * 🔹 협력업체 목록 조회
     */
    public List<SupplierRegistration> getSuppliers(String statusCode) {
        System.out.println("🔍 StatusCode: " + statusCode);

        if (statusCode == null) {
            List<SupplierRegistration> allSuppliers = supplierRegistrationRepository.findAll();
            System.out.println("✅ 전체 조회, 총 개수: " + allSuppliers.size());
            return allSuppliers;
        }

        List<SupplierRegistration> filteredSuppliers = supplierRegistrationRepository.findByStatusChildCode(statusCode);
        System.out.println("✅ 상태별 조회, 총 개수: " + filteredSuppliers.size());

        return filteredSuppliers;
    }

    /**
     * 🔹 협력업체 상세 조회
     */
    public SupplierRegistration getSupplierById(Long id) {
        return supplierRegistrationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("협력업체가 존재하지 않습니다."));
    }

    /**
     * 🔹 협력업체 등록 요청 (파일 업로드 포함)
     */
    public SupplierRegistration registerSupplier(SupplierRegistrationRequestDto requestDto) {
        // 회원 존재 여부 확인
        Member supplier = memberRepository.findById(requestDto.getSupplierId())
                .orElseThrow(() -> new IllegalArgumentException("회원이 존재하지 않습니다."));

        // 사업자등록번호 중복 체크
        supplierRegistrationRepository.findByBusinessNo(requestDto.getBusinessNo())
                .ifPresent(existingReg -> {
                    throw new IllegalArgumentException("이미 등록된 사업자등록번호입니다.");
                });

        // 저장된 파일 경로를 그대로 사용
        String storedFilePath = requestDto.getBusinessFilePath();

        SupplierRegistration registration = new SupplierRegistration();
        registration.setSupplier(supplier);
        registration.setBusinessNo(requestDto.getBusinessNo());
        registration.setCeoName(requestDto.getCeoName());
        registration.setBusinessType(requestDto.getBusinessType());
        registration.setBusinessCategory(requestDto.getBusinessCategory());
        registration.setSourcingCategory(requestDto.getSourcingCategory());
        registration.setSourcingSubCategory(requestDto.getSourcingSubCategory());
        registration.setPhoneNumber(requestDto.getPhoneNumber());
        registration.setHeadOfficeAddress(requestDto.getHeadOfficeAddress());
        registration.setComments(requestDto.getComments());
        registration.setBusinessFile(storedFilePath); // 🔹 파일 경로 저장
        registration.setStatus(new SystemStatus("SUPPLIER", "PENDING"));
        registration.setRegistrationDate(LocalDate.now());

        return supplierRegistrationRepository.save(registration);
    }


    /**
     * 🔹 협력업체 승인
     */
    public void approveSupplier(Long id) {
        SupplierRegistration registration = getSupplierById(id);
        registration.setStatus(new SystemStatus("SUPPLIER", "APPROVED"));
    }

    /**
     * 🔹 협력업체 거절
     */
    public void rejectSupplier(Long id, String reason) {
        SupplierRegistration registration = getSupplierById(id);
        registration.setStatus(new SystemStatus("SUPPLIER", "REJECTED"));
        registration.setRejectionReason(reason);
    }

    /**
     * 🔹 협력업체 일시정지
     */
    public void suspendSupplier(Long id, String reason) {
        SupplierRegistration registration = getSupplierById(id);
        registration.setStatus(new SystemStatus("SUPPLIER", "SUSPENDED"));
        registration.setRejectionReason(reason);
    }

    /**
     * 🔹 협력업체 블랙리스트 등록
     */
    public void blacklistSupplier(Long id, String reason) {
        SupplierRegistration registration = getSupplierById(id);
        registration.setStatus(new SystemStatus("SUPPLIER", "BLACKLIST"));
        registration.setRejectionReason(reason);
    }
}
