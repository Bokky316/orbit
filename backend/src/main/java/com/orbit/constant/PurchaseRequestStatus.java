package com.orbit.constant;

/**
 * 구매 요청의 상태를 나타내는 열거형
 */
public enum PurchaseRequestStatus {
    PURCHASE_REQUESTED,  // 구매요청 상태
    RECEPTION_REJECTED,  // 접수반려 상태
    PURCHASE_RECEIVED    // 구매접수 상태
}
