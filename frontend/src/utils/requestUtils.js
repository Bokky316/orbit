// 구매 요청 상태 필터링 유틸리티
export const filterRequestsByStatus = (requests, status) => {
  if (!requests) return [];

  switch (status) {
    case 'TOTAL':
      return requests; // 모든 요청

    case 'IN_PROGRESS':
      // 백엔드 로직과 일치: 완료 및 반려가 아닌 모든 요청을 '진행 중'으로 간주
      return requests.filter(req =>
        req.status !== 'COMPLETED' &&
        req.status !== 'PAYMENT_COMPLETED' &&
        req.status !== 'REJECTED'
      );

    case 'COMPLETED':
      return requests.filter(req =>
        req.status === 'PAYMENT_COMPLETED'
      );

    case 'REJECTED':
      return requests.filter(req =>
        req.status === 'REJECTED'
      );

    default:
      return requests;
  }
};

export const statusLabels = {
  TOTAL: '전체',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
  REJECTED: '반려'
};

export const statusColors = {
  TOTAL: { light: '#E6F2FF', dark: '#1976D2' },
  IN_PROGRESS: { light: '#FFF3E0', dark: '#ED6C02' },
  COMPLETED: { light: '#E8F5E9', dark: '#2E7D32' },
  REJECTED: { light: '#FFEBEE', dark: '#D32F2F' }
};