package com.orbit.dto.bidding;

import java.time.LocalDateTime;

import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.BiddingSupplier;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
    
    // 공급자 정보
    private Long supplierId;
    private String companyName;
    
    // 알림 정보
    private Boolean notificationSent;
    private LocalDateTime notificationDate;
    
    // 참여 정보
    private Boolean isParticipating;
    private LocalDateTime participationDate;
    
    // 거부 정보
    private Boolean isRejected;
    private LocalDateTime rejectionDate;
    private String rejectionReason;
    
    // 생성 정보
    private LocalDateTime createdAt;
    
    // Entity -> DTO 변환
    public static BiddingSupplierDto fromEntity(BiddingSupplier entity) {
        if (entity == null) {
            return null;
        }
        
        return BiddingSupplierDto.builder()
                .id(entity.getId())
                .bidding(entity.getBidding())
                .biddingId(entity.getBiddingId())
                .supplierId(entity.getSupplierId())
                .companyName(entity.getCompanyName())
                .notificationSent(entity.getNotificationSent())
                .notificationDate(entity.getNotificationDate())
                .isParticipating(entity.getIsParticipating())
                .participationDate(entity.getParticipationDate())
                .isRejected(entity.getIsRejected())
                .rejectionDate(entity.getRejectionDate())
                .rejectionReason(entity.getRejectionReason())
                .createdAt(entity.getCreatedAt())
                .build();
    }
    
    // DTO -> Entity 변환
    public BiddingSupplier toEntity() {
        return BiddingSupplier.builder()
                .id(this.id)
                .biddingId(this.biddingId)
                .supplierId(this.supplierId)
                .companyName(this.companyName)
                .notificationSent(this.notificationSent)
                .notificationDate(this.notificationDate)
                .isParticipating(this.isParticipating)
                .participationDate(this.participationDate)
                .isRejected(this.isRejected)
                .rejectionDate(this.rejectionDate)
                .rejectionReason(this.rejectionReason)
                .build();
    }
}