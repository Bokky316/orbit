package com.orbit.entity.procurement;

import com.orbit.constant.PurchaseRequestStatus;
import com.orbit.entity.member.Member;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * 구매 요청 엔티티
 * 구매 요청에 대한 상세 정보를 저장합니다.
 */
@Entity
@Getter
@Setter
@Table(name = "purchase_request")
public class PurchaseRequest {

    /**
     * 구매 요청의 고유 식별자
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "purchase_request_id")
    private Long id;

    /**
     * 구매 요청의 이름
     */
    @Column(name = "request_name", nullable = false)
    private String requestName;

    /**
     * 구매 요청의 고유 번호
     */
    @Column(name = "request_number", unique = true)
    private String requestNumber;

    /**
     * 구매 요청의 현재 상태
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private PurchaseRequestStatus status;

    /**
     * 구매 요청이 생성된 날짜
     */
    @Column(name = "request_date")
    private LocalDate requestDate;

    /**
     * 구매 요청과 관련된 고객사 정보
     */
    @Column(name = "customer")
    private String customer;

    /**
     * 구매를 요청한 사업 부서
     */
    @Column(name = "business_department")
    private String businessDepartment;

    /**
     * 구매 요청을 담당하는 사업 관리자
     */
    @Column(name = "business_manager")
    private String businessManager;

    /**
     * 사업의 유형 (예: SI, SM 등)
     */
    @Column(name = "business_type")
    private String businessType;

    /**
     * 구매에 할당된 사업 예산
     */
    @Column(name = "business_budget")
    private Long businessBudget;

    /**
     * 구매 요청에 대한 특별 참고 사항
     */
    @Column(name = "special_notes", length = 1000)
    private String specialNotes;

    /**
     * 구매 요청 담당자의 연락처
     */
    @Column(name = "manager_phone_number")
    private String managerPhoneNumber;

    /**
     * 관련 프로젝트의 시작 날짜
     */
    @Column(name = "project_start_date")
    private LocalDate projectStartDate;

    /**
     * 관련 프로젝트의 종료 예정 날짜
     */
    @Column(name = "project_end_date")
    private LocalDate projectEndDate;

    /**
     * 구매 요청과 관련된 프로젝트의 상세 내용
     */
    @Column(name = "project_content", length = 2000)
    private String projectContent;

    /**
     * 구매 요청에 첨부된 파일들의 정보
     */
    @Column(name = "attachments")
    private String attachments;

    /**
     * 구매 요청이 속한 프로젝트
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    /**
     * 구매 요청을 생성한 회원
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    /**
     * 이 구매 요청에 포함된 개별 아이템들의 목록
     */
    @OneToMany(mappedBy = "purchaseRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseRequestItem> purchaseRequestItems = new ArrayList<>();
}
