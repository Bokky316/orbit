package com.orbit.entity.supplier;

import com.orbit.constant.SupplierStatus;
import com.orbit.entity.Member;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "supplier_registrations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SupplierRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Member supplier; // 협력업체 (members 테이블)

    @Column(name = "business_no", nullable = false, unique = true, length = 20)
    private String businessNo; // 사업자등록번호

    @Column(name = "business_file")
    private String businessFile; // 사업자등록증 파일 경로

    @Column(name = "business_category")
    private String businessCategory; // 업종

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private SupplierStatus status = SupplierStatus.PENDING; // 상태 (대기중, 승인, 거절)

    @Column(name = "rejection_reason")
    private String rejectionReason; // 거절 사유

    @Column(name = "registration_date")
    private LocalDate registrationDate; // 등록 요청일

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt; // 생성일시

    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt; // 수정일시
}
