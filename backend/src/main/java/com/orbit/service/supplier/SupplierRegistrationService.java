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

    // 협력업체 목록 조회
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

    // 협력업체 상세 조회
    public SupplierRegistration getSupplierById(Long id) {
        return supplierRegistrationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("협력업체가 존재하지 않습니다."));
    }

    // 협력업체 등록 요청 - DTO를 받는 새 메서드 추가
    public SupplierRegistration registerSupplier(SupplierRegistrationRequestDto requestDto) {
        // 기존 메서드 호출하여 중복 코드 방지
        return registerSupplier(
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
    }

    // 기존 협력업체 등록 요청 메서드 (호환성 유지)
    public SupplierRegistration registerSupplier(
            Long supplierId,
            String businessNo,
            String ceoName,
            String businessType,
            String businessCategory,
            String sourcingCategory,
            String sourcingSubCategory,
            String phoneNumber,
            String headOfficeAddress,
            String comments,
            MultipartFile businessFile
    ) {
        Member supplier = memberRepository.findById(supplierId)
                .orElseThrow(() -> new IllegalArgumentException("회원이 존재하지 않습니다."));

        // 사업자등록번호 중복 체크
        supplierRegistrationRepository.findByBusinessNo(businessNo)
                .ifPresent(existingReg -> {
                    throw new IllegalArgumentException("이미 등록된 사업자등록번호입니다.");
                });

        // 파일 저장 처리
        String storedFileName = null;
        if (businessFile != null && !businessFile.isEmpty()) {
            storedFileName = fileStorageService.storeFile(businessFile);
        }

        SupplierRegistration registration = new SupplierRegistration();
        registration.setSupplier(supplier); // Member 엔티티 참조
        registration.setBusinessNo(businessNo);
        registration.setCeoName(ceoName);
        registration.setBusinessType(businessType);
        registration.setBusinessCategory(businessCategory);
        registration.setSourcingCategory(sourcingCategory);
        registration.setSourcingSubCategory(sourcingSubCategory);
        registration.setPhoneNumber(phoneNumber);
        registration.setHeadOfficeAddress(headOfficeAddress);
        registration.setComments(comments);
        registration.setBusinessFile(storedFileName); // 저장된 파일명만 DB에 저장
        registration.setStatus(new SystemStatus("SUPPLIER", "PENDING")); // 대기중 상태로 설정
        registration.setRegistrationDate(LocalDate.now());

        System.out.println("✅ 협력업체 등록 생성 완료: " + registration.getBusinessNo());
        return supplierRegistrationRepository.save(registration);
    }

    // 협력업체 승인
    public void approveSupplier(Long id) {
        SupplierRegistration registration = getSupplierById(id);
        registration.setStatus(new SystemStatus("SUPPLIER", "APPROVED"));
    }

    // 협력업체 거절
    public void rejectSupplier(Long id, String reason) {
        SupplierRegistration registration = getSupplierById(id);
        registration.setStatus(new SystemStatus("SUPPLIER", "REJECTED"));
        registration.setRejectionReason(reason);
    }

    // 협력업체 일시정지
    public void suspendSupplier(Long id, String reason) {
        SupplierRegistration registration = getSupplierById(id);
        registration.setStatus(new SystemStatus("SUPPLIER", "SUSPENDED"));
        // 필요시 정지 사유 필드 추가
    }

    // 협력업체 블랙리스트 등록
    public void blacklistSupplier(Long id, String reason) {
        SupplierRegistration registration = getSupplierById(id);
        registration.setStatus(new SystemStatus("SUPPLIER", "BLACKLIST"));
        // 필요시 블랙리스트 사유 필드 추가
    }
}