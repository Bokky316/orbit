package com.orbit.entity.supplier;

import com.orbit.constant.SupplierStatus;
import com.orbit.entity.member.Member;
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

    @Column(name = "registration_date")
    private LocalDate registrationDate; // 등록 요청일

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private SupplierStatus status = SupplierStatus.PENDING; // 상태 (대기중, 승인, 거절)

    @Column(name = "business_no", nullable = false, unique = true, length = 20)
    private String businessNo; // 사업자등록번호

    @Column(name = "business_file", length = 255)
    private String businessFile; // 사업자등록증 파일 경로

    @Column(name = "company_name", nullable = false, length = 255)
    private String companyName; // 회사명

    @Column(name = "ceo_name", nullable = false, length = 100)
    private String ceoName; // 대표자명

    @Column(name = "business_type", length = 100)
    private String businessType; // 업태

    @Column(name = "business_category", length = 100)
    private String businessCategory; // 업종

    @Column(name = "sourcing_category", length = 100)
    private String sourcingCategory; // 소싱대분류

    @Column(name = "sourcing_sub_category", length = 100)
    private String sourcingSubCategory; // 소싱중분류

    @Column(name = "phone_number", length = 20)
    private String phoneNumber; // 전화번호

    @Column(name = "head_office_address", columnDefinition = "TEXT")
    private String headOfficeAddress; // 본사 주소

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments; // 의견

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason; // 거절 사유

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt; // 생성일시

    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt; // 수정일시
}
