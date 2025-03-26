package com.orbit.entity.procurement;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import jakarta.persistence.PrePersist;

public class PurchaseRequestListener {

    @PrePersist
    public void onPrePersist(PurchaseRequest purchaseRequest) {
        // requestNumber가 아직 설정되지 않은 경우에만 자동 생성
        if (purchaseRequest.getRequestNumber() == null) {
            // 현재 년월 (YYMM)
            String yearMonth = LocalDate.now().format(DateTimeFormatter.ofPattern("yyMM"));

            // 임시 번호 설정 (실제 번호는 저장 시 데이터베이스 쿼리를 통해 결정)
            // 이 임시 번호는 PurchaseRequestIdGenerator에서 적절히 대체됨
            purchaseRequest.setRequestNumber("REQ-" + yearMonth + "-001");
        }

        // 요청 날짜가 설정되지 않은 경우 현재 날짜로 설정
        if (purchaseRequest.getRequestDate() == null) {
            purchaseRequest.setRequestDate(LocalDate.now());
        }
    }
}