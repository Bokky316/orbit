package com.orbit.constant;

import lombok.experimental.UtilityClass;

/**
 * 권한 및 상태 관련 상수 클래스
 */
@UtilityClass
public class BiddingStatus {
    // 직급 레벨 상수
    public static final int STAFF_LEVEL = 1;           // 사원
    public static final int ASSISTANT_MANAGER_LEVEL = 2;  // 대리
    public static final int MANAGER_LEVEL = 3;         // 과장
    public static final int SENIOR_MANAGER_LEVEL = 4;  // 차장
    public static final int DIRECTOR_LEVEL = 5;        // 부장
    public static final int EXECUTIVE_LEVEL = 6;       // 이사
    public static final int CEO_LEVEL = 7;             // 대표이사

    /**
     * 입찰 상태 코드 (공통 코드와 일치)
     */
    public static class BiddingStatusCode {
        public static final String PENDING = "PENDING";     // 대기중
        public static final String ONGOING = "ONGOING";     // 진행중
        public static final String CLOSED = "CLOSED";       // 마감
        public static final String CANCELED = "CANCELED";   // 취소
    }

    /**
     * 입찰 방식 코드 (공통 코드와 일치)
     */
    public static class BiddingMethodCode {
        public static final String FIXED_PRICE = "FIXED_PRICE";             // 정가제안
        public static final String PRICE_SUGGESTION = "PRICE_SUGGESTION";   // 가격제안
    }

    /**
     * 입찰 계약 상태 코드 (공통 코드와 일치)
     */
    public static class BiddingContractStatusCode {
        public static final String DRAFT = "DRAFT";         // 초안
        public static final String IN_PROGRESS = "IN_PROGRESS"; // 진행중
        public static final String CLOSED = "CLOSED";       // 완료
        public static final String CANCELED = "CANCELED";   // 취소
    }

    /**
     * 입찰 공고 상태별 권한 정책
     */
    public static class BiddingStatusPermissions {
        /**
         * 대기중(PENDING) 상태 권한
         */
        public static class PENDING {
            public static final int CREATE_MIN_LEVEL = STAFF_LEVEL;           // 사원도 초안 작성 가능
            public static final int MODIFY_MIN_LEVEL = ASSISTANT_MANAGER_LEVEL; // 대리 이상 수정 가능
            public static final int START_MIN_LEVEL = ASSISTANT_MANAGER_LEVEL;           // 과장 이상 진행 가능
            public static final int CANCEL_MIN_LEVEL = ASSISTANT_MANAGER_LEVEL;          // 과장 이상 취소 가능
            public static final int INVITE_SUPPLIER_MIN_LEVEL = ASSISTANT_MANAGER_LEVEL; // 과장 이상 공급사 초대 가능
        }
        
        /**
         * 진행중(ONGOING) 상태 권한
         */
        public static class ONGOING {
            public static final int VIEW_MIN_LEVEL = STAFF_LEVEL;             // 사원도 조회 가능
            public static final int MODIFY_MIN_LEVEL = ASSISTANT_MANAGER_LEVEL;   // 차장 이상만 제한적 수정 가능
            public static final int CLOSE_MIN_LEVEL = ASSISTANT_MANAGER_LEVEL;    // 차장 이상 마감 가능
            public static final int INVITE_SUPPLIER_MIN_LEVEL = MANAGER_LEVEL; // 과장 이상 공급사 초대 가능
        }
        
        /**
         * 마감(CLOSED) 상태 권한
         */
        public static class CLOSED {
            public static final int VIEW_MIN_LEVEL = STAFF_LEVEL;             // 사원도 조회 가능
            public static final int EVALUATE_MIN_LEVEL = MANAGER_LEVEL;        // 과장 이상 평가 가능
            public static final int SELECT_WINNER_MIN_LEVEL = SENIOR_MANAGER_LEVEL; // 차장 이상 낙찰자 선정 가능
            public static final int CONTRACT_CREATE_MIN_LEVEL = MANAGER_LEVEL; // 과장 이상 계약 초안 생성 가능
        }
        
        /**
         * 취소(CANCELED) 상태 권한
         */
        public static class CANCELED {
            public static final int VIEW_MIN_LEVEL = STAFF_LEVEL;             // 사원도 조회 가능
        }
    }

    /**
     * 입찰 계약 상태별 권한 정책
     */
    public static class BiddingContractStatusPermissions {
        /**
         * 초안(DRAFT) 상태 권한
         */
        public static class DRAFT {
            public static final int CREATE_MIN_LEVEL = MANAGER_LEVEL;
        }
        
        /**
         * 진행중(IN_PROGRESS) 상태 권한
         */
        public static class IN_PROGRESS {
            public static final int START_MIN_LEVEL = MANAGER_LEVEL;
            public static final int SIGN_MIN_LEVEL = MANAGER_LEVEL;
        }
        
        /**
         * 완료(CLOSED) 상태 권한
         */
        public static class CLOSED {
            public static final int VIEW_MIN_LEVEL = STAFF_LEVEL;
        }
        
        /**
         * 취소(CANCELED) 상태 권한
         */
        public static class CANCELED {
            public static final int VIEW_MIN_LEVEL = STAFF_LEVEL;
        }

        public static final int CHANGE_STATUS_MIN_LEVEL = SENIOR_MANAGER_LEVEL;
        public static final int CANCEL_MIN_LEVEL = SENIOR_MANAGER_LEVEL;
    }


    /**
     * 알림 우선순위
     */
    public static class NotificationPriority {
        public static final String LOW = "LOW";
        public static final String NORMAL = "NORMAL";
        public static final String HIGH = "HIGH";
    }

    /**
     * 알림 대상 그룹
     */
    public static class NotificationTargetGroup {
        public static final String ADMINS = "ADMINS";        // 관리자 그룹
        public static final String BUYERS = "BUYERS";        // 구매자 그룹
        public static final String SUPPLIERS = "SUPPLIERS";  // 공급자 그룹
        public static final String PARTICIPANTS = "PARTICIPANTS"; // 입찰 참여자 그룹
    }

    /**
     * 알림 타입
     */
    public static class NotificationType {



        // 입찰 관련 알림
        public static final String BIDDING_CREATED = "BIDDING_CREATED";
        public static final String BIDDING_INVITATION = "BIDDING_INVITATION";
        public static final String BIDDING_STARTED = "BIDDING_STARTED";
        public static final String BIDDING_CLOSED = "BIDDING_CLOSED";
        public static final String BIDDING_RESULT = "BIDDING_RESULT";
        public static final String BIDDING_CANCELED = "BIDDING_CANCELED";

        // 공급사 관련 알림
        public static final String SUPPLIER_PARTICIPATION = "SUPPLIER_PARTICIPATION";
        public static final String SUPPLIER_REJECTED = "SUPPLIER_REJECTED";
        public static final String BIDDING_PARTICIPATION_CONFIRM =  "BIDDING_PARTICIPATION_CONFIRM";
        public static final String BIDDING_WINNER_SELECTED =  "BIDDING_WINNER_SELECTED"; 

        // 계약 관련 알림
        public static final String CONTRACT_DRAFT = "CONTRACT_DRAFT";
        public static final String CONTRACT_STARTED = "CONTRACT_STARTED";
        public static final String CONTRACT_SIGNED = "CONTRACT_SIGNED";
        public static final String CONTRACT_COMPLETED = "CONTRACT_COMPLETED";
        public static final String CONTRACT_CANCELED = "CONTRACT_CANCELED";
        public static final String CONTRACT_STATUS_CHANGED = "CONTRACT_STATUS_CHANGED";

        // 발주 관련 알림
        public static final String ORDER_CREATED = "ORDER_CREATED";
        public static final String ORDER_APPROVED = "ORDER_APPROVED";
        // public static final String ORDER_SHIPPED = "ORDER_SHIPPED";
        // public static final String ORDER_DELIVERED = "ORDER_DELIVERED";
    }
}