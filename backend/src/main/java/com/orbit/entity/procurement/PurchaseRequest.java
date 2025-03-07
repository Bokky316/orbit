package com.orbit.entity.procurement;

import com.orbit.entity.member.Member;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * 구매 요청 엔티티.
 * 구매 요청에 대한 정보를 담고 있습니다.
 */
@Entity
@Getter
@Setter
@Table(name = "purchase_request")
public class PurchaseRequest {

    /**
     * 구매 요청 ID (PK).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "purchase_request_id")
    private Long id;

    /**
     * 요청명.
     */
    @Column(name = "request_name", nullable = false)
    private String requestName;

    /**
     * 요청 번호.
     */
    @Column(name = "request_number", unique = true)
    private String requestNumber;

    /**
     * 진행 상태.
     */
    @Column(name = "status")
    private String status; // 예: "구매요청", "접수완료", "진행중", "완료"

    /**
     * 요청일.
     */
    @Column(name = "request_date")
    private LocalDate requestDate;

    /**
     * 고객사.
     */
    @Column(name = "customer")
    private String customer;

    /**
     * 사업 부서.
     */
    @Column(name = "business_department")
    private String businessDepartment;

    /**
     * 사업 담당자.
     */
    @Column(name = "business_manager")
    private String businessManager;

    /**
     * 사업 구분.
     */
    @Column(name = "business_type")
    private String businessType; // 예: "SI", "SM"

    /**
     * 사업 예산.
     */
    @Column(name = "business_budget")
    private Long businessBudget;

    /**
     * 특이 사항.
     */
    @Column(name = "special_notes", length = 1000)
    private String specialNotes;

    /**
     * 담당자 핸드폰 번호.
     */
    @Column(name = "manager_phone_number")
    private String managerPhoneNumber;

    /**
     * 사업 기간 (시작일).
     */
    @Column(name = "project_start_date")
    private LocalDate projectStartDate;

    /**
     * 사업 기간 (종료일).
     */
    @Column(name = "project_end_date")
    private LocalDate projectEndDate;

    /**
     * 사업 내용.
     */
    @Column(name = "project_content", length = 2000)
    private String projectContent;

    /**
     * 첨부 파일 목록. (실제 파일 저장 경로는 별도 관리)
     */
    @Column(name = "attachments")
    private String attachments;

    /**
     * 프로젝트 엔티티와의 관계 (ManyToOne).
     * 하나의 구매 요청은 하나의 프로젝트에 속할 수 있습니다.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    /**
     * 멤버 엔티티와의 관계 (ManyToOne).
     * 구매 요청을 등록한 멤버 정보를 나타냅니다.
     * registrant 필드 삭제 후 member 필드로 대체
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    /**
     * 구매 요청 아이템 목록 (OneToMany).
     * 하나의 구매 요청은 여러 개의 아이템을 가질 수 있습니다.
     */
    @OneToMany(mappedBy = "purchaseRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseRequestItem> purchaseRequestItems = new ArrayList<>();

}
