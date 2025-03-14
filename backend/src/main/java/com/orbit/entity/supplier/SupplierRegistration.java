package com.orbit.entity.supplier;

import com.orbit.entity.commonCode.SystemStatus;
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
import java.util.ArrayList;
import java.util.List;

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

    // status 필드 수정
    @Embedded
    private SystemStatus status = new SystemStatus("SUPPLIER", "PENDING"); // 상태 (대기중, 승인, 거절)

    @Column(name = "business_no", nullable = false, unique = true, length = 20)
    private String businessNo; // 사업자등록번호

    /* 기존 필드 제거하고 첨부파일 관계로 대체 */
    @OneToMany(mappedBy = "supplierRegistration", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SupplierAttachment> attachments = new ArrayList<>();

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

    @Column(name = "sourcing_detail_category", length = 100)
    private String sourcingDetailCategory; // 소싱소분류 추가

    @Column(name = "phone_number", length = 20)
    private String phoneNumber; // 전화번호

    // 주소 관련
    @Column(name = "postal_code", length = 10)
    private String postalCode; // 우편번호 (최대 길이 10)

    @Column(name = "road_address")
    private String roadAddress; // 도로명 주소

    @Column(name = "detail_address")
    private String detailAddress; // 상세 주소

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments; // 의견

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason; // 반려 사유

    // 담당자 관련 필드 추가
    @Column(name = "contact_person", length = 100)
    private String contactPerson; // 담당자 이름

    @Column(name = "contact_phone", length = 20)
    private String contactPhone; // 담당자 연락처

    @Column(name = "contact_email", length = 100)
    private String contactEmail; // 담당자 이메일

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt; // 생성일시

    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt; // 수정일시

    // 비즈니스 파일 관련 getter (이전 코드와의 호환성 유지)
    public String getBusinessFile() {
        if (this.attachments != null && !this.attachments.isEmpty()) {
            return this.attachments.get(0).getFilePath();
        }
        return null;
    }
}
