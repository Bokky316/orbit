package com.orbit.entity.bidding;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


//입찰공고-공급자 연결

@Entity
@Table(name = "bidding_suppliers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BiddingSupplier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bidding_id", nullable = false)
    private Long biddingId; //입찰 ID

    @Column(name = "supplier_id", nullable = false)
    private Long supplierId; //공급자 ID

    @Column(name = "notification_sent")
    private Boolean notificationSent; //알림 발송 여부

    @Column(name = "notification_date")
    private LocalDateTime notificationDate; //알림 발송 일시

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt; //생성일시

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.notificationSent = false;
    }
}