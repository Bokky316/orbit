import { BiddingStatus } from "./biddingTypes";

const POSITION_LEVEL = {
  staff: 1,
  assistant: 2,
  manager: 3,
  seniorManager: 4,
  director: 5,
  executive: 6,
  ceo: 7
};

// 직급별 한글 명칭 매핑
const POSITION_MAPPING = {
  직원: 1,
  대리: 2,
  과장: 3,
  차장: 4,
  부장: 5,
  임원: 6,
  대표: 7
};

class PermissionService {
  static getPositionLevel(user) {
    if (!user) return 0;

    // position_id가 있는 경우 직접 사용
    if (user.position_id) {
      return user.position_id;
    }

    // position 속성이 있는 경우
    if (user.position) {
      // 직급이 숫자인 경우
      if (typeof user.position === "number") {
        return user.position;
      }

      // 직급이 문자열인 경우, 한글 직급명 또는 영문 직급명 확인
      const positionStr = user.position.toString();

      // 한글 직급명 확인
      for (const [key, value] of Object.entries(POSITION_MAPPING)) {
        if (positionStr.includes(key)) {
          return value;
        }
      }

      // 영문 직급명 확인
      const key = Object.keys(POSITION_LEVEL).find(
        (k) =>
          positionStr.includes(k) ||
          positionStr.toLowerCase().includes(k.toLowerCase())
      );

      if (key) {
        return POSITION_LEVEL[key];
      }
    }

    // user.name에서 직급 추출 시도 (예: '구매팀 과장1'에서 '과장' 추출)
    if (user.name) {
      for (const [key, value] of Object.entries(POSITION_MAPPING)) {
        if (user.name.includes(key)) {
          console.log(`직급이 사용자 이름에서 추출됨: ${key}, 레벨: ${value}`);
          return value;
        }
      }
    }

    // 모든 추출 시도가 실패하면 기본값 반환
    console.log("직급 정보를 찾을 수 없어 기본값 (0) 반환");
    return 0;
  }

  static checkPermission(user, action, status = null) {
    if (!user) {
      console.log("사용자 정보가 없습니다.");
      return false;
    }

    console.log("권한 체크:", { user, action, status });

    // 역할 확인 (user.roles 또는 user.role에서 추출)
    const userRoles = user.roles || [user.role];
    const normalizedRoles = userRoles
      .filter(Boolean)
      .map((role) =>
        typeof role === "string" ? role.replace("ROLE_", "") : role
      );

    // ADMIN 역할은 모든 권한 부여
    if (normalizedRoles.includes("ADMIN")) {
      console.log("ADMIN 역할이 확인되어 모든 권한 부여");
      return true;
    }

    // BUYER가 아니면 권한 없음
    if (
      !normalizedRoles.includes("BUYER") &&
      !normalizedRoles.includes("ROLE_BUYER")
    ) {
      console.log("BUYER 역할이 없어 권한 거부");
      return false;
    }

    // 직급 레벨 확인
    const positionLevel = this.getPositionLevel(user);
    console.log(`직급 레벨: ${positionLevel}`);

    // 과장 이상은 모든 작업 가능
    if (positionLevel >= 3) {
      console.log("과장 이상 직급으로 모든 권한 부여");
      return true;
    }

    const isPending = status === BiddingStatus.PENDING;
    const isOngoing = status === BiddingStatus.ONGOING;
    const isClosed = status === BiddingStatus.CLOSED;

    // 상태별 권한 체크
    switch (action) {
      case "create":
        // 모든 직원은 생성 가능
        console.log("생성 권한 체크: 모든 직원 가능");
        return true;

      case "edit":
        // 대기 상태에서만 수정 가능, 대리 이상
        const canEdit = isPending && positionLevel >= 2;
        console.log(`수정 권한 체크: ${canEdit ? "가능" : "불가능"}`);
        return canEdit;

      case "delete":
        // 대기 상태에서만 삭제 가능, 대리 이상
        const canDelete = isPending && positionLevel >= 2;
        console.log(`삭제 권한 체크: ${canDelete ? "가능" : "불가능"}`);
        return canDelete;

      case "changeStatus":
        // 대리 이상만 상태 변경 가능
        const canChange = positionLevel >= 2;
        console.log(`상태 변경 권한 체크: ${canChange ? "가능" : "불가능"}`);
        return canChange;

      case "selectWinner":
      case "createContract":
      case "createOrder":
        // 과장 이상만 낙찰자 선정, 계약/발주 가능
        const canManage = positionLevel >= 3;
        console.log(
          `관리 권한 체크 (${action}): ${canManage ? "가능" : "불가능"}`
        );
        return canManage;

      default:
        console.log(`알 수 없는 액션: ${action}`);
        return false;
    }
  }

  static canManageBidding(mode, bidding, user) {
    if (!bidding) {
      console.log("입찰 정보가 없습니다.");
      return false;
    }

    const status = bidding?.status?.childCode || bidding?.status;
    console.log(`입찰 관리 권한 체크 (${mode}): 상태 - ${status}`);

    return this.checkPermission(user, mode, status);
  }

  static canChangeBiddingStatus(currentStatus, newStatus, user) {
    if (!currentStatus) {
      console.log("현재 상태 정보가 없습니다.");
      return false;
    }

    console.log(`상태 변경 권한 체크: ${currentStatus} -> ${newStatus}`);

    const allowed = {
      [BiddingStatus.PENDING]: [BiddingStatus.ONGOING, BiddingStatus.CANCELED],
      [BiddingStatus.ONGOING]: [BiddingStatus.CLOSED, BiddingStatus.CANCELED]
    };

    const hasPermission = this.checkPermission(
      user,
      "changeStatus",
      currentStatus
    );
    const validTransition = allowed[currentStatus]?.includes(newStatus);

    console.log(`권한: ${hasPermission}, 유효한 전환: ${validTransition}`);

    return hasPermission && validTransition;
  }

  static canSelectWinner(bidding, user) {
    if (!bidding) return false;
    return (
      this.checkPermission(user, "selectWinner", bidding.status?.childCode) &&
      bidding.status?.childCode === BiddingStatus.CLOSED &&
      (bidding.participations?.length || 0) > 0
    );
  }

  static canCreateContractDraft(bidding, user) {
    if (!bidding) return false;
    return (
      this.checkPermission(user, "createContract", bidding.status?.childCode) &&
      bidding.status?.childCode === BiddingStatus.CLOSED &&
      !!bidding.selectedParticipationId &&
      (!bidding.contracts || bidding.contracts.length === 0)
    );
  }

  static canCreateOrder(bidding, user) {
    if (!bidding) return false;
    return (
      this.checkPermission(user, "createOrder", bidding.status?.childCode) &&
      bidding.status?.childCode === BiddingStatus.CLOSED &&
      !!bidding.selectedParticipationId &&
      (!bidding.orders || bidding.orders.length === 0)
    );
  }

  static canEvaluateParticipation(bidding, user) {
    if (!bidding) return false;
    const validStatuses = [BiddingStatus.ONGOING, BiddingStatus.CLOSED];
    return (
      this.checkPermission(user, "selectWinner", bidding.status?.childCode) &&
      validStatuses.includes(bidding.status?.childCode) &&
      (bidding.participations?.length || 0) > 0
    );
  }
}

export default PermissionService;

// Hook 형태로 export
export function usePermission(user) {
  return {
    canCreateBidding: () => PermissionService.checkPermission(user, "create"),
    canUpdateBidding: (bidding) =>
      PermissionService.canManageBidding("edit", bidding, user),
    canChangeBiddingStatus: (currentStatus, newStatus) =>
      PermissionService.canChangeBiddingStatus(currentStatus, newStatus, user),
    canSelectWinner: (bidding) =>
      PermissionService.canSelectWinner(bidding, user),
    canCreateContractDraft: (bidding) =>
      PermissionService.canCreateContractDraft(bidding, user),
    canCreateOrder: (bidding) => PermissionService.canCreateOrder(bidding, user)
  };
}
