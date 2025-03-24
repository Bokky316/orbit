// frontend/src/pages/bidding/helpers/permissionUtils.js
import { UserRole, BiddingStatus, BiddingMethod } from "./biddingTypes";

const PERMISSION_MATRIX = {
  ADMIN: {
    create: true,
    update: true,
    delete: true,
    changeStatus: true,
    selectWinner: true,
    createContract: true,
    createOrder: true
  },
  BUYER: {
    create: true,
    update: true,
    delete: false,
    changeStatus: true,
    selectWinner: true,
    createContract: true,
    createOrder: true
  }
};

class PermissionService {
  static checkPermission(user, permission) {
    // 사용자의 Role 가져오기 (ROLE_ 접두사 제거)
    const userRole = Array.isArray(user.roles)
      ? user.roles[0].replace("ROLE_", "")
      : (user.role || "").replace("ROLE_", "");

    // console.log("체크할 권한:", permission);
    // console.log("사용자 Role:", userRole);

    if (!userRole) return false;

    const rolePermissions = PERMISSION_MATRIX[userRole];
    //console.log("Role 권한:", rolePermissions);

    return rolePermissions ? rolePermissions[permission] || false : false;
  }

  /**
   * 입찰 공고 관리 권한 체크
   * @param {string} mode - 모드 ('create' | 'edit')
   * @param {Object} bidding - 입찰 공고 정보
   * @param {Object} user - 사용자 정보
   * @returns {boolean} 권한 유무
   */
  static canManageBidding(mode, bidding, user) {
    // 생성 모드는 기본 권한 체크
    if (mode === "create") return this.checkPermission(user, "create");

    // 수정 모드는 상태와 권한 함께 체크
    const editableStatuses = [BiddingStatus.PENDING, BiddingStatus.ONGOING];
    return (
      this.checkPermission(user, "update") &&
      editableStatuses.includes(bidding?.status?.childCode)
    );
  }

  /**
   * 입찰 공고 상태 변경 권한 체크
   * @param {string} currentStatus - 현재 상태
   * @param {string} newStatus - 변경할 상태
   * @param {Object} user - 사용자 정보
   * @returns {boolean} 권한 유무
   */
  static canChangeBiddingStatus(currentStatus, newStatus, user) {
    const statusTransitionMap = {
      [BiddingStatus.PENDING]: [BiddingStatus.ONGOING, BiddingStatus.CANCELED],
      [BiddingStatus.ONGOING]: [BiddingStatus.CLOSED, BiddingStatus.CANCELED],
      [BiddingStatus.CLOSED]: [],
      [BiddingStatus.CANCELED]: []
    };

    return (
      this.checkPermission(user, "changeStatus") &&
      statusTransitionMap[currentStatus]?.includes(newStatus)
    );
  }

  /**
   * 낙찰자 선정 권한 체크
   * @param {Object} bidding - 입찰 공고 정보
   * @param {Object} user - 사용자 정보
   * @returns {boolean} 권한 유무
   */
  static canSelectWinner(bidding, user) {
    return (
      this.checkPermission(user, "selectWinner") &&
      bidding.status?.childCode === BiddingStatus.CLOSED &&
      (bidding.participations?.length || 0) > 0
    );
  }

  /**
   * 계약 초안 생성 권한 체크
   * @param {Object} bidding - 입찰 공고 정보
   * @param {Object} user - 사용자 정보
   * @returns {boolean} 권한 유무
   */
  static canCreateContractDraft(bidding, user) {
    return (
      this.checkPermission(user, "createContract") &&
      bidding.status?.childCode === BiddingStatus.CLOSED &&
      !!bidding.selectedParticipationId &&
      (!bidding.contracts || bidding.contracts.length === 0)
    );
  }

  /**
   * 주문 생성 권한 체크
   * @param {Object} bidding - 입찰 공고 정보
   * @param {Object} user - 사용자 정보
   * @returns {boolean} 권한 유무
   */
  static canCreateOrder(bidding, user) {
    return (
      this.checkPermission(user, "createOrder") &&
      bidding.status?.childCode === BiddingStatus.CLOSED &&
      !!bidding.selectedParticipationId &&
      (!bidding.orders || bidding.orders.length === 0)
    );
  }

  /**
   * 평가 권한 체크
   * @param {Object} bidding - 입찰 공고 정보
   * @param {Object} user - 사용자 정보
   * @returns {boolean} 권한 유무
   */
  static canEvaluateParticipation(bidding, user) {
    const validStatuses = [BiddingStatus.ONGOING, BiddingStatus.CLOSED];
    return (
      this.checkPermission(user, "selectWinner") &&
      validStatuses.includes(bidding.status?.childCode) &&
      (bidding.participations?.length || 0) > 0
    );
  }
}

export default PermissionService;

// 사용 예시
export function usePermission(user) {
  return {
    canCreateBidding: PermissionService.checkPermission(user, "create"),
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
