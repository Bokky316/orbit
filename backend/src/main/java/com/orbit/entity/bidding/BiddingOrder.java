package com.orbit.entity.bidding;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.orbit.entity.BaseEntity;
import com.orbit.entity.Notification;
import com.orbit.entity.member.Member;
import com.orbit.entity.procurement.PurchaseRequestItem;
import com.orbit.repository.NotificationRepository;
import com.orbit.repository.member.MemberRepository;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "bidding_orders")
@Setter @Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BiddingOrder extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true)
    private String orderNumber; // 발주 번호
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidding_id", insertable = false, updatable = false)
    private Bidding bidding; // 연관된 입찰
    
    @Column(name = "bidding_id", nullable = false)
    private Long biddingId; // 입찰 ID
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidding_participation_id", insertable = false, updatable = false)
    private BiddingParticipation biddingParticipation; // 입찰자 참여 정보
    
    @Column(name = "bidding_participation_id", nullable = false)
    private Long biddingParticipationId; // 입찰 참여 ID
    
    @Column(name = "purchase_request_item_id", nullable = false)
    private Long purchaseRequestItemId; // 구매 요청 품목 ID

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_request_item_id", insertable = false, updatable = false)
    private PurchaseRequestItem purchaseRequestItem;
    
    @Column(name = "supplier_id", nullable = false)
    private Long supplierId; // 공급자 ID
    
    @Column(name = "supplier_name")
    private String supplierName; // 공급자명
    
    @Column(name = "is_selected_bidder", columnDefinition = "boolean default true")
    private boolean isSelectedBidder; // 낙찰자 여부
    
    @Column(name = "bidder_selected_at")
    private LocalDateTime bidderSelectedAt; // 낙찰자 선정 일시
    
    @Column(nullable = false)
    private String title; // 발주 제목
    
    @Column(columnDefinition = "TEXT")
    private String description; // 발주 설명
    
    @Column(name = "quantity", nullable = false)
    private Integer quantity; // 수량
    
    @Column(name = "unit_price")
    private BigDecimal unitPrice; // 단가
    
    @Column(name = "supply_price")
    private BigDecimal supplyPrice; // 공급가액
    
    @Column(name = "vat")
    private BigDecimal vat; // 부가세
    
    @Column(name = "total_amount")
    private BigDecimal totalAmount; // 총액
    
    @Column(columnDefinition = "TEXT")
    private String terms; // 계약 조건
    
    @Column(name = "expected_delivery_date")
    private LocalDate expectedDeliveryDate; // 예상 납품일
    
    private LocalDateTime approvedAt; // 승인 일시
    
    @Column(name = "approval_by_id")
    private Long approvalById; // 승인자 ID

    @Column(name = "evaluation_id")
    private Long evaluationId; // 평가 ID
    
    @Column(name = "created_by")
    private String createdBy; // // 생성자 ID
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt; // 생성일시
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt; // 수정일시

    @Column(name = "deleted")
    @Builder.Default
    private Boolean deleted = false; // 삭제 여부 필드
    
    
    /**
     * 발주 승인 + 알림 발송
     */
    public void approve(Member approver, NotificationRepository notificationRepo, MemberRepository memberRepository) {
        this.approvedAt = LocalDateTime.now();
        this.approvalById = approver.getId();
        this.updatedAt = LocalDateTime.now();
        
        
        // 알림 발송
        if (notificationRepo != null && memberRepository != null) {
            try {
                // 공급자에게 알림
                Member supplier = memberRepository.findById(this.supplierId).orElse(null);
                if (supplier != null) {
                    Notification notification = Notification.builder()
                        .user(supplier)
                        .title("발주 승인 완료")
                        .content("발주 '" + this.orderNumber + "'이(가) 승인되었습니다.")
                        .type(Notification.NotificationType.입찰공고)
                        .relatedId(this.id)
                        .isRead(false)
                        .build();
                    notificationRepo.save(notification);
                }

                // 생성자에게도 알림 (생성자와 승인자가 다른 경우)
                if (!approver.getId().equals(this.createdBy)) {
                    Member creator = memberRepository.findByUsername(this.createdBy).orElse(null);
                    if (creator != null) {
                        Notification notification = Notification.builder()
                            .user(creator)
                            .title("발주 승인 완료")
                            .content("발주 '" + this.orderNumber + "'이(가) " + approver.getName() + "님에 의해 승인되었습니다.")
                            .type(Notification.NotificationType.입찰공고)
                            .relatedId(this.id)
                            .isRead(false)
                            .build();
                        notificationRepo.save(notification);
                    }
                }
            } catch (Exception e) {
                // 알림 발송 실패 (로깅 필요)
                System.err.println("발주 승인 알림 발송 실패: " + e.getMessage());
            }
        }
    }
    
    
    /**
     * 납품 예정일 업데이트 + 알림 발송
     */
    public void updateDeliveryDate(
        LocalDate newDeliveryDate, 
        Member updatedBy,
        NotificationRepository notificationRepo, 
        MemberRepository memberRepository
    ) {
        LocalDate oldDeliveryDate = this.expectedDeliveryDate;
        this.expectedDeliveryDate = newDeliveryDate;
        this.updatedAt = LocalDateTime.now();
        
        // 알림 발송
        if (notificationRepo != null && memberRepository != null) {
            try {
                // 공급자에게 알림
                Member supplier = memberRepository.findById(this.supplierId).orElse(null);
                if (supplier != null) {
                    Notification notification = Notification.builder()
                        .user(supplier)
                        .title("납품 예정일 변경")
                        .content("발주 '" + this.orderNumber + "'의 납품 예정일이 " + 
                                oldDeliveryDate + "에서 " + newDeliveryDate + "(으)로 변경되었습니다.")
                        .type(Notification.NotificationType.입찰공고)
                        .relatedId(this.id)
                        .isRead(false)
                        .build();
                    notificationRepo.save(notification);
                }

                // 생성자에게도 알림 (생성자와 변경자가 다른 경우)
                if (this.createdBy != null && !updatedBy.getId().equals(this.supplierId)) {
                    Member creator = memberRepository.findByUsername(this.createdBy).orElse(null);
                    if (creator != null) {
                        Notification notification = Notification.builder()
                        .user(creator)
                        .title("납품 예정일 변경")
                        .content("발주 '" + this.orderNumber + "'의 납품 예정일이 " + 
                                oldDeliveryDate + "에서 " + newDeliveryDate + "(으)로 변경되었습니다.")
                        .type(Notification.NotificationType.입찰공고)
                        .relatedId(this.id)
                        .isRead(false)
                        .build();
                        notificationRepo.save(notification);
                    }
                }

            } catch (Exception e) {
                // 알림 발송 실패 (로깅 필요)
                System.err.println("납품 예정일 변경 알림 발송 실패: " + e.getMessage());
            }
        }
    }
    
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        
        // 발주번호 자동 생성
        if (this.orderNumber == null) {
            String datePart = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyMMdd"));
            String randomPart = String.format("%03d", new java.util.Random().nextInt(1000));
            this.orderNumber = "ORD-" + datePart + "-" + randomPart;
        }
        
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public String getItemName() {
        return this.purchaseRequestItem != null && this.purchaseRequestItem.getItem() != null
                ? this.purchaseRequestItem.getItem().getName()
                : null;
    }
}