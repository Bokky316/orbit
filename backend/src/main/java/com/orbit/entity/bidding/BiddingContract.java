package com.orbit.entity.bidding;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.orbit.entity.BaseEntity;
import com.orbit.entity.Notification;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.entity.commonCode.StatusHistory;
import com.orbit.entity.member.Member;
import com.orbit.repository.NotificationRepository;
import com.orbit.repository.member.MemberRepository;
import com.orbit.util.PriceCalculator;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "bidding_contracts")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BiddingContract extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transaction_number", nullable = false, unique = true, length = 50)
    private String transactionNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidding_id", nullable = false)
    private Bidding bidding;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidding_participation_id", nullable = false)
    private BiddingParticipation biddingParticipation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Member supplier;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "delivery_date")
    private LocalDate deliveryDate;

    @Column(name = "total_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 19, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "supply_price", precision = 19, scale = 2)
    private BigDecimal supplyPrice;

    @Column(name = "vat", precision = 19, scale = 2)
    private BigDecimal vat;

    // 상태 관리 시스템 - CommonCodeDataInitializer와 연동
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_parent_id")
    private ParentCode statusParent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_child_id")
    private ChildCode statusChild;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "contract_file_path")
    private String contractFilePath;

    @Column(name = "buyer_signature", columnDefinition = "TEXT")
    private String buyerSignature;

    @Column(name = "buyer_signed_at")
    private LocalDateTime buyerSignedAt;

    @Column(name = "supplier_signature", columnDefinition = "TEXT")
    private String supplierSignature;

    @Column(name = "supplier_signed_at")
    private LocalDateTime supplierSignedAt;

    @OneToMany(mappedBy = "biddingContract", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StatusHistory> statusHistories = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private Member updatedBy;

    /**
     * 계약 상태가 자동으로 업데이트되어야 하는지 확인
     * 두 서명이 모두 있으면 완료 상태로 변경
     */
    // 하나의 @PreUpdate 메서드로 통합
    @PreUpdate
    public void beforeUpdate() {
        // 서명 상태 확인
        if (buyerSignature != null && supplierSignature != null) {
            // 초안 또는 진행중 상태에서만 자동 변경
            if (isDraft() || isInProgress()) {
                // 상태를 직접 설정
                setStatusEnum(ContractStatus.완료);
            }
        }
        
        // 가격 재계산
        if (this.unitPrice != null && this.quantity != null) {
            // PriceCalculator 유틸리티를 사용하여 계산
            PriceCalculator.PriceResult result = 
                PriceCalculator.calculateAll(this.unitPrice, this.quantity);
            
            this.supplyPrice = result.getSupplyPrice();
            this.vat = result.getVat();
            this.totalAmount = result.getTotalAmount();
        }
    }
    /**
     * 계약 금액 재계산
     * 단가와 수량에 기반하여 공급가액, 부가세, 총액을 계산
     */
    public void recalculatePrices() {
        if (this.unitPrice == null || this.quantity == null) {
            return;
        }
        
        // PriceCalculator 유틸리티를 사용하여 계산
        PriceCalculator.PriceResult result = 
            PriceCalculator.calculateAll(this.unitPrice, this.quantity);
        
        this.supplyPrice = result.getSupplyPrice();
        this.vat = result.getVat();
        this.totalAmount = result.getTotalAmount();
    }

    /**
     * 서명 상태를 확인하고 필요시 계약 상태를 업데이트합니다.
     */
    public void checkSignatureStatus() {
        if (buyerSignature != null && supplierSignature != null) {
            // 초안 또는 진행중 상태에서만 자동 변경
            if (isDraft() || isInProgress()) {
                // 상태를 직접 설정
                setStatusEnum(ContractStatus.완료);
            }
        }
    }

    /**
     * 구매자 서명
     */
    public void signByBuyer(String signature, Member buyer, NotificationRepository notificationRepo) {
        this.buyerSignature = signature;
        this.buyerSignedAt = LocalDateTime.now();
        this.updatedBy = buyer;
        
        // 알림 발송 (공급자에게)
        try {
            if (supplier != null) {
                Notification notification = Notification.createContractNotification(
                    supplier,
                    "구매자 서명 완료",
                    "계약 '" + this.transactionNumber + "'에 구매자 서명이 완료되었습니다. 공급자 서명을 진행해주세요.",
                    this.id
                );
                notificationRepo.save(notification);
            }
        } catch (Exception e) {
            // 알림 발송 실패 (로깅 필요)
            System.err.println("구매자 서명 알림 발송 실패: " + e.getMessage());
        }
        
        // 서명 상태 확인하여 자동 상태 변경 처리
        checkSignatureStatus();
    }

    /**
     * 공급자 서명
     */
    public void signBySupplier(String signature, NotificationRepository notificationRepo, MemberRepository memberRepo) {
        this.supplierSignature = signature;
        this.supplierSignedAt = LocalDateTime.now();
        this.updatedBy = supplier;
        
        // 알림 발송 (구매자에게)
        try {
            // 생성자 이름(String) 가져오기
            String creatorUsername = getBidding().getCreatedBy();
            if (creatorUsername != null && !creatorUsername.isEmpty()) {
                // MemberRepository를 통해 Member 객체 조회
                Member buyer = memberRepo.findByUsername(creatorUsername).orElse(null);
                if (buyer != null) {
                    Notification notification = Notification.createContractNotification(
                        buyer,
                        "공급자 서명 완료",
                        "계약 '" + this.transactionNumber + "'에 공급자 서명이 완료되었습니다.",
                        this.id
                    );
                    notificationRepo.save(notification);
                }
            }
        } catch (Exception e) {
            // 알림 발송 실패 (로깅 필요)
            System.err.println("공급자 서명 알림 발송 실패: " + e.getMessage());
        }
        
        // 서명 상태 확인하여 자동 상태 변경 처리
        checkSignatureStatus();
    }

    /**
     * 상태 변경 메서드
     */
    public void changeStatus(String newStatusValue, String reason, Long changedById, NotificationRepository notificationRepo, MemberRepository memberRepo) {
        // 상태 변경 전 현재 상태 저장
        ChildCode oldStatus = this.statusChild;
        
        // 새 상태를 직접 생성 - 실제로는 ChildCodeRepository 사용이 더 바람직함
        ChildCode newStatus = new ChildCode();
        newStatus.setParentCode(statusParent);
        newStatus.setCodeValue(newStatusValue);
        
        // 상태 변경
        this.statusChild = newStatus;
        
        // 상태 변경 이력 추가
        StatusHistory history = StatusHistory.builder()
            .biddingContract(this)
            .entityType(StatusHistory.EntityType.CONTRACT)
            .fromStatus(oldStatus)
            .toStatus(newStatus)
            .reason(reason)
            .changedById(changedById)
            .changedAt(LocalDateTime.now())
            .build();
        
        this.statusHistories.add(history);
        
        // 상태 변경에 따른 알림 발송
        if (notificationRepo != null) {
            try {
                // "진행중" 상태로 변경된 경우 - 공급자에게 알림
                if (newStatusValue.equals("IN_PROGRESS")) {
                    Notification notification = Notification.createContractNotification(
                        supplier,
                        "계약 진행 시작",
                        "계약 '" + this.transactionNumber + "'이 진행 상태로 변경되었습니다.",
                        this.id
                    );
                    notificationRepo.save(notification);
                }
                // "완료" 상태로 변경된 경우 - 양측에 알림
                else if (newStatusValue.equals("CLOSED")) {
                    // 공급자에게 알림
                    Notification supplierNotification = Notification.createContractNotification(
                        supplier,
                        "계약 체결 완료",
                        "계약 '" + this.transactionNumber + "'이 모든 서명 절차를 완료하여 체결되었습니다.",
                        this.id
                    );
                    notificationRepo.save(supplierNotification);
                    
                    // 구매자에게 알림 - 이제 String을 Member로 조회
                    String creatorUsername = getBidding().getCreatedBy();
                    if (creatorUsername != null && !creatorUsername.isEmpty()) {
                        Member buyer = memberRepo.findByUsername(creatorUsername).orElse(null);
                        if (buyer != null) {
                            Notification buyerNotification = Notification.createContractNotification(
                                buyer,
                                "계약 체결 완료",
                                "계약 '" + this.transactionNumber + "'이 모든 서명 절차를 완료하여 체결되었습니다.",
                                this.id
                            );
                            notificationRepo.save(buyerNotification);
                        }
                    }
                }
            } catch (Exception e) {
                // 알림 발송 실패 (로깅 필요)
                System.err.println("계약 상태 변경 알림 발송 실패: " + e.getMessage());
            }
        }
    }

    /**
     * 계약 진행하기 + 알림 발송
     * 초안 상태에서 진행중 상태로 변경
     */
    public void startContract(Member updatedBy, NotificationRepository notificationRepo, MemberRepository memberRepo) {
        // 초안 상태가 아니면 진행 불가
        if (!isDraft()) {
            throw new IllegalStateException("초안 상태의 계약만 진행할 수 있습니다.");
        }
        
        // 상태 변경
        this.setStatusEnum(ContractStatus.진행중);
        this.updatedBy = updatedBy;
        
        // 알림 발송
        if (notificationRepo != null && memberRepo != null) {
            try {
                // 공급사에게 알림
                if (this.supplier != null) {
                    Notification notification = Notification.createContractNotification(
                        this.supplier,
                        "계약 진행 시작",
                        "계약 번호 '" + this.transactionNumber + "'의 계약 진행이 시작되었습니다. 서명을 진행해주세요.",
                        this.id
                    );
                    notificationRepo.save(notification);
                }

                // 구매자에게도 알림 (생성자)
                String creatorUsername = this.getBidding().getCreatedBy(); 
                if (creatorUsername != null && !creatorUsername.isEmpty()) {
                    // 사용자명으로 Member 찾기
                    Member creator = memberRepo.findByUsername(creatorUsername).orElse(null);
                    if (creator != null && this.supplier != null && !creator.getId().equals(this.supplier.getId())) {
                        Notification notification = Notification.createContractNotification(
                            creator,  // Member 객체 전달
                            "계약 진행 시작",
                            "계약 번호 '" + this.transactionNumber + "'의 계약 진행이 시작되었습니다. 서명을 진행해주세요.",
                            this.id
                        );
                        notificationRepo.save(notification);
                    }
                }
            } catch (Exception e) {
                // 알림 발송 실패 (로깅 필요)
                System.err.println("계약 진행 알림 발송 실패: " + e.getMessage());
            }
        }
        
        // 상태 이력 추가
        StatusHistory history = StatusHistory.builder()
            .biddingContract(this)
            .entityType(StatusHistory.EntityType.CONTRACT)
            .fromStatus(null) // 이전 상태 정보가 없는 경우
            .toStatus(null) // 새 상태 정보가 없는 경우
            .reason("계약 진행 시작")
            .changedById(updatedBy.getId())
            .changedAt(LocalDateTime.now())
            .build();
        
        this.statusHistories.add(history);
    }

    /**
     * 계약 금액 재계산
     * 단가와 수량에 기반하여 공급가액, 부가세, 총액을 계산
     */
    // @PreUpdate
    // public void recalculatePrices() {
    //     if (this.unitPrice == null || this.quantity == null) {
    //         return;
    //     }
        
    //     // PriceCalculator 유틸리티를 사용하여 계산
    //     PriceCalculator.PriceResult result = 
    //         PriceCalculator.calculateAll(this.unitPrice, this.quantity);
        
    //     this.supplyPrice = result.getSupplyPrice();
    //     this.vat = result.getVat();
    //     this.totalAmount = result.getTotalAmount();
    // }

    /**
     * 서명 상태 표시 (화면 표시용)
     */
    public String getSignatureStatus() {
        if (buyerSignature != null && supplierSignature != null) {
            return "양측 서명 완료";
        } else if (buyerSignature != null) {
            return "구매자 서명 완료";
        } else if (supplierSignature != null) {
            return "공급자 서명 완료";
        } else {
            return "서명 대기중";
        }
    }

    /**
     * 계약 생성 후 세부 정보가 필요한지 확인
     */
    @PostLoad
    public void checkNeedsDetails() {
        // 초안 상태이고 세부 정보가 없는 경우 플래그 설정
        boolean needsDetails = isDraft() && 
            (description == null || description.isEmpty() || 
            startDate == null || endDate == null);
        
        // 임시 필드에 저장 (화면에서 표시용)
        this.setDetailsFillNeeded(needsDetails);
    }

    /**
     * 세부 정보 입력 필요 여부 (화면 표시용)
     */
    private transient boolean detailsFillNeeded;

    public boolean isDetailsFillNeeded() {
        return detailsFillNeeded;
    }

    public void setDetailsFillNeeded(boolean detailsFillNeeded) {
        this.detailsFillNeeded = detailsFillNeeded;
    }

    /**
     * 취소 메서드
     */
    public void cancel(String reason, Long changedById, NotificationRepository notificationRepo, MemberRepository memberRepo) {
        // 취소 상태로 변경
        changeStatus("CANCELED", reason, changedById, notificationRepo, memberRepo);
    }

    // 상태 관련 헬퍼 메서드

    /**
     * 상태 확인 메서드
     */
    public boolean isDraft() {
        return statusChild != null && "DRAFT".equals(statusChild.getCodeValue());
    }

    public boolean isInProgress() {
        return statusChild != null && "IN_PROGRESS".equals(statusChild.getCodeValue());
    }

    public boolean isCompleted() {
        return statusChild != null && "CLOSED".equals(statusChild.getCodeValue());
    }

    public boolean isCancelled() {
        return statusChild != null && "CANCELED".equals(statusChild.getCodeValue());
    }

    /**
     * 상태값 열거형
     */
    public enum ContractStatus {
        초안,
        진행중,
        완료,
        취소
    }

    /**
     * 상태 열거형 반환
     */
    @Transient
    public ContractStatus getStatusEnum() {
        if (statusChild == null) {
            return null;
        }

        switch (statusChild.getCodeValue()) {
            case "DRAFT": return ContractStatus.초안;
            case "IN_PROGRESS": return ContractStatus.진행중;
            case "CLOSED": return ContractStatus.완료;
            case "CANCELED": return ContractStatus.취소;
            default: return null;
        }
    }

    /**
     * 상태 열거형 설정 (직접 설정)
     */
    public void setStatusEnum(ContractStatus contractStatus) {
        if (contractStatus == null) return;

        // 상태를 직접 설정
        ChildCode childCode = new ChildCode();
        childCode.setParentCode(statusParent);
        
        switch (contractStatus) {
            case 초안:
                childCode.setCodeValue("DRAFT");
                childCode.setCodeName("초안");
                break;
            case 진행중:
                childCode.setCodeValue("IN_PROGRESS");
                childCode.setCodeName("진행중");
                break;
            case 완료:
                childCode.setCodeValue("CLOSED");
                childCode.setCodeName("완료");
                break;
            case 취소:
                childCode.setCodeValue("CANCELED");
                childCode.setCodeName("취소");
                break;
        }
        
        this.statusChild = childCode;
    }
}