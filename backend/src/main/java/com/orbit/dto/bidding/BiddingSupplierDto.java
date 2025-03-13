package com.orbit.dto.bidding;

import java.time.LocalDateTime;
import java.util.List;

import com.orbit.entity.bidding.BiddingSupplier;
import com.orbit.entity.member.Member;
import com.orbit.entity.supplier.SupplierRegistration;
import com.orbit.repository.supplier.SupplierRegistrationRepository;

import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.BiddingSupplier;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 입찰 공고의 공급사 연결 정보 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BiddingSupplierDto {
    private Long id;
    
    // 연관 엔티티
    private Bidding bidding;
    private Long biddingId;
    private String bidNumber;
    private String bidTitle;
    
    // 공급사 정보
    private Long supplierId;
    private String supplierName;
    private String supplierBusinessNo;
    private String supplierEmail;
    private String phoneNumber;
    private String ceoName;
    private String businessType;
    private String businessCategory;
    
    // 알림 및 응답 정보
    private Boolean notificationSent;
    private LocalDateTime notificationDate;
    private String responseStatus;
    private LocalDateTime responseDate;
    private String responseComment;
    private Boolean isParticipating;
    private LocalDateTime participationDate;
    private Boolean isRejected;
    private LocalDateTime rejectionDate;
    private String rejectionReason;
    
    // 생성 시간
    private LocalDateTime createdAt;
    
    /**
     * 엔티티를 DTO로 변환
     */
    public static BiddingSupplierDto fromEntity(BiddingSupplier entity) {
        if (entity == null) {
            return null;
        }
        
        BiddingSupplierDtoBuilder builder = BiddingSupplierDto.builder()
                .id(entity.getId())
                .createdAt(entity.getCreatedAt());
        
        // Bidding 정보 설정
        if (entity.getBidding() != null) {
            builder.biddingId(entity.getBidding().getId())
                  .bidNumber(entity.getBidding().getBidNumber())
                  .bidTitle(entity.getBidding().getTitle());
        }
        
        // 공급사 기본 정보 설정
        builder.supplierName(entity.getCompanyName());
        
        // Member(공급사) 정보 설정
        if (entity.getSupplier() != null) {
            Member supplier = entity.getSupplier();
            builder.supplierId(supplier.getId())
                   .supplierEmail(supplier.getEmail());
        }
        
        // 알림 및 응답 정보 설정
        builder.notificationSent(entity.getNotificationSent())
               .notificationDate(entity.getNotificationDate())
               .responseStatus(entity.getResponseStatus())
               .responseDate(entity.getResponseDate())
               .responseComment(entity.getResponseComment())
               .isParticipating(entity.getIsParticipating())
               .participationDate(entity.getParticipationDate())
               .isRejected(entity.getIsRejected())
               .rejectionDate(entity.getRejectionDate())
               .rejectionReason(entity.getRejectionReason());
        
        return builder.build();
    }
    
    /**
     * 사업자번호 정보를 포함하여 DTO 생성
     */
    public static BiddingSupplierDto fromEntityWithBusinessNo(BiddingSupplier entity, SupplierRegistrationRepository supplierRegRepo) {
        BiddingSupplierDto dto = fromEntity(entity);
        
        if (dto != null && entity.getSupplier() != null && supplierRegRepo != null) {
            try {
                // 공급사의 등록 정보 조회
                List<SupplierRegistration> registrations = supplierRegRepo.findBySupplier(entity.getSupplier());
                if (!registrations.isEmpty()) {
                    SupplierRegistration registration = registrations.get(0);
                    dto.setSupplierBusinessNo(registration.getBusinessNo());
                    dto.setCeoName(registration.getCeoName());
                    dto.setPhoneNumber(registration.getPhoneNumber());
                    dto.setBusinessType(registration.getBusinessType());
                    dto.setBusinessCategory(registration.getBusinessCategory());
                }
            } catch (Exception e) {
                // 오류 처리
                System.err.println("공급사 정보 조회 실패: " + e.getMessage());
            }
        }
        
        return dto;
    }
    
    /**
     * 응답 상태 확인
     */
    public boolean isResponded() {
        return (this.isParticipating != null && this.isParticipating) || 
               (this.isRejected != null && this.isRejected);
    }
}