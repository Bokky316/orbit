package com.orbit.entity.state;

import java.util.List;
import java.util.Map;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "status_codes")
@Getter@Setter
@NoArgsConstructor
@IdClass(StatusCodeId.class)
public class StatusCode {

    @Id
    @Column(name = "parent_code", length = 20)
    private String parentCode;

    @Id
    @Column(name = "child_code", length = 20)
    private String childCode;

    @Column(nullable = false, length = 100)
    private String codeName;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    private SystemType systemType;

    @Column(nullable = false)
    private Integer sortOrder;

    @Column(nullable = false)
    private Boolean isTerminal = false;

    @Column(nullable = false)
    private Boolean requiresApproval = true;

    // 시스템 유형 확장
    public enum SystemType {
        PROJECT, PROCUREMENT, PURCHASE_REQUEST, CONTRACT, PAYMENT, SUPPLIER ,BIDDING, BID_METHOD, BIDDING_CONTRACT
    }

    // 기본 상태 코드 재정의
    public static final Map<String, List<StatusCode>> DEFAULT_CODES = Map.of(
            // 프로젝트 기본 상태
            "PROJECT", List.of(
                    new StatusCode("PROJECT", "REGISTERED", "등록완료", SystemType.PROJECT, 1, false, false),
                    new StatusCode("PROJECT", "TERMINATED", "중도종결", SystemType.PROJECT, 2, true, false),
                    new StatusCode("PROJECT", "AMENDED", "정정등록", SystemType.PROJECT, 3, false, true)
            ),

            // 구매 프로세스 상태
            "PROCUREMENT", List.of(
                    new StatusCode("PROCUREMENT", "VENDOR_SELECTED", "업체선정", SystemType.PROCUREMENT, 1, false, true),
                    new StatusCode("PROCUREMENT", "PURCHASE_CONTRACT", "구매계약", SystemType.PROCUREMENT, 2, false, true),
                    new StatusCode("PROCUREMENT", "SUPPLY_CONTRACT", "공급계약", SystemType.PROCUREMENT, 3, false, true),
                    new StatusCode("PROCUREMENT", "INSPECTION", "검수", SystemType.PROCUREMENT, 4, false, true),
                    new StatusCode("PROCUREMENT", "INVOICE", "인보이스", SystemType.PROCUREMENT, 5, false, true),
                    new StatusCode("PROCUREMENT", "PAYMENT_REQUEST", "대금청구", SystemType.PROCUREMENT, 6, false, true),
                    new StatusCode("PROCUREMENT", "PAYMENT_COMPLETED", "대금지급", SystemType.PROCUREMENT, 7, false, true),
                    new StatusCode("PROCUREMENT", "COMPLETED", "완료", SystemType.PROCUREMENT, 8, true, false)
            ),

            // 구매 요청 상태
            "PURCHASE_REQUEST", List.of(
                    new StatusCode("PURCHASE_REQUEST", "REQUESTED", "구매요청", SystemType.PURCHASE_REQUEST, 1, false, true),
                    new StatusCode("PURCHASE_REQUEST", "REJECTED", "접수반려", SystemType.PURCHASE_REQUEST, 2, true, false),
                    new StatusCode("PURCHASE_REQUEST", "ACCEPTED", "구매접수", SystemType.PURCHASE_REQUEST, 3, false, true)
            ),

            "CONTRACT", List.of(
                    new StatusCode("CONTRACT", "DRAFT", "초안", SystemType.CONTRACT, 1, false, true),
                    new StatusCode("CONTRACT", "UNDER_REVIEW", "검토중", SystemType.CONTRACT, 2, false, true),
                    new StatusCode("CONTRACT", "ACTIVE", "유효", SystemType.CONTRACT, 3, false, false),
                    new StatusCode("CONTRACT", "COMPLETED", "완료", SystemType.CONTRACT, 4, true, false),
                    new StatusCode("CONTRACT", "TERMINATED", "해지", SystemType.CONTRACT, 5, true, false)
            ),
            "PAYMENT", List.of(
                    new StatusCode("PAYMENT", "PENDING", "대기중", SystemType.PAYMENT, 1, false, true),
                    new StatusCode("PAYMENT", "PARTIAL", "부분지급", SystemType.PAYMENT, 2, false, true),
                    new StatusCode("PAYMENT", "COMPLETED", "완료", SystemType.PAYMENT, 3, true, false),
                    new StatusCode("PAYMENT", "OVERDUE", "연체", SystemType.PAYMENT, 4, false, true)
            ),
            "SUPPLIER", List.of(
                    new StatusCode("SUPPLIER", "PENDING", "심사대기", SystemType.SUPPLIER, 1, false, true),
                    new StatusCode("SUPPLIER", "APPROVED", "승인", SystemType.SUPPLIER, 2, true, false),
                    new StatusCode("SUPPLIER", "SUSPENDED", "일시정지", SystemType.SUPPLIER, 3, false, true),
                    new StatusCode("SUPPLIER", "BLACKLIST", "블랙리스트", SystemType.SUPPLIER, 4, true, false)
            ),
            
            // 입찰 상태
            "BIDDING", List.of(
                    new StatusCode("BIDDING", "PENDING", "대기중", SystemType.BIDDING, 1, false, true),
                    new StatusCode("BIDDING", "ONGOING", "진행중", SystemType.BIDDING, 2, false, true),
                    new StatusCode("BIDDING", "CLOSED", "마감", SystemType.BIDDING, 3, true, false),
                    new StatusCode("BIDDING", "CANCELED", "취소", SystemType.BIDDING, 4, true, false)
            ),

            // 입찰 방식
            "BID_METHOD", List.of(
                    new StatusCode("BID_METHOD", "FIXED_PRICE", "정가제안", SystemType.BID_METHOD, 1, false, false),
                    new StatusCode("BID_METHOD", "PRICE_SUGGESTION", "가격제안", SystemType.BID_METHOD, 2, false, false)
            ),

            // 입찰 계약
            "BIDDING_CONTRACT", List.of(
                    new StatusCode("BIDDING_CONTRACT", "DRAFT", "초안", SystemType.BIDDING_CONTRACT, 1, false, true),
                    new StatusCode("BIDDING_CONTRACT", "IN_PROGRESS", "진행중", SystemType.BIDDING_CONTRACT, 2, false, true),
                    new StatusCode("BIDDING_CONTRACT", "CLOSED", "완료", SystemType.BIDDING_CONTRACT, 3, true, false),
                    new StatusCode("BIDDING_CONTRACT", "CANCELED", "취소", SystemType.BIDDING_CONTRACT, 4, true, false)
            )
            
            );

    public StatusCode(String parentCode, String childCode, String codeName,
                      SystemType systemType, Integer sortOrder,
                      Boolean isTerminal, Boolean requiresApproval) {
        this.parentCode = parentCode;
        this.childCode = childCode;
        this.codeName = codeName;
        this.systemType = systemType;
        this.sortOrder = sortOrder;
        this.isTerminal = isTerminal;
        this.requiresApproval = requiresApproval;
    }
}

