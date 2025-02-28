package com.orbit.constant;

/**
 * 신청 상태(Enum)
 * - PENDING: 대기 중
 * - APPROVED: 승인됨
 * - REJECTED: 거절됨
 * - ON_HOLD: 보류됨
 * - RESUBMITTED: 재신청됨
 */
public enum SupplierStatus {
    PENDING,     // 대기 중
    APPROVED,    // 승인됨
    REJECTED,    // 거절됨
    ON_HOLD,     // 보류됨
    RESUBMITTED  // 재신청됨
}
