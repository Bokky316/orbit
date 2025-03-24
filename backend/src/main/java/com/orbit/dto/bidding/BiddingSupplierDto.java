package com.orbit.dto.bidding;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.orbit.entity.bidding.BiddingSupplier;
import com.orbit.entity.supplier.SupplierRegistration;
import com.orbit.repository.supplier.SupplierRegistrationRepository;

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
    private Long biddingId;
    private Long supplierId;
    private String companyName;
    private String businessNo;
    private String contactEmail;
    private String contactPhone;
    private Boolean notificationSent;
    private Boolean isParticipating;
    private Boolean isRejected;
    private String rejectionReason;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime invitedAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime participationDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime rejectionDate;
    
    public static BiddingSupplierDto fromEntity(BiddingSupplier entity) {
        if (entity == null) {
            return null;
        }
        
        return BiddingSupplierDto.builder()
                .id(entity.getId())
                .biddingId(entity.getBidding() != null ? entity.getBidding().getId() : null)
                .supplierId(entity.getSupplier() != null ? entity.getSupplier().getId() : null)
                .companyName(entity.getCompanyName())
                .notificationSent(entity.getNotificationSent())
                .invitedAt(entity.getCreatedAt())
                .isParticipating(entity.getIsParticipating())
                .isRejected(entity.getIsRejected())
                .rejectionReason(entity.getRejectionReason())
                .participationDate(entity.getParticipationDate())
                .rejectionDate(entity.getRejectionDate())
                .build();
    }
    
        public static BiddingSupplierDto fromEntityWithBusinessNo(BiddingSupplier entity, 
            SupplierRegistrationRepository supplierRegistrationRepository) {
            BiddingSupplierDto dto = fromEntity(entity);
            if (dto != null && entity.getSupplier() != null) {
                List<SupplierRegistration> registrations = supplierRegistrationRepository
                        .findBySupplier(entity.getSupplier());
                
                if (!registrations.isEmpty()) {
                    SupplierRegistration registration = registrations.get(0);
                    dto.setBusinessNo(registration.getBusinessNo());
                    dto.setContactEmail(registration.getContactEmail());
                    dto.setContactPhone(registration.getPhoneNumber());
                }
            }
        return dto;
    }
}