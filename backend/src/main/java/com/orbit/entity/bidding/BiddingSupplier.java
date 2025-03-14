package com.orbit.entity.bidding;

import java.time.LocalDateTime;

import com.orbit.entity.BaseEntity;
import com.orbit.entity.Notification;
import com.orbit.entity.member.Member;
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
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 입찰공고-공급자 연결 엔티티
 * - 입찰 공고에 초대된 공급자 관리
 */
@Entity
@Table(name = "bidding_suppliers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BiddingSupplier extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bidding_id", nullable = false)
    private Long biddingId; // 입찰 ID

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidding_id", insertable = false, updatable = false)
    private Bidding bidding; // 입찰 엔티티 (매핑용)

    @Column(name = "supplier_id", nullable = false)
    private Long supplierId; // 공급자 ID

    @Column(name = "company_name")
    private String companyName; // 공급자명 (캐싱용)

    @Column(name = "notification_sent")
    private Boolean notificationSent; // 알림 발송 여부

    @Column(name = "notification_date")
    private LocalDateTime notificationDate; // 알림 발송 일시

    @Column(name = "is_participating", columnDefinition = "boolean default false")
    private Boolean isParticipating; // 참여 여부

    @Column(name = "participation_date")
    private LocalDateTime participationDate; // 참여 일시

    @Column(name = "is_rejected", columnDefinition = "boolean default false")
    private Boolean isRejected; // 거부 여부

    @Column(name = "rejection_date")
    private LocalDateTime rejectionDate; // 거부 일시

    @Column(name = "rejection_reason")
    private String rejectionReason; // 거부 사유

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt; // 생성일시

    /**
     * 알림 발송 처리 + 알림 발송
     */
    public void sendNotification(NotificationRepository notificationRepo, MemberRepository memberRepo, String title, String content) {
        // 알림 발송 기록
        this.notificationSent = true;
        this.notificationDate = LocalDateTime.now();
        
        // 실제 알림 발송
        if (notificationRepo != null && memberRepo != null) {
            try {
                Member supplier = memberRepo.findById(this.supplierId).orElse(null);
                if (supplier != null) {
                    Notification notification = Notification.builder()
                        .user(supplier)
                        .title(title)
                        .content(content)
                        .type(Notification.NotificationType.입찰공고)
                        .relatedId(this.biddingId)
                        .isRead(false)
                        .build();
                    notificationRepo.save(notification);
                }
            } catch (Exception e) {
                // 알림 발송 실패 (로깅 필요)
                System.err.println("공급사 알림 발송 실패: " + e.getMessage());
                this.notificationSent = false;
                this.notificationDate = null;
            }
        }
    }

    /**
     * 참여 처리 + 알림 발송
     */
    public void participate(NotificationRepository notificationRepo, MemberRepository memberRepo) {
        this.isParticipating = true;
        this.participationDate = LocalDateTime.now();
        
        // 알림 발송 (구매자에게)
        if (notificationRepo != null && memberRepo != null && bidding != null) {
            try {
                String creatorUsername = bidding.getCreatedBy();
                if (creatorUsername != null && !creatorUsername.isEmpty()) {
                    Member buyer = memberRepo.findByUsername(creatorUsername).orElse(null);
                    if (buyer != null) {
                        Notification notification = Notification.builder()
                        .user(buyer)
                        .title("입찰 참여 확인")
                        .content(this.companyName + " 공급사가 입찰 공고 '" + bidding.getTitle() + "'에 참여 의사를 확인했습니다.")
                        .type(Notification.NotificationType.입찰공고)
                        .relatedId(this.biddingId)
                        .isRead(false)
                        .build();
                        notificationRepo.save(notification);
                    }
                }
            } catch (Exception e) {
                // 알림 발송 실패 (로깅 필요)
                System.err.println("참여 알림 발송 실패: " + e.getMessage());
            }
        }
    }

    /**
     * 참여 거부 처리 + 알림 발송
     */
    public void reject(String reason, NotificationRepository notificationRepo, MemberRepository memberRepo) {
        this.isRejected = true;
        this.rejectionDate = LocalDateTime.now();
        this.rejectionReason = reason;
        
        // 알림 발송 (구매자에게)
        if (notificationRepo != null && memberRepo != null && bidding != null) {
            try {
                String creatorUsername = bidding.getCreatedBy();
                if (creatorUsername != null && !creatorUsername.isEmpty()) {
                    Member buyer = memberRepo.findByUsername(creatorUsername).orElse(null);
                    if (buyer != null) {
                        Notification notification = Notification.builder()
                            .user(buyer)
                            .title("입찰 참여 거부")
                            .content(this.companyName + " 공급사가 입찰 공고 '" + bidding.getTitle() + "'에 참여를 거부했습니다. 사유: " + reason)
                            .type(Notification.NotificationType.입찰공고)
                            .relatedId(this.biddingId)
                            .isRead(false)
                            .build();
                        notificationRepo.save(notification);
                    }
                }
            } catch (Exception e) {
                // 알림 발송 실패 (로깅 필요)
                System.err.println("거부 알림 발송 실패: " + e.getMessage());
            }
        }
    }

    /**
     * 공급사 이름 업데이트 (캐싱)
     */
    public void updateSupplierName(MemberRepository memberRepo) {
        if (memberRepo != null && this.supplierId != null) {
            try {
                Member supplier = memberRepo.findById(this.supplierId).orElse(null);
                if (supplier != null) {
                    this.companyName = supplier.getCompanyName();
                }
            } catch (Exception e) {
                // 공급사 정보 조회 실패 (로깅 필요)
                System.err.println("공급사 정보 조회 실패: " + e.getMessage());
            }
        }
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.notificationSent = false;
        this.isParticipating = false;
        this.isRejected = false;
    }
}