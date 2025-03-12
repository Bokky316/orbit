// src/utils/approvalUtils.js

import { fetchWithAuth } from './fetchWithAuth';
import { API_URL } from './constants';

/**
 * 결재선 조회 유틸리티 함수
 * @param {number} purchaseRequestId - 구매요청 ID
 * @returns {Promise<Array>} - 결재선 목록
 */
export const fetchApprovalLines = async (purchaseRequestId) => {
  try {
    const response = await fetchWithAuth(`${API_URL}approvals/${purchaseRequestId}`);

    if (!response.ok) {
      throw new Error(`결재선 조회 실패: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('결재선 조회 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 결재선 생성 유틸리티 함수
 * @param {Object} approvalLineData - 결재선 생성 데이터
 * @param {number} approvalLineData.purchaseRequestId - 구매요청 ID
 * @param {Array<number>} approvalLineData.approverIds - 결재자 ID 목록
 * @param {string} approvalLineData.initialStatusCode - 초기 상태 코드
 * @returns {Promise<void>}
 */
export const createApprovalLine = async (approvalLineData) => {
  try {
    const response = await fetchWithAuth(`${API_URL}approvals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(approvalLineData)
    });

    if (!response.ok) {
      throw new Error(`결재선 생성 실패: ${response.status}`);
    }
  } catch (error) {
    console.error('결재선 생성 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 결재 처리 유틸리티 함수
 * @param {number} lineId - 결재선 ID
 * @param {string} action - 수행할 액션 (APPROVE 또는 REJECT)
 * @param {string} comment - 결재 의견
 * @param {string} nextStatusCode - 다음 상태 코드
 * @returns {Promise<void>}
 */
export const processApproval = async (lineId, action, comment, nextStatusCode) => {
  try {
    const response = await fetchWithAuth(`${API_URL}approvals/${lineId}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action,
        comment,
        nextStatusCode
      })
    });

    if (!response.ok) {
      throw new Error(`결재 처리 실패: ${response.status}`);
    }
  } catch (error) {
    console.error('결재 처리 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 상태 코드에 따른 한글 상태명 반환 유틸리티 함수
 * @param {string} statusCode - 상태 코드
 * @returns {string} - 한글 상태명
 */
export const getStatusName = (statusCode) => {
  switch(statusCode) {
    case 'APPROVED': return '승인완료';
    case 'REJECTED': return '반려';
    case 'IN_REVIEW': return '검토중';
    case 'PENDING': return '대기중';
    default: return statusCode;
  }
};

/**
 * 결재선 설정 가능 여부 확인 유틸리티 함수
 * 이미 결재선이 존재하거나 결재 진행 중인 경우 설정 불가
 * @param {Array} approvalLines - 결재선 목록
 * @returns {boolean} - 설정 가능 여부
 */
export const canSetupApprovalLine = (approvalLines) => {
  if (!approvalLines || approvalLines.length === 0) {
    return true;
  }

  // 이미 승인 또는 반려된 항목이 있는 경우 설정 불가
  const hasProcessedLine = approvalLines.some(
    line => line.statusCode === 'APPROVED' || line.statusCode === 'REJECTED'
  );

  return !hasProcessedLine;
};

/**
 * 현재 사용자가 결재 권한이 있는지 확인하는 유틸리티 함수
 * @param {Array} approvalLines - 결재선 목록
 * @param {number} currentUserId - 현재 사용자 ID
 * @returns {Object} - 결재 권한 정보 ({ canApprove: boolean, lineId: number })
 */
export const getUserApprovalAuthority = (approvalLines, currentUserId) => {
  if (!approvalLines || approvalLines.length === 0 || !currentUserId) {
    return { canApprove: false, lineId: null };
  }

  // 상태가 IN_REVIEW이고 현재 사용자가 결재자인 항목 찾기
  const currentUserApprovalLine = approvalLines.find(
    line => line.statusCode === 'IN_REVIEW' && line.approverId === currentUserId
  );

  return {
    canApprove: !!currentUserApprovalLine,
    lineId: currentUserApprovalLine?.id || null
  };
};

/**
 * 사용자의 결재 대기 목록 조회 유틸리티 함수
 * @returns {Promise<Array>} - 결재 대기 목록
 */
export const fetchPendingApprovals = async () => {
  try {
    const response = await fetchWithAuth(`${API_URL}approvals/pending`);

    if (!response.ok) {
      throw new Error(`결재 대기 목록 조회 실패: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('결재 대기 목록 조회 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 사용자의 결재 완료 목록 조회 유틸리티 함수
 * @returns {Promise<Array>} - 결재 완료 목록
 */
export const fetchCompletedApprovals = async () => {
  try {
    const response = await fetchWithAuth(`${API_URL}approvals/completed`);

    if (!response.ok) {
      throw new Error(`결재 완료 목록 조회 실패: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('결재 완료 목록 조회 중 오류 발생:', error);
    throw error;
  }
};