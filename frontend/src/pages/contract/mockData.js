// 계약 목록 임의 데이터
export const MOCK_CONTRACTS = [
  {
    id: 1001,
    transactionNumber: "CT-20250312-001",
    biddingId: 101,
    biddingNumber: "BID-20250301-001",
    title: "2025년 서버 장비 구매 계약",
    supplierId: 301,
    supplierName: "(주)서버솔루션",
    buyerName: "구매부서",
    totalAmount: 50000000,
    startDate: "2025-03-15",
    endDate: "2025-06-15",
    status: "활성",
    signatureStatus: "완료",
    buyerSignature: true,
    supplierSignature: true,
    buyerSignedAt: "2025-03-14",
    supplierSignedAt: "2025-03-15",
    createdAt: "2025-03-12",
    updatedAt: "2025-03-15",
    note: "3개월 유지보수 포함",
    finalContractFilePath: "/contracts/CT-20250312-001.pdf",
    createdBy: "admin@example.com"
  },
  {
    id: 1002,
    transactionNumber: "CT-20250320-002",
    biddingId: 102,
    biddingNumber: "BID-20250310-002",
    title: "네트워크 장비 공급 계약",
    supplierId: 302,
    supplierName: "(주)네트워크시스템",
    buyerName: "IT부서",
    totalAmount: 35000000,
    startDate: "2025-03-25",
    endDate: "2025-09-25",
    status: "서명중",
    signatureStatus: "내부서명",
    buyerSignature: true,
    supplierSignature: false,
    buyerSignedAt: "2025-03-22",
    supplierSignedAt: null,
    createdAt: "2025-03-20",
    updatedAt: "2025-03-22",
    note: "6개월 유지보수 포함, 설치 서비스 포함",
    finalContractFilePath: null,
    createdBy: "admin@example.com"
  },
  {
    id: 1003,
    transactionNumber: "CT-20250305-003",
    biddingId: 103,
    biddingNumber: "BID-20250225-003",
    title: "소프트웨어 라이센스 계약",
    supplierId: 303,
    supplierName: "(주)소프트웨어솔루션",
    buyerName: "IT부서",
    totalAmount: 12000000,
    startDate: "2025-03-10",
    endDate: "2026-03-09",
    status: "완료",
    signatureStatus: "완료",
    buyerSignature: true,
    supplierSignature: true,
    buyerSignedAt: "2025-03-07",
    supplierSignedAt: "2025-03-08",
    createdAt: "2025-03-05",
    updatedAt: "2025-03-08",
    note: "1년 구독 라이센스, 기술 지원 포함",
    finalContractFilePath: "/contracts/CT-20250305-003.pdf",
    createdBy: "manager@example.com"
  },
  {
    id: 1004,
    transactionNumber: "CT-20250228-004",
    biddingId: 104,
    biddingNumber: "BID-20250220-004",
    title: "클라우드 서비스 이용 계약",
    supplierId: 304,
    supplierName: "클라우드서비스(주)",
    buyerName: "IT인프라팀",
    totalAmount: 8400000,
    startDate: "2025-03-01",
    endDate: "2026-02-28",
    status: "활성",
    signatureStatus: "완료",
    buyerSignature: true,
    supplierSignature: true,
    buyerSignedAt: "2025-02-27",
    supplierSignedAt: "2025-02-28",
    createdAt: "2025-02-28",
    updatedAt: "2025-02-28",
    note: "1년 구독 서비스, 기본 SLA 포함",
    finalContractFilePath: "/contracts/CT-20250228-004.pdf",
    createdBy: "user@example.com"
  },
  {
    id: 1005,
    transactionNumber: "CT-20250220-005",
    biddingId: 105,
    biddingNumber: "BID-20250210-005",
    title: "보안 소프트웨어 도입 계약",
    supplierId: 305,
    supplierName: "(주)보안시스템",
    buyerName: "보안팀",
    totalAmount: 18500000,
    startDate: "2025-02-25",
    endDate: "2026-02-24",
    status: "활성",
    signatureStatus: "완료",
    buyerSignature: true,
    supplierSignature: true,
    buyerSignedAt: "2025-02-22",
    supplierSignedAt: "2025-02-23",
    createdAt: "2025-02-20",
    updatedAt: "2025-02-23",
    note: "1년 라이센스, 분기별 보안 점검 서비스 포함",
    finalContractFilePath: "/contracts/CT-20250220-005.pdf",
    createdBy: "security@example.com"
  },
  {
    id: 1006,
    transactionNumber: "CT-20250315-006",
    biddingId: 106,
    biddingNumber: "BID-20250301-006",
    title: "사무용 가구 구매 계약",
    supplierId: 306,
    supplierName: "(주)오피스퍼니처",
    buyerName: "총무팀",
    totalAmount: 15800000,
    startDate: "2025-03-20",
    endDate: "2025-04-20",
    status: "초안",
    signatureStatus: "미서명",
    buyerSignature: false,
    supplierSignature: false,
    buyerSignedAt: null,
    supplierSignedAt: null,
    createdAt: "2025-03-15",
    updatedAt: "2025-03-15",
    note: "1개월 내 납품 완료",
    finalContractFilePath: null,
    createdBy: "admin@example.com"
  }
];

// 계약 상세 정보 (특정 ID에 대한)
export const getContractDetail = (id) => {
  const contract = MOCK_CONTRACTS.find((c) => c.id === parseInt(id));

  if (!contract) return null;

  // 기본 계약 정보에 추가 세부 정보를 포함해서 반환
  return {
    ...contract,
    contractItems: [
      {
        id: 1,
        name: "계약 기본 약관",
        content:
          "본 계약은 구매자와 공급자 간의 상품 및 서비스 제공에 관한 계약으로...",
        type: "TEXT"
      },
      {
        id: 2,
        name: "품질 보증 약관",
        content:
          "공급자는 제공하는 모든 상품 및 서비스에 대해 품질을 보증하며...",
        type: "TEXT"
      },
      {
        id: 3,
        name: "지불 조건",
        content: "계약금 30%, 중도금 40%, 잔금 30% 구조로 지불됩니다...",
        type: "TEXT"
      }
    ],
    history: [
      {
        id: 1,
        timestamp: new Date(contract.createdAt).getTime(),
        action: "계약 생성",
        user: contract.createdBy,
        description: "계약 초안이 생성되었습니다."
      },
      {
        id: 2,
        timestamp: new Date(contract.createdAt).getTime() + 86400000, // 하루 후
        action: "계약 검토",
        user: "reviewer@example.com",
        description: "법무팀 검토 완료"
      },
      {
        id: 3,
        timestamp: contract.buyerSignedAt
          ? new Date(contract.buyerSignedAt).getTime()
          : null,
        action: "구매자 서명",
        user: "buyer@example.com",
        description: "구매자 서명 완료"
      },
      {
        id: 4,
        timestamp: contract.supplierSignedAt
          ? new Date(contract.supplierSignedAt).getTime()
          : null,
        action: "공급자 서명",
        user: "supplier@example.com",
        description: "공급자 서명 완료"
      }
    ].filter((item) => item.timestamp !== null) // null 타임스탬프 제거
  };
};

// 계약 초안 생성 응답 시뮬레이션
export const createContractDraft = (data) => {
  const newId = Math.max(...MOCK_CONTRACTS.map((c) => c.id)) + 1;
  const today = new Date();
  const newContract = {
    id: newId,
    transactionNumber: `CT-${today.getFullYear()}${String(
      today.getMonth() + 1
    ).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}-${String(
      newId
    ).padStart(3, "0")}`,
    biddingId: data.biddingId,
    biddingNumber: `BID-${today.getFullYear()}${String(
      today.getMonth() + 1
    ).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}-${String(
      data.biddingId
    ).padStart(3, "0")}`,
    title: data.title,
    supplierId: 300 + Math.floor(Math.random() * 10),
    supplierName: "임시 공급업체명",
    buyerName: "구매부서",
    totalAmount: 0,
    startDate: null,
    endDate: null,
    status: "초안",
    signatureStatus: "미서명",
    buyerSignature: false,
    supplierSignature: false,
    buyerSignedAt: null,
    supplierSignedAt: null,
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
    note: data.note || "",
    finalContractFilePath: null,
    createdBy: "current_user@example.com"
  };

  // 실제 구현에서는 여기서 MOCK_CONTRACTS에 추가
  // MOCK_CONTRACTS.push(newContract);

  return newContract;
};
