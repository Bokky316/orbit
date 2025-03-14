package com.orbit.entity.bidding;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.orbit.entity.BaseEntity;
import com.orbit.entity.Notification;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.entity.commonCode.StatusHistory;
import com.orbit.entity.member.Member;
import com.orbit.entity.procurement.PurchaseRequest;
import com.orbit.entity.procurement.PurchaseRequestItem;
import com.orbit.repository.NotificationRepository;
import com.orbit.repository.member.MemberRepository;
import com.orbit.util.PriceCalculator;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "biddings")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bidding extends BaseEntity {
   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   private Long id;
   
   // 구매 요청 연관관계
   @ManyToOne(fetch = FetchType.LAZY)
   @JoinColumn(name = "purchase_request_id")
   private PurchaseRequest purchaseRequest;

   @Column(name = "purchase_request_id", insertable = false, updatable = false)
   private Long purchaseRequestId; // 구매 요청 ID (매핑용)

   // 구매 요청 품목 연관관계
   @ManyToOne(fetch = FetchType.LAZY)
   @JoinColumn(name = "purchase_request_item_id")
   private PurchaseRequestItem purchaseRequestItem;

   @Column(name = "purchase_request_item_id", insertable = false, updatable = false)
   private Long purchaseRequestItemId; // 구매 요청 품목 ID (매핑용)

   // 입찰 기본 정보
   @Column(name = "bid_number", unique = true, nullable = false, length = 50)
   private String bidNumber; // 공고번호

   @Column(name = "title", nullable = false, length = 255)
   private String title; // 입찰 제목

   @Column(name = "description", columnDefinition = "TEXT")
   private String description; // 입찰 설명

   @Column(name = "start_date", nullable = false)
   private LocalDateTime startDate; // 입찰 시작일

   @Column(name = "end_date", nullable = false)
   private LocalDateTime endDate; // 입찰 마감일

   @Column(name = "conditions", columnDefinition = "TEXT")
   private String conditions; // 입찰조건

   @Column(name = "internal_note", columnDefinition = "TEXT")
   private String internalNote; // 비고(내부용)

   @Column(name = "quantity", nullable = false)
   private Integer quantity; // 수량

   // 금액 정보
   @Column(name = "unit_price", precision = 19, scale = 2)
   private BigDecimal unitPrice;

   @Column(name = "supply_price", precision = 19, scale = 2)
   private BigDecimal supplyPrice;

   @Column(name = "vat", precision = 19, scale = 2)
   private BigDecimal vat;

   @Column(name = "total_amount", precision = 19, scale = 2)
   private BigDecimal totalAmount;

   @Column(name = "file_path", length = 500)
   private String filePath; // 공고 파일

   // 상태 관리 시스템 - CommonCodeDataInitializer와 연동
   // 1. 입찰 상태
   @ManyToOne(fetch = FetchType.LAZY)
   @JoinColumn(name = "status_parent_id")
   private ParentCode statusParent;

   @ManyToOne(fetch = FetchType.LAZY)
   @JoinColumn(name = "status_child_id")
   private ChildCode statusChild;

   // 2. 입찰 방식
   @ManyToOne(fetch = FetchType.LAZY)
   @JoinColumn(name = "method_parent_id")
   private ParentCode methodParent;

   @ManyToOne(fetch = FetchType.LAZY)
   @JoinColumn(name = "method_child_id")
   private ChildCode methodChild;

   // 입찰 초대 공급사 목록 (양방향 1:N)
   @OneToMany(mappedBy = "biddingId", cascade = CascadeType.ALL)
   @Builder.Default
   private List<BiddingSupplier> suppliers = new ArrayList<>();

   // 입찰 참여 정보 (양방향 1:N)
   @OneToMany(mappedBy = "bidding", cascade = CascadeType.ALL)
   @Builder.Default
   private List<BiddingParticipation> participations = new ArrayList<>();

   // 상태 변경 이력 (양방향 1:N)
   @OneToMany(mappedBy = "bidding", cascade = CascadeType.ALL)
   @Builder.Default
   private List<StatusHistory> statusHistories = new ArrayList<>();
   
   // 계약 정보 (양방향 1:N)
   @OneToMany(mappedBy = "bidding", cascade = CascadeType.ALL)
   @Builder.Default
   private List<BiddingContract> contracts = new ArrayList<>();
   
   // 발주 정보 (양방향 1:N)
   @OneToMany(mappedBy = "bidding", cascade = CascadeType.ALL)
   @Builder.Default
   private List<BiddingOrder> orders = new ArrayList<>();
   
   // 평가 정보 (양방향 1:N)
   @OneToMany(mappedBy = "biddingId", cascade = CascadeType.ALL)
   @Builder.Default
   private List<BiddingEvaluation> evaluations = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "bidding_attachments", joinColumns = @JoinColumn(name = "bidding_id"))
    @Column(name = "file_path")
    @Builder.Default
    private List<String> attachmentPaths = new ArrayList<>();

    // 첨부파일 추가 메서드
    public void addAttachment(String filePath) {
        if (this.attachmentPaths == null) {
            this.attachmentPaths = new ArrayList<>();
        }
        this.attachmentPaths.add(filePath);
    }

    // 첨부파일 삭제 메서드
    public void removeAttachment(String filePath) {
        if (this.attachmentPaths != null) {
            this.attachmentPaths.remove(filePath);
        }
    }
   
    /**
     * 금액 재계산
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
     * 참여 금액 업데이트
     * 공급사가 제안한 금액 정보를 업데이트하고 계산
     */
    public void updateParticipationPrices(BiddingParticipation participation, BigDecimal newUnitPrice) {
        if (participation == null || newUnitPrice == null) {
            return;
        }
        
        // 단가 설정
        participation.setUnitPrice(newUnitPrice);
        
        // PriceCalculator 유틸리티를 사용하여 계산
        PriceCalculator.PriceResult result = 
            PriceCalculator.calculateAll(newUnitPrice, this.quantity);
        
        // 계산된 금액 설정
        participation.setSupplyPrice(result.getSupplyPrice());
        participation.setVat(result.getVat());
        participation.setTotalAmount(result.getTotalAmount());
    }


    /**
     * 계약 금액 업데이트
     * 계약에 사용될 금액 정보를 업데이트하고 계산
     */
    public void updateContractPrices(BiddingContract contract, BigDecimal unitPrice, Integer quantity) {
        if (contract == null || unitPrice == null || quantity == null) {
            return;
        }
        
        // 단가 및 수량 설정
        contract.setUnitPrice(unitPrice);
        contract.setQuantity(quantity);
        
        // PriceCalculator 유틸리티를 사용하여 계산
        PriceCalculator.PriceResult result = 
            PriceCalculator.calculateAll(unitPrice, quantity);
        
        // 계산된 금액 설정
        contract.setSupplyPrice(result.getSupplyPrice());
        contract.setVat(result.getVat());
        contract.setTotalAmount(result.getTotalAmount());
    }

   /**
    * 공급사 초대 추가 + 알림 발송
    */
   public BiddingSupplier inviteSupplier(Long supplierId, MemberRepository memberRepo, NotificationRepository notificationRepo) {
       // 이미 초대했는지 확인
       boolean alreadyInvited = suppliers.stream()
           .anyMatch(s -> s.getSupplierId().equals(supplierId));
           
       if (alreadyInvited) {
           throw new IllegalStateException("이미 초대된 공급사입니다.");
       }
       
       // 초대 생성
       BiddingSupplier supplier = BiddingSupplier.builder()
           .biddingId(this.id)
           .supplierId(supplierId)
           .notificationSent(false)
           .build();
           
       suppliers.add(supplier);
       
       // 알림 생성 및 발송
       try {
           Member supplierMember = memberRepo.findById(supplierId).orElse(null);
           if (supplierMember != null) {
               Notification notification = Notification.createBiddingNotification(
                   supplierMember,
                   "새로운 입찰 공고 초대",
                   "입찰 공고 '" + this.title + "'에 참여 요청이 왔습니다. 확인해주세요.",
                   this.id
               );
               notificationRepo.save(notification);
               
               // 알림 발송 처리 완료
               supplier.setNotificationSent(true);
               supplier.setNotificationDate(LocalDateTime.now());
           }
       } catch (Exception e) {
           // 알림 발송 실패 처리 (로깅 필요)
           System.err.println("공급사 초대 알림 발송 실패: " + e.getMessage());
       }
       
       return supplier;
   }

   /**
    * 공급사 참여 추가
    */
   public BiddingParticipation addParticipation(Long supplierId, String companyName) {
       // 이미 참여했는지 확인
       boolean alreadyParticipated = participations.stream()
           .anyMatch(p -> p.getSupplierId().equals(supplierId));
           
       if (alreadyParticipated) {
           throw new IllegalStateException("이미 참여한 공급사입니다.");
       }
       
       // 참여 생성
       BiddingParticipation participation = BiddingParticipation.builder()
           .bidding(this)
           .supplierId(supplierId)
           .companyName(companyName)
           .isConfirmed(false)
           .isEvaluated(false)
           .isOrderCreated(false)
           .build();
           
       participations.add(participation);
       return participation;
   }

   /**
    * 상태 변경 메서드 + 알림 발송
    * @param newStatus 새로운 상태
    * @param reason 변경 사유
    * @param changedById 변경자 ID
    * @param memberRepo 멤버 레포지토리
    * @param notificationRepo 알림 레포지토리
    */
   public void changeStatus(ChildCode newStatus, String reason, Long changedById, 
                           MemberRepository memberRepo, NotificationRepository notificationRepo) {
       // 상태 변경 전 현재 상태 저장
       ChildCode oldStatus = this.statusChild;
       
       // 상태 변경
       this.statusChild = newStatus;
       
       // 상태 변경 이력 추가
       StatusHistory history = StatusHistory.builder()
           .bidding(this)
           .entityType(StatusHistory.EntityType.BIDDING)
           .fromStatus(oldStatus)
           .toStatus(newStatus)
           .reason(reason)
           .changedById(changedById)
           .changedAt(LocalDateTime.now())
           .build();
       
       this.statusHistories.add(history);
       
       // 상태 변경에 따른 알림 발송 처리
       try {
           // 입찰 공고가 '진행중'으로 변경된 경우 - 공급사에게 알림
           if (newStatus.getCodeValue().equals("ONGOING")) {
               sendStatusChangeNotifications(
                   "입찰 공고 시작",
                   "입찰 공고 '" + this.title + "'이 시작되었습니다.",
                   memberRepo, notificationRepo
               );
           }
           // 입찰 공고가 '마감'으로 변경된 경우 - 공급사에게 알림
           else if (newStatus.getCodeValue().equals("CLOSED")) {
               sendStatusChangeNotifications(
                   "입찰 공고 마감",
                   "입찰 공고 '" + this.title + "'이 마감되었습니다.",
                   memberRepo, notificationRepo
               );
           }
       } catch (Exception e) {
           // 알림 발송 실패 (로깅 필요)
           System.err.println("상태 변경 알림 발송 실패: " + e.getMessage());
       }
   }
   
   /**
    * 상태 변경 알림 발송 헬퍼 메서드
    */
   private void sendStatusChangeNotifications(String title, String content,
                                          MemberRepository memberRepo, NotificationRepository notificationRepo) {
       // 초대된 모든 공급사에게 알림 발송
       for (BiddingSupplier supplier : suppliers) {
           Member supplierMember = memberRepo.findById(supplier.getSupplierId()).orElse(null);
           if (supplierMember != null) {
               Notification notification = Notification.createBiddingNotification(
                   supplierMember, title, content, this.id
               );
               notificationRepo.save(notification);
           }
       }
       
       // 참여한 모든 공급사에게 알림 발송
       for (BiddingParticipation participation : participations) {
           // 중복 방지 (이미 초대된 공급사인 경우 제외)
           boolean alreadyNotified = suppliers.stream()
               .anyMatch(s -> s.getSupplierId().equals(participation.getSupplierId()));
               
           if (!alreadyNotified) {
               Member participantMember = memberRepo.findById(participation.getSupplierId()).orElse(null);
               if (participantMember != null) {
                   Notification notification = Notification.createBiddingNotification(
                       participantMember, title, content, this.id
                   );
                   notificationRepo.save(notification);
               }
           }
       }
   }

   /**
     * 평가 추가 + 알림 발송
     */
    public BiddingEvaluation addEvaluation(BiddingParticipation participation, Long evaluatorId,
                                    MemberRepository memberRepo, NotificationRepository notificationRepo) {
        // 평가 생성
        BiddingEvaluation evaluation = BiddingEvaluation.builder()
            .biddingId(this.id)
            .biddingParticipationId(participation.getId())
            .supplierName(participation.getCompanyName())
            .evaluatorId(evaluatorId)
            // 기본 점수 설정
            .priceScore(0)
            .qualityScore(0)
            .deliveryScore(0)
            .reliabilityScore(0)
            .build();
            
        // 평가 상태 업데이트 - 간단한 버전 호출로 수정
        participation.updateEvaluationStatus(true);
        
        // 알림 발송
        try {
            Member supplierMember = memberRepo.findById(participation.getSupplierId()).orElse(null);
            if (supplierMember != null) {
                Notification notification = Notification.createEvaluationNotification(
                    supplierMember,
                    "입찰 평가 시작",
                    "입찰 공고 '" + this.title + "'에 대한 평가가 시작되었습니다.",
                    evaluation.getId()
                );
                notificationRepo.save(notification);
            }
        } catch (Exception e) {
            // 알림 발송 실패 (로깅 필요)
            System.err.println("평가 알림 발송 실패: " + e.getMessage());
        }
        
        evaluations.add(evaluation);
        return evaluation;
    }

   /**
     * 낙찰자 선정 + 알림 발송 (수동 낙찰 방식)
     * 관리자가 명시적으로 낙찰자를 선정하는 메서드
     */
    public void selectBidder(BiddingParticipation participation, BiddingEvaluation evaluation,
                            MemberRepository memberRepo, NotificationRepository notificationRepo) {
        // 이미 낙찰된 업체가 있는지 확인
        boolean hasSelectedBidder = evaluations.stream()
            .anyMatch(e -> e.isSelectedBidder() && !e.getId().equals(evaluation.getId()));
        
        if (hasSelectedBidder) {
            // 기존 낙찰자의 상태를 변경
            evaluations.stream()
                .filter(e -> e.isSelectedBidder() && !e.getId().equals(evaluation.getId()))
                .forEach(e -> e.cancelSelectedBidder());
        }
        
        // 새로운 낙찰자 상태 변경
        evaluation.selectAsBidder(notificationRepo, memberRepo);
        
        // 알림 발송
        try {
            // 낙찰자에게 알림
            Member supplierMember = memberRepo.findById(participation.getSupplierId()).orElse(null);
            if (supplierMember != null) {
                Notification notification = Notification.createBiddingNotification(
                    supplierMember,
                    "낙찰자 선정 완료",
                    "입찰 공고 '" + this.title + "'에서 귀사가 낙찰자로 선정되었습니다. 계약 절차가 곧 진행될 예정입니다.",
                    this.id
                );
                notificationRepo.save(notification);
            }
            
            // 다른 참여자들에게도 알림 발송
            for (BiddingParticipation otherParticipation : participations) {
                if (!otherParticipation.getId().equals(participation.getId())) {
                    Member otherMember = memberRepo.findById(otherParticipation.getSupplierId()).orElse(null);
                    if (otherMember != null) {
                        Notification notification = Notification.createBiddingNotification(
                            otherMember,
                            "낙찰자 선정 완료",
                            "입찰 공고 '" + this.title + "'의 낙찰자가 선정되었습니다.",
                            this.id
                        );
                        notificationRepo.save(notification);
                    }
                }
            }

            
            // 구매자(생성자)에게도 알림
            String creatorUsername = this.getCreatedBy();
            if (creatorUsername != null && !creatorUsername.isEmpty()) {
                // 사용자명으로 Member 찾기
                Member creator = memberRepo.findByUsername(creatorUsername).orElse(null);
                if (creator != null && !creator.getId().equals(participation.getSupplierId())) {
                    Notification notification = Notification.createContractNotification(
                        creator,  // Member 객체 전달
                        "낙찰자 선정 완료",
                        "입찰 공고 '" + this.title + "'의 낙찰자가 선정되었습니다. 계약 초안 생성을 진행해주세요.",
                        this.id
                    );
                    notificationRepo.save(notification);
                }
            }
        } catch (Exception e) {
            // 알림 발송 실패 (로깅 필요)
            System.err.println("낙찰자 선정 알림 발송 실패: " + e.getMessage());
        }
        
        // 낙찰자 상태 업데이트 이벤트 추가 (상태 이력)
        StatusHistory history = StatusHistory.builder()
            .bidding(this)
            .entityType(StatusHistory.EntityType.BIDDING)
            .fromStatus(null) // 상태 변경이 아니므로 null
            .toStatus(null) // 상태 변경이 아니므로 null
            .reason("낙찰자 선정: " + participation.getCompanyName())
            .changedById(participation.getSupplierId())
            .changedAt(LocalDateTime.now())
            .build();
        
        this.statusHistories.add(history);
    }
   
   /**
    * 발주 생성 + 알림 발송
    */
   public BiddingOrder createOrder(BiddingParticipation participation, String createdById,
                               MemberRepository memberRepo, NotificationRepository notificationRepo) {
       // 발주 생성
       BiddingOrder order = BiddingOrder.builder()
           .biddingId(this.id)
           .biddingParticipationId(participation.getId())
           .purchaseRequestItemId(this.purchaseRequestItemId)
           .supplierId(participation.getSupplierId())
           .supplierName(participation.getCompanyName())
           .title(this.title)
           .description(this.description)
           .quantity(this.quantity)
           .unitPrice(participation.getUnitPrice())
           .supplyPrice(participation.getSupplyPrice())
           .vat(participation.getVat())
           .totalAmount(participation.getTotalAmount())
           .createdBy(createdById)
           .build();
           
       // 발주 상태 업데이트
       participation.setOrderCreated(true);
       
       // 알림 발송
       try {
           Member supplierMember = memberRepo.findById(participation.getSupplierId()).orElse(null);
           if (supplierMember != null) {
               Notification notification = Notification.createBiddingNotification(
                   supplierMember,
                   "발주서 생성",
                   "입찰 공고 '" + this.title + "'에 대한 발주서가 생성되었습니다. 확인해주세요.",
                   order.getId()
               );
               notificationRepo.save(notification);
           }
       } catch (Exception e) {
           // 알림 발송 실패 (로깅 필요)
           System.err.println("발주 알림 발송 실패: " + e.getMessage());
       }
       
       orders.add(order);
       return order;
   }
   
   /**
     * 계약 초안 생성 + 알림 발송
     * 공고번호에서 계약번호를 파생하여 일관성 유지
     */
    public BiddingContract createContractDraft(BiddingParticipation participation, 
    MemberRepository memberRepo, NotificationRepository notificationRepo) {
    // 참여 정보 확인
    if (participation == null) {
    throw new IllegalArgumentException("참여 정보가 필요합니다.");
    }

    // 계약 초안 생성
    BiddingContract contract = BiddingContract.builder()
        .bidding(this)
        .biddingParticipation(participation)
        .supplier(memberRepo.findById(participation.getSupplierId()).orElse(null))
        .totalAmount(participation.getTotalAmount())
        .quantity(this.quantity)
        .unitPrice(participation.getUnitPrice())
        .supplyPrice(participation.getSupplyPrice())
        .vat(participation.getVat())
        .startDate(java.time.LocalDate.now())
        .endDate(java.time.LocalDate.now().plusMonths(6)) // 기본값으로 6개월 계약
        .description(this.description)
        .build();

        // 상태 초기화 (초안 상태로)
        contract.setStatusEnum(BiddingContract.ContractStatus.초안);

        // 계약번호 생성 (공고번호로부터 파생)
        // BID-YYMMDD-XXX => CNT-YYMMDD-XXX
        if (this.bidNumber != null && this.bidNumber.startsWith("BID-")) {
            String contractNumberBase = this.bidNumber.replace("BID-", "CNT-");
            contract.setTransactionNumber(contractNumberBase);
        } else {
            // 예외 처리: 기존 공고번호가 없거나 형식이 다른 경우
            String datePart = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyMMdd"));
            String randomPart = String.format("%03d", new java.util.Random().nextInt(1000));
            contract.setTransactionNumber("CNT-" + datePart + "-" + randomPart);
        }

        // 알림 발송
        try {
            // 공급사에게 알림
            Member supplierMember = memberRepo.findById(participation.getSupplierId()).orElse(null);
            if (supplierMember != null) {
            Notification notification = Notification.createContractNotification(
            supplierMember,
            "계약 초안 생성",
            "입찰 공고 '" + this.title + "'에 대한 계약 초안이 생성되었습니다. 계약 목록에서 확인해주세요.",
            contract.getId()
        );
            notificationRepo.save(notification);
        }

        // 구매자에게도 알림 (생성자)
        String creatorUsername = this.getCreatedBy();  // String으로 받음
        if (creatorUsername != null && !creatorUsername.isEmpty()) {
            // 사용자명으로 Member 찾기
            Member creator = memberRepo.findByUsername(creatorUsername).orElse(null);
            if (creator != null && !creator.getId().equals(participation.getSupplierId())) {
                Notification notification = Notification.createContractNotification(
                    creator,  // Member 객체 전달
                    "계약 초안 생성 완료",
                    "입찰 공고 '" + this.title + "'에 대한 계약 초안이 생성되었습니다. 계약 목록 페이지에서 세부 정보를 입력해주세요.",
                    contract.getId()
                );
                notificationRepo.save(notification);
            }
        }
        } catch (Exception e) {
            // 알림 발송 실패 (로깅 필요)
            System.err.println("계약 초안 알림 발송 실패: " + e.getMessage());
        }

        contracts.add(contract);
        return contract;
    }

}