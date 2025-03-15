package com.orbit.dto.supplier;

import com.orbit.entity.commonCode.SystemStatus;
import com.orbit.entity.supplier.SupplierRegistration;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SupplierRegistrationResponseDto {

    private Long id;

    private String supplierName; // 회사명

    private String businessNo; // 사업자등록번호

    private String businessCategory; // 업종

    private SystemStatus status; // 상태 (SystemStatus 타입으로 변경)

    private LocalDate registrationDate; // 등록 요청일

    private String ceoName; // 대표자명

    private String businessType; // 업태

    private String sourcingCategory; // 소싱대분류

    private String sourcingSubCategory; // 소싱중분류

    private String sourcingDetailCategory; // 소싱소분류 추가

    private String phoneNumber; // 전화번호

    private String postalCode; // 우편번호 (최대 길이 10)

    private String roadAddress; // 도로명 주소

    private String detailAddress; // 상세 주소

    private String comments; // 의견

    private String rejectionReason; // 반려 사유 필드 추가

    // 담당자 관련 필드 추가
    private String contactPerson; // 담당자 이름

    private String contactPhone; // 담당자 연락처

    private String contactEmail; // 담당자 이메일

    // 첨부 파일 목록 추가
    private List<SupplierAttachmentDto> attachments;

    // 상태 코드 및 이름 조회 편의 메서드 (클라이언트 표시용)
    private String getStatusCode() {
        return status != null ? status.getChildCode() : null;
    }

    private String getStatusFullCode() {
        return status != null ? status.getFullCode() : null;
    }

    // 이전 버전과의 호환성을 위한 getter
    public String getBusinessFile() {
        if (this.attachments != null && !this.attachments.isEmpty()) {
            return this.attachments.get(0).getFilePath();
        }
        return null;
    }

    /**
     * Entity -> DTO 변환 메서드
     */
    public static SupplierRegistrationResponseDto fromEntity(SupplierRegistration supplierRegistration) {
        SupplierRegistrationResponseDto dto = new SupplierRegistrationResponseDto(
                supplierRegistration.getId(),
                supplierRegistration.getSupplier().getCompanyName(),  // Member 엔티티의 회사명 참조
                supplierRegistration.getBusinessNo(),
                supplierRegistration.getBusinessCategory(),
                supplierRegistration.getStatus(),
                supplierRegistration.getRegistrationDate(),
                supplierRegistration.getCeoName(),
                supplierRegistration.getBusinessType(),
                supplierRegistration.getSourcingCategory(),
                supplierRegistration.getSourcingSubCategory(),
                supplierRegistration.getSourcingDetailCategory(),
                supplierRegistration.getPhoneNumber(),
                supplierRegistration.getPostalCode(),  // 우편번호 (최대 길이 10)
                supplierRegistration.getRoadAddress(),  // 도로명 주소
                supplierRegistration.getDetailAddress(),  // 상세 주소
                supplierRegistration.getComments(),
                supplierRegistration.getRejectionReason(),
                supplierRegistration.getContactPerson(),  // 담당자 이름 추가
                supplierRegistration.getContactPhone(),   // 담당자 연락처 추가
                supplierRegistration.getContactEmail(),   // 담당자 이메일 추가
                new ArrayList<>()
        );

        // 첨부 파일 목록 변환
        if (supplierRegistration.getAttachments() != null && !supplierRegistration.getAttachments().isEmpty()) {
            dto.setAttachments(supplierRegistration.getAttachments().stream()
                    .map(attachment -> SupplierAttachmentDto.builder()
                            .id(attachment.getId())
                            .fileName(attachment.getFileName())
                            .filePath(attachment.getFilePath())
                            .fileType(attachment.getFileType())
                            .fileSize(attachment.getFileSize())
                            .build())
                    .collect(Collectors.toList()));
        }

        return dto;
    }
}