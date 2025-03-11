package com.orbit.config.datainitializer;

import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.repository.commonCode.ChildCodeRepository;
import com.orbit.repository.commonCode.ParentCodeRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer {

    private final ParentCodeRepository parentCodeRepo;
    private final ChildCodeRepository childCodeRepo;

    @PostConstruct
    @Transactional
    public void initAllCommonCodes() {
        initProjectCodes();      // 프로젝트 관련 코드
        initPurchaseCodes();     // 구매 요청 관련 코드
        initApprovalCodes();     // 결재 관련 코드
    }

    //▶▶▶ 프로젝트 상태 코드 초기화
    private void initProjectCodes() {
        // 1. 기본 상태
        ParentCode projectStatus = initParentCode(
                "PROJECT", "STATUS", "프로젝트 기본 상태"
        );
        initChildCodes(projectStatus,
                List.of("REQUESTED", "RECEIVED", "REJECTED", "TERMINATED"),
                List.of("요청됨", "접수됨", "반려됨", "중도종결")
        );

        // 2. 조달 상태
        ParentCode projectProcurement = initParentCode(
                "PROJECT", "PROCUREMENT", "프로젝트 조달 상태"
        );
        initChildCodes(projectProcurement,
                List.of("REQUEST_RECEIVED", "VENDOR_SELECTION", "CONTRACT_PENDING",
                        "INSPECTION", "INVOICE_ISSUED", "PAYMENT_COMPLETED"),
                List.of("구매요청 접수", "업체 선정", "계약 대기",
                        "검수 진행", "인보이스 발행", "대급지급 완료")
        );
    }

    //▶▶▶ 구매 요청 상태 코드 초기화
    private void initPurchaseCodes() {
        // 1. 구매 요청 기본 상태
        ParentCode purchaseStatus = initParentCode(
                "PURCHASE_REQUEST",
                "STATUS",
                "구매 요청 상태"
        );
        initChildCodes(purchaseStatus,
                List.of("REQUESTED", "IN_REVIEW", "APPROVED", "REJECTED", "COMPLETED"),
                List.of("요청됨", "검토 중", "승인됨", "반려됨", "완료됨")
        );

        // 2. 구매 유형 (선택 사항)
        ParentCode purchaseType = initParentCode(
                "PURCHASE_REQUEST",
                "TYPE",
                "구매 유형"
        );
        initChildCodes(purchaseType,
                List.of("SI", "MAINTENANCE", "GOODS"),
                List.of("SI", "유지보수", "물품")
        );
    }

    //▶▶▶ 결재 상태 코드 초기화 (예시)
    private void initApprovalCodes() {
        ParentCode approvalStatus = initParentCode(
                "APPROVAL",
                "STATUS",
                "결재 상태"
        );
        initChildCodes(approvalStatus,
                List.of("PENDING", "APPROVED", "REJECTED"),
                List.of("대기", "승인", "반려")
        );
    }

    //▶▶▶ 공통 메서드
    private ParentCode initParentCode(String entityType, String codeGroup, String codeName) {
        return parentCodeRepo.findByEntityTypeAndCodeGroup(entityType, codeGroup)
                .orElseGet(() -> parentCodeRepo.save(
                        ParentCode.builder()
                                .entityType(entityType)
                                .codeGroup(codeGroup)
                                .codeName(codeName)
                                .isActive(true)
                                .build()
                ));
    }

    private void initChildCodes(ParentCode parent, List<String> codeValues, List<String> codeNames) {
        for (int i = 0; i < codeValues.size(); i++) {
            final int order = i + 1;
            String codeValue = codeValues.get(i);
            String codeName = codeNames.get(i);
            childCodeRepo.findByParentCodeAndCodeValue(parent, codeValue)
                    .orElseGet(() -> childCodeRepo.save(
                            ChildCode.builder()
                                    .parentCode(parent)
                                    .codeValue(codeValue)
                                    .codeName(codeName)
                                    .displayOrder(order)
                                    .isActive(true)
                                    .build()
                    ));
        }
    }
}
