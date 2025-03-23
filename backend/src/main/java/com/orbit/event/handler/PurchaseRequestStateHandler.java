package com.orbit.event.handler;

import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.entity.commonCode.SystemStatus;
import com.orbit.entity.procurement.PurchaseRequest;
import com.orbit.event.event.PurchaseRequestStatusChangeEvent;
import com.orbit.repository.commonCode.ChildCodeRepository;
import com.orbit.repository.commonCode.ParentCodeRepository;
import com.orbit.repository.procurement.PurchaseRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 구매 요청 상태 변경 핸들러
 * 다른 모듈에서 호출하여 구매 요청 상태를 변경할 수 있는 유틸리티 클래스
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PurchaseRequestStateHandler {

    private final PurchaseRequestRepository purchaseRequestRepository;
    private final ParentCodeRepository parentCodeRepository;
    private final ChildCodeRepository childCodeRepository;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * 구매 요청 상태를 변경하는 메소드
     *
     * @param purchaseRequestId 구매 요청 ID
     * @param statusCode 변경할 상태 코드 (REQUESTED, RECEIVED, VENDOR_SELECTION 등)
     * @param username 변경 사용자
     * @return 성공 여부
     */
    @Transactional
    public boolean changeRequestStatus(Long purchaseRequestId, String statusCode, String username) {
        try {
            // 1. 구매 요청 조회
            PurchaseRequest purchaseRequest = purchaseRequestRepository.findById(purchaseRequestId)
                    .orElse(null);

            if (purchaseRequest == null) {
                log.warn("구매 요청을 찾을 수 없습니다. ID: {}", purchaseRequestId);
                return false;
            }

            // 2. 현재 상태 확인
            SystemStatus currentStatus = purchaseRequest.getStatus();
            String oldStatusCode = currentStatus != null ? currentStatus.getFullCode() : null;

            // 3. 상태 변경 필요한지 체크
            if (currentStatus != null && statusCode.equals(currentStatus.getChildCode())) {
                log.info("구매 요청({})의 상태가 이미 {}입니다. 업데이트를 건너뜁니다.", purchaseRequestId, statusCode);
                return true;
            }

            // 4. 새 상태 코드 설정
            ParentCode parentCode = parentCodeRepository.findByEntityTypeAndCodeGroup("PURCHASE_REQUEST", "STATUS")
                    .orElse(null);

            if (parentCode == null) {
                log.error("상태 코드 그룹을 찾을 수 없습니다: PURCHASE_REQUEST, STATUS");
                return false;
            }

            ChildCode childCode = childCodeRepository.findByParentCodeAndCodeValue(parentCode, statusCode)
                    .orElse(null);

            if (childCode == null) {
                log.error("상태 코드를 찾을 수 없습니다: {}", statusCode);
                return false;
            }

            // 5. 상태 업데이트
            SystemStatus newStatus = new SystemStatus(parentCode.getCodeName(), childCode.getCodeValue());
            purchaseRequest.setStatus(newStatus);

            // 6. 저장
            purchaseRequestRepository.save(purchaseRequest);

            // 7. 이벤트 발행
            PurchaseRequestStatusChangeEvent event = new PurchaseRequestStatusChangeEvent(
                    this,
                    purchaseRequestId,
                    oldStatusCode,
                    newStatus.getFullCode(),
                    username
            );
            eventPublisher.publishEvent(event);

            log.info("구매 요청({}) 상태 변경 성공: {} -> {}", purchaseRequestId,
                    currentStatus != null ? currentStatus.getChildCode() : "NULL",
                    statusCode);

            return true;
        } catch (Exception e) {
            log.error("구매 요청 상태 변경 중 오류 발생: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * 구매 요청을 다음 단계로 진행하는 메소드
     * 현재 상태를 확인하고 자동으로 다음 단계로 변경
     */
    @Transactional
    public boolean moveToNextStatus(Long purchaseRequestId, String username) {
        try {
            // 1. 구매 요청 조회
            PurchaseRequest purchaseRequest = purchaseRequestRepository.findById(purchaseRequestId)
                    .orElse(null);

            if (purchaseRequest == null) {
                log.warn("구매 요청을 찾을 수 없습니다. ID: {}", purchaseRequestId);
                return false;
            }

            // 2. 현재 상태 확인
            SystemStatus currentStatus = purchaseRequest.getStatus();
            if (currentStatus == null) {
                return changeRequestStatus(purchaseRequestId, "REQUESTED", username);
            }

            // 3. 다음 상태 결정
            String nextStatus = getNextStatus(currentStatus.getChildCode());
            if (nextStatus == null) {
                log.info("구매 요청({})은 이미 최종 상태입니다: {}", purchaseRequestId, currentStatus.getChildCode());
                return true;
            }

            // 4. 상태 변경
            return changeRequestStatus(purchaseRequestId, nextStatus, username);

        } catch (Exception e) {
            log.error("구매 요청 다음 상태 변경 중 오류 발생: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * 현재 상태에 따라 다음 상태 코드 반환
     */
    private String getNextStatus(String currentStatus) {
        switch (currentStatus) {
            case "REQUESTED":
                return "RECEIVED";
            case "RECEIVED":
                return "VENDOR_SELECTION";
            case "VENDOR_SELECTION":
                return "CONTRACT_PENDING";
            case "CONTRACT_PENDING":
                return "INSPECTION";
            case "INSPECTION":
                return "INVOICE_ISSUED";
            case "INVOICE_ISSUED":
                return "PAYMENT_COMPLETED";
            case "PAYMENT_COMPLETED":
                return null; // 최종 상태
            default:
                return "REQUESTED"; // 상태를 알 수 없는 경우 초기 상태로
        }
    }
}