// frontend/src/pages/bidding/dummyData.jsx
import React from "react";

// 상태 코드 상수
export const BiddingStatus = {
  PENDING: "PENDING",
  ONGOING: "ONGOING",
  CLOSED: "CLOSED",
  CANCELED: "CANCELED"
};

// 입찰 방식 상수
export const BiddingMethod = {
  FIXED_PRICE: "FIXED_PRICE",
  OPEN_PRICE: "OPEN_PRICE"
};

// 사용자 역할 상수
export const UserRole = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  BUYER: "BUYER",
  SUPPLIER: "SUPPLIER"
};

// 구매요청 더미데이터
export const purchaseRequestsData = [
  {
    id: "PR-2025-0001",
    title: "2025년 1분기 서버 장비 구매",
    department: "IT인프라팀",
    requestDate: "2025-01-15",
    status: "APPROVED",
    expectedBudget: 150000000,
    itemList: [
      { id: "ITEM-001", name: "서버 랙", quantity: 5, unitPrice: 8000000 },
      { id: "ITEM-002", name: "서버 본체", quantity: 10, unitPrice: 7000000 },
      {
        id: "ITEM-003",
        name: "네트워크 스위치",
        quantity: 8,
        unitPrice: 3000000
      }
    ],
    requesterInfo: {
      id: "EMP-1234",
      name: "김철수",
      email: "kimcs@company.com",
      phone: "010-1234-5678"
    },
    approvalDate: "2025-01-20"
  },
  {
    id: "PR-2025-0002",
    title: "2025년 상반기 사무용품 구매",
    department: "총무팀",
    requestDate: "2025-02-01",
    status: "APPROVED",
    expectedBudget: 25000000,
    itemList: [
      { id: "ITEM-004", name: "A4 용지", quantity: 500, unitPrice: 5000 },
      { id: "ITEM-005", name: "프린터 토너", quantity: 100, unitPrice: 80000 },
      { id: "ITEM-006", name: "파일링 캐비닛", quantity: 20, unitPrice: 250000 }
    ],
    requesterInfo: {
      id: "EMP-2345",
      name: "박영희",
      email: "parkyh@company.com",
      phone: "010-2345-6789"
    },
    approvalDate: "2025-02-05"
  },
  {
    id: "PR-2025-0003",
    title: "2025년 개발팀 노트북 장비 교체",
    department: "R&D팀",
    requestDate: "2025-02-20",
    status: "APPROVED",
    expectedBudget: 120000000,
    itemList: [
      {
        id: "ITEM-007",
        name: "개발용 노트북",
        quantity: 40,
        unitPrice: 2500000
      },
      { id: "ITEM-008", name: "외장 모니터", quantity: 40, unitPrice: 500000 },
      { id: "ITEM-009", name: "도킹 스테이션", quantity: 40, unitPrice: 200000 }
    ],
    requesterInfo: {
      id: "EMP-3456",
      name: "이지훈",
      email: "leejh@company.com",
      phone: "010-3456-7890"
    },
    approvalDate: "2025-02-25"
  },
  {
    id: "PR-2025-0004",
    title: "본사 사옥 냉난방 시스템 교체",
    department: "시설관리팀",
    requestDate: "2025-03-01",
    status: "APPROVED",
    expectedBudget: 350000000,
    itemList: [
      {
        id: "ITEM-010",
        name: "중앙 냉난방 시스템",
        quantity: 1,
        unitPrice: 200000000
      },
      { id: "ITEM-011", name: "실외기", quantity: 5, unitPrice: 20000000 },
      { id: "ITEM-012", name: "온도조절장치", quantity: 50, unitPrice: 500000 }
    ],
    requesterInfo: {
      id: "EMP-4567",
      name: "최미란",
      email: "choim@company.com",
      phone: "010-4567-8901"
    },
    approvalDate: "2025-03-10"
  },
  {
    id: "PR-2025-0005",
    title: "신규 데이터센터 구축 장비",
    department: "IT인프라팀",
    requestDate: "2025-03-15",
    status: "APPROVED",
    expectedBudget: 500000000,
    itemList: [
      {
        id: "ITEM-013",
        name: "고성능 서버",
        quantity: 20,
        unitPrice: 15000000
      },
      {
        id: "ITEM-014",
        name: "스토리지 시스템",
        quantity: 5,
        unitPrice: 30000000
      },
      { id: "ITEM-015", name: "백업 시스템", quantity: 2, unitPrice: 25000000 }
    ],
    requesterInfo: {
      id: "EMP-5678",
      name: "정준호",
      email: "jungjh@company.com",
      phone: "010-5678-9012"
    },
    approvalDate: "2025-03-20"
  }
];

// 입찰 공고 더미데이터
export const biddingsData = [
  {
    id: "1",
    bidNumber: "BID-2025-0001",
    title: "2025년 1분기 서버 장비 구매 입찰",
    description: "본사 IT인프라 확대를 위한 서버 장비 구매 입찰 공고입니다.",
    conditions: "납품 후 30일 이내 결제, 1년 무상 유지보수 필수",
    startDate: "2025-01-25",
    endDate: "2025-02-15",
    bidOpeningDate: "2025-02-16",
    purchaseRequestId: "PR-2025-0001",
    status: { childCode: BiddingStatus.ONGOING, name: "진행중" },
    bidMethod: BiddingMethod.OPEN_PRICE,
    quantity: 23,
    unitPrice: 0,
    supplyPrice: 150000000,
    vat: 15000000,
    totalAmount: 165000000,
    filePath: "서버_장비_구매_사양서.pdf",
    internalNote: "예상 단가보다 낮은 가격으로 입찰 받기 위해 노력할 것",
    createdAt: "2025-01-25T09:30:00",
    participations: [
      {
        id: "PART-001",
        supplierId: "SUP-1001",
        companyName: "테크솔루션 주식회사",
        unitPrice: 6800000,
        quantity: 23,
        totalAmount: 156400000,
        note: "무상 유지보수 2년 제공",
        submittedAt: "2025-01-28T14:20:00",
        isEvaluated: true,
        evaluationScore: 92,
        isSelectedBidder: true
      },
      {
        id: "PART-002",
        supplierId: "SUP-1003",
        companyName: "디지털시스템즈",
        unitPrice: 7200000,
        quantity: 23,
        totalAmount: 165600000,
        note: "추가 서비스 포함",
        submittedAt: "2025-01-29T10:15:00",
        isEvaluated: true,
        evaluationScore: 88,
        isSelectedBidder: false
      },
      {
        id: "PART-003",
        supplierId: "SUP-1005",
        companyName: "데이터코어",
        unitPrice: 6950000,
        quantity: 23,
        totalAmount: 159850000,
        note: "특별 기술 지원 포함",
        submittedAt: "2025-01-30T16:45:00",
        isEvaluated: true,
        evaluationScore: 85,
        isSelectedBidder: false
      }
    ],
    invitedSuppliers: ["SUP-1001", "SUP-1003", "SUP-1005"],
    attachments: [
      {
        id: "ATT-001",
        name: "서버 장비 구매 사양서.pdf",
        url: "/uploads/specs.pdf"
      },
      {
        id: "ATT-002",
        name: "입찰 참가 신청서.docx",
        url: "/uploads/application.docx"
      }
    ],
    statusHistories: [
      {
        id: "HIST-001",
        fromStatus: { childCode: BiddingStatus.PENDING, name: "대기중" },
        toStatus: { childCode: BiddingStatus.ONGOING, name: "진행중" },
        reason: "승인 완료",
        changedBy: { id: "EMP-1234", username: "김철수" },
        changedAt: "2025-01-25T09:30:00"
      }
    ]
  },
  {
    id: "2",
    bidNumber: "BID-2025-0002",
    title: "2025년 상반기 사무용품 구매 입찰",
    description: "사무용품 및 사무 기기 구매를 위한 입찰 공고입니다.",
    conditions: "10일 이내 납품 필수, 최소 주문 수량 조건 있음",
    startDate: "2025-02-05",
    endDate: "2025-02-20",
    bidOpeningDate: "2025-02-21",
    purchaseRequestId: "PR-2025-0002",
    status: { childCode: BiddingStatus.PENDING, name: "대기중" },
    bidMethod: BiddingMethod.FIXED_PRICE,
    quantity: 500,
    unitPrice: 50000,
    supplyPrice: 25000000,
    vat: 2500000,
    totalAmount: 27500000,
    filePath: "사무용품_구매_목록.xlsx",
    internalNote: "분기별 구매로 변경 검토 중",
    createdAt: "2025-02-05T11:15:00",
    participations: [],
    invitedSuppliers: ["SUP-1002", "SUP-1008"],
    attachments: [
      {
        id: "ATT-003",
        name: "사무용품 구매 목록.xlsx",
        url: "/uploads/office_supplies.xlsx"
      },
      {
        id: "ATT-004",
        name: "입찰 참가 신청서.docx",
        url: "/uploads/application.docx"
      }
    ],
    statusHistories: [
      {
        id: "HIST-002",
        fromStatus: { childCode: null, name: "생성" },
        toStatus: { childCode: BiddingStatus.PENDING, name: "대기중" },
        reason: "신규 생성",
        changedBy: { id: "EMP-2345", username: "박영희" },
        changedAt: "2025-02-05T11:15:00"
      }
    ]
  },
  {
    id: "3",
    bidNumber: "BID-2025-0003",
    title: "2025년 개발팀 노트북 장비 교체 입찰",
    description: "개발팀 노트북 교체를 위한 입찰 공고입니다.",
    conditions: "최소 사양 충족 필수, 동일 기종으로 납품",
    startDate: "2025-02-25",
    endDate: "2025-03-15",
    bidOpeningDate: "2025-03-16",
    purchaseRequestId: "PR-2025-0003",
    status: { childCode: BiddingStatus.ONGOING, name: "진행중" },
    bidMethod: BiddingMethod.OPEN_PRICE,
    quantity: 40,
    unitPrice: 0,
    supplyPrice: 120000000,
    vat: 12000000,
    totalAmount: 132000000,
    filePath: "노트북_구매_사양서.pdf",
    internalNote: "기술 검토 위원회 구성 필요",
    createdAt: "2025-02-25T13:45:00",
    participations: [
      {
        id: "PART-004",
        supplierId: "SUP-1001",
        companyName: "테크솔루션 주식회사",
        unitPrice: 2450000,
        quantity: 40,
        totalAmount: 98000000,
        note: "특별 할인가 적용",
        submittedAt: "2025-02-26T10:30:00",
        isEvaluated: false,
        evaluationScore: 0,
        isSelectedBidder: false
      },
      {
        id: "PART-005",
        supplierId: "SUP-1006",
        companyName: "퓨처테크놀로지",
        unitPrice: 2580000,
        quantity: 40,
        totalAmount: 103200000,
        note: "기술 지원 포함",
        submittedAt: "2025-02-27T15:20:00",
        isEvaluated: false,
        evaluationScore: 0,
        isSelectedBidder: false
      }
    ],
    invitedSuppliers: ["SUP-1001", "SUP-1003", "SUP-1006", "SUP-1007"],
    attachments: [
      {
        id: "ATT-005",
        name: "노트북 구매 사양서.pdf",
        url: "/uploads/laptop_specs.pdf"
      },
      {
        id: "ATT-006",
        name: "입찰 참가 신청서.docx",
        url: "/uploads/application.docx"
      }
    ],
    statusHistories: [
      {
        id: "HIST-003",
        fromStatus: { childCode: null, name: "생성" },
        toStatus: { childCode: BiddingStatus.PENDING, name: "대기중" },
        reason: "신규 생성",
        changedBy: { id: "EMP-3456", username: "이지훈" },
        changedAt: "2025-02-25T13:45:00"
      },
      {
        id: "HIST-004",
        fromStatus: { childCode: BiddingStatus.PENDING, name: "대기중" },
        toStatus: { childCode: BiddingStatus.ONGOING, name: "진행중" },
        reason: "승인 완료",
        changedBy: { id: "EMP-3456", username: "이지훈" },
        changedAt: "2025-02-25T14:30:00"
      }
    ]
  },
  {
    id: "4",
    bidNumber: "BID-2025-0004",
    title: "본사 사옥 냉난방 시스템 교체 입찰",
    description: "본사 냉난방 시스템 교체를 위한 입찰 공고입니다.",
    conditions: "설치 및 기존 시스템 철거 포함, 공사 일정 협의 필수",
    startDate: "2025-03-10",
    endDate: "2025-04-10",
    bidOpeningDate: "2025-04-11",
    purchaseRequestId: "PR-2025-0004",
    status: { childCode: BiddingStatus.ONGOING, name: "진행중" },
    bidMethod: BiddingMethod.OPEN_PRICE,
    quantity: 1,
    unitPrice: 0,
    supplyPrice: 350000000,
    vat: 35000000,
    totalAmount: 385000000,
    filePath: "냉난방_시스템_사양서.pdf",
    internalNote: "설치 일정은 주말 공사 고려",
    createdAt: "2025-03-10T10:00:00",
    participations: [
      {
        id: "PART-006",
        supplierId: "SUP-1004",
        companyName: "그린빌딩시스템",
        unitPrice: 340000000,
        quantity: 1,
        totalAmount: 340000000,
        note: "에너지 효율 등급 1+ 제품 제안",
        submittedAt: "2025-03-15T11:10:00",
        isEvaluated: false,
        evaluationScore: 0,
        isSelectedBidder: false
      }
    ],
    invitedSuppliers: ["SUP-1004"],
    attachments: [
      {
        id: "ATT-007",
        name: "냉난방 시스템 사양서.pdf",
        url: "/uploads/hvac_specs.pdf"
      },
      {
        id: "ATT-008",
        name: "입찰 참가 신청서.docx",
        url: "/uploads/application.docx"
      },
      {
        id: "ATT-009",
        name: "설치 위치 도면.dwg",
        url: "/uploads/floor_plan.dwg"
      }
    ],
    statusHistories: [
      {
        id: "HIST-005",
        fromStatus: { childCode: null, name: "생성" },
        toStatus: { childCode: BiddingStatus.PENDING, name: "대기중" },
        reason: "신규 생성",
        changedBy: { id: "EMP-4567", username: "최미란" },
        changedAt: "2025-03-10T10:00:00"
      },
      {
        id: "HIST-006",
        fromStatus: { childCode: BiddingStatus.PENDING, name: "대기중" },
        toStatus: { childCode: BiddingStatus.ONGOING, name: "진행중" },
        reason: "승인 완료",
        changedBy: { id: "EMP-4567", username: "최미란" },
        changedAt: "2025-03-10T13:25:00"
      }
    ]
  },
  {
    id: "5",
    bidNumber: "BID-2025-0005",
    title: "신규 데이터센터 구축 장비 입찰",
    description: "신규 데이터센터 구축을 위한 장비 입찰 공고입니다.",
    conditions: "설치 및 초기 세팅 포함, SLA 계약 필수",
    startDate: "2025-03-20",
    endDate: "2025-04-20",
    bidOpeningDate: "2025-04-21",
    purchaseRequestId: "PR-2025-0005",
    status: { childCode: BiddingStatus.CLOSED, name: "마감" },
    bidMethod: BiddingMethod.OPEN_PRICE,
    quantity: 27,
    unitPrice: 0,
    supplyPrice: 500000000,
    vat: 50000000,
    totalAmount: 550000000,
    filePath: "데이터센터_장비_명세서.pdf",
    internalNote: "기술 검토 필수, 확장성 고려",
    createdAt: "2025-03-20T09:00:00",
    participations: [
      {
        id: "PART-007",
        supplierId: "SUP-1005",
        companyName: "데이터코어",
        unitPrice: 17500000,
        quantity: 27,
        totalAmount: 472500000,
        note: "5년 SLA 포함, 전문 엔지니어 상주 지원",
        submittedAt: "2025-03-22T14:30:00",
        isEvaluated: true,
        evaluationScore: 95,
        isSelectedBidder: true
      },
      {
        id: "PART-008",
        supplierId: "SUP-1001",
        companyName: "테크솔루션 주식회사",
        unitPrice: 18200000,
        quantity: 27,
        totalAmount: 491400000,
        note: "3년 SLA 포함, 24시간 기술 지원",
        submittedAt: "2025-03-25T10:45:00",
        isEvaluated: true,
        evaluationScore: 88,
        isSelectedBidder: false
      },
      {
        id: "PART-009",
        supplierId: "SUP-1003",
        companyName: "디지털시스템즈",
        unitPrice: 19000000,
        quantity: 27,
        totalAmount: 513000000,
        note: "추가 보안 솔루션 포함",
        submittedAt: "2025-03-26T16:15:00",
        isEvaluated: true,
        evaluationScore: 82,
        isSelectedBidder: false
      }
    ],
    invitedSuppliers: ["SUP-1001", "SUP-1003", "SUP-1005"],
    attachments: [
      {
        id: "ATT-010",
        name: "데이터센터 장비 명세서.pdf",
        url: "/uploads/datacenter_specs.pdf"
      },
      {
        id: "ATT-011",
        name: "입찰 참가 신청서.docx",
        url: "/uploads/application.docx"
      },
      {
        id: "ATT-012",
        name: "데이터센터 구성도.vsdx",
        url: "/uploads/datacenter_diagram.vsdx"
      }
    ],
    statusHistories: [
      {
        id: "HIST-007",
        fromStatus: { childCode: null, name: "생성" },
        toStatus: { childCode: BiddingStatus.PENDING, name: "대기중" },
        reason: "신규 생성",
        changedBy: { id: "EMP-5678", username: "정준호" },
        changedAt: "2025-03-20T09:00:00"
      },
      {
        id: "HIST-008",
        fromStatus: { childCode: BiddingStatus.PENDING, name: "대기중" },
        toStatus: { childCode: BiddingStatus.ONGOING, name: "진행중" },
        reason: "승인 완료",
        changedBy: { id: "EMP-5678", username: "정준호" },
        changedAt: "2025-03-20T10:15:00"
      },
      {
        id: "HIST-009",
        fromStatus: { childCode: BiddingStatus.ONGOING, name: "진행중" },
        toStatus: { childCode: BiddingStatus.CLOSED, name: "마감" },
        reason: "입찰 마감 및 공급사 선정 완료",
        changedBy: { id: "EMP-5678", username: "정준호" },
        changedAt: "2025-04-25T14:30:00"
      }
    ]
  },
  {
    id: "6",
    bidNumber: "BID-2025-0006",
    title: "보안 시스템 업그레이드 입찰",
    description: "전사 보안 시스템 업그레이드를 위한 입찰 공고입니다.",
    conditions: "기존 시스템과의 호환성 검증 필수, 단계적 구축 계획 제출",
    startDate: "2025-03-25",
    endDate: "2025-04-15",
    bidOpeningDate: "2025-04-16",
    purchaseRequestId: "PR-2025-0006",
    status: { childCode: BiddingStatus.CANCELED, name: "취소" },
    bidMethod: BiddingMethod.FIXED_PRICE,
    quantity: 1,
    unitPrice: 180000000,
    supplyPrice: 180000000,
    vat: 18000000,
    totalAmount: 198000000,
    filePath: "보안시스템_업그레이드_요구사항.pdf",
    internalNote: "예산 조정 필요, 차년도 재검토 계획",
    createdAt: "2025-03-25T11:30:00",
    participations: [],
    invitedSuppliers: ["SUP-1003", "SUP-1007"],
    attachments: [
      {
        id: "ATT-013",
        name: "보안시스템 업그레이드 요구사항.pdf",
        url: "/uploads/security_requirements.pdf"
      },
      {
        id: "ATT-014",
        name: "입찰 참가 신청서.docx",
        url: "/uploads/application.docx"
      }
    ],
    statusHistories: [
      {
        id: "HIST-010",
        fromStatus: { childCode: null, name: "생성" },
        toStatus: { childCode: BiddingStatus.PENDING, name: "대기중" },
        reason: "신규 생성",
        changedBy: { id: "EMP-1234", username: "김철수" },
        changedAt: "2025-03-25T11:30:00"
      },
      {
        id: "HIST-011",
        fromStatus: { childCode: BiddingStatus.PENDING, name: "대기중" },
        toStatus: { childCode: BiddingStatus.ONGOING, name: "진행중" },
        reason: "승인 완료",
        changedBy: { id: "EMP-1234", username: "김철수" },
        changedAt: "2025-03-25T13:45:00"
      },
      {
        id: "HIST-012",
        fromStatus: { childCode: BiddingStatus.ONGOING, name: "진행중" },
        toStatus: { childCode: BiddingStatus.CANCELED, name: "취소" },
        reason: "예산 문제로 인한 취소, 차년도 재검토 예정",
        changedBy: { id: "EMP-1234", username: "김철수" },
        changedAt: "2025-03-28T09:15:00"
      }
    ]
  }
];

// 입찰 응답 더미데이터
export const bidResponsesData = [
  {
    id: "RESP-001",
    supplierId: "SUP-1001",
    biddingId: "BID-2025-0001",
    proposedAmount: 156400000,
    deliveryDate: "2025-03-01",
    technicalProposal: "서버 장비 기술 제안서.pdf",
    itemDetails: [
      { itemId: "ITEM-001", unitPrice: 7800000, totalPrice: 39000000 },
      { itemId: "ITEM-002", unitPrice: 6900000, totalPrice: 69000000 },
      { itemId: "ITEM-003", unitPrice: 2900000, totalPrice: 23200000 }
    ],
    additionalServices: "무상 유지보수 2년, 24시간 기술 지원",
    submissionDate: "2025-01-28T14:20:00",
    status: "SUBMITTED"
  },
  {
    id: "RESP-002",
    supplierId: "SUP-1003",
    biddingId: "BID-2025-0001",
    proposedAmount: 165600000,
    deliveryDate: "2025-02-25",
    technicalProposal: "디지털시스템즈_제안서.pdf",
    itemDetails: [
      { itemId: "ITEM-001", unitPrice: 8200000, totalPrice: 41000000 },
      { itemId: "ITEM-002", unitPrice: 7100000, totalPrice: 71000000 },
      { itemId: "ITEM-003", unitPrice: 3100000, totalPrice: 24800000 }
    ],
    additionalServices: "성능 튜닝 서비스 포함, 설치 컨설팅 무료",
    submissionDate: "2025-01-29T10:15:00",
    status: "SUBMITTED"
  },
  {
    id: "RESP-003",
    supplierId: "SUP-1005",
    biddingId: "BID-2025-0001",
    proposedAmount: 159850000,
    deliveryDate: "2025-02-28",
    technicalProposal: "데이터코어_서버장비_제안.pdf",
    itemDetails: [
      { itemId: "ITEM-001", unitPrice: 7900000, totalPrice: 39500000 },
      { itemId: "ITEM-002", unitPrice: 6950000, totalPrice: 69500000 },
      { itemId: "ITEM-003", unitPrice: 3050000, totalPrice: 24400000 }
    ],
    additionalServices: "클라우드 마이그레이션 지원, 장애 대응 SLA 계약",
    submissionDate: "2025-01-16",
    status: "SUBMITTED"
  },
  {
    id: "RESP-004",
    supplierId: "SUP-1001",
    biddingId: "BID-2025-0003",
    proposedAmount: 98000000,
    deliveryDate: "2025-03-25",
    technicalProposal: "노트북_제안서_테크솔루션.pdf",
    itemDetails: [
      { itemId: "ITEM-007", unitPrice: 2450000, totalPrice: 98000000 }
    ],
    additionalServices: "3년 제조사 보증, 도킹 스테이션 할인",
    submissionDate: "2025-02-26T10:30:00",
    status: "SUBMITTED"
  },
  {
    id: "RESP-005",
    supplierId: "SUP-1006",
    biddingId: "BID-2025-0003",
    proposedAmount: 103200000,
    deliveryDate: "2025-03-20",
    technicalProposal: "퓨처테크_개발용노트북_제안.pdf",
    itemDetails: [
      { itemId: "ITEM-007", unitPrice: 2580000, totalPrice: 103200000 }
    ],
    additionalServices: "개발환경 셋업 지원, 전용 기술 지원 인력 배정",
    submissionDate: "2025-02-27T15:20:00",
    status: "SUBMITTED"
  },
  {
    id: "RESP-006",
    supplierId: "SUP-1004",
    biddingId: "BID-2025-0004",
    proposedAmount: 340000000,
    deliveryDate: "2025-05-15",
    technicalProposal: "냉난방시스템_그린빌딩_제안.pdf",
    itemDetails: [
      { itemId: "ITEM-010", unitPrice: 190000000, totalPrice: 190000000 },
      { itemId: "ITEM-011", unitPrice: 18000000, totalPrice: 90000000 },
      { itemId: "ITEM-012", unitPrice: 450000, totalPrice: 22500000 }
    ],
    additionalServices: "5년 무상 점검, 에너지 효율 모니터링 시스템 제공",
    submissionDate: "2025-03-15T11:10:00",
    status: "SUBMITTED"
  },
  {
    id: "RESP-007",
    supplierId: "SUP-1005",
    biddingId: "BID-2025-0005",
    proposedAmount: 472500000,
    deliveryDate: "2025-05-20",
    technicalProposal: "데이터코어_데이터센터_솔루션.pdf",
    itemDetails: [
      { itemId: "ITEM-013", unitPrice: 14500000, totalPrice: 290000000 },
      { itemId: "ITEM-014", unitPrice: 28500000, totalPrice: 142500000 },
      { itemId: "ITEM-015", unitPrice: 20000000, totalPrice: 40000000 }
    ],
    additionalServices: "전문 엔지니어 상주 지원, 5년 SLA, 분기별 성능 최적화",
    submissionDate: "2025-03-22T14:30:00",
    status: "SUBMITTED"
  },
  {
    id: "RESP-008",
    supplierId: "SUP-1001",
    biddingId: "BID-2025-0005",
    proposedAmount: 491400000,
    deliveryDate: "2025-05-25",
    technicalProposal: "테크솔루션_데이터센터_제안.pdf",
    itemDetails: [
      { itemId: "ITEM-013", unitPrice: 15000000, totalPrice: 300000000 },
      { itemId: "ITEM-014", unitPrice: 29200000, totalPrice: 146000000 },
      { itemId: "ITEM-015", unitPrice: 22700000, totalPrice: 45400000 }
    ],
    additionalServices: "24시간 기술 지원, 3년 SLA 계약",
    submissionDate: "2025-03-25T10:45:00",
    status: "SUBMITTED"
  },
  {
    id: "RESP-009",
    supplierId: "SUP-1003",
    biddingId: "BID-2025-0005",
    proposedAmount: 513000000,
    deliveryDate: "2025-05-15",
    technicalProposal: "디지털시스템즈_데이터센터_보안강화.pdf",
    itemDetails: [
      { itemId: "ITEM-013", unitPrice: 15800000, totalPrice: 316000000 },
      { itemId: "ITEM-014", unitPrice: 31000000, totalPrice: 155000000 },
      { itemId: "ITEM-015", unitPrice: 21000000, totalPrice: 42000000 }
    ],
    additionalServices: "추가 보안 솔루션 포함, 연 2회 보안 감사",
    submissionDate: "2025-03-26T16:15:00",
    status: "SUBMITTED"
  }
];

// 사용자 더미데이터
export const usersData = [
  {
    id: "USER-001",
    username: "admin",
    email: "admin@company.com",
    name: "시스템 관리자",
    role: UserRole.ADMIN,
    department: "IT팀",
    phone: "02-1234-5678",
    lastLogin: "2025-03-15T08:30:00"
  },
  {
    id: "USER-002",
    username: "kimcs",
    email: "kimcs@company.com",
    name: "김철수",
    role: UserRole.BUYER,
    department: "구매팀",
    phone: "010-1234-5678",
    lastLogin: "2025-03-15T09:15:00"
  },
  {
    id: "USER-003",
    username: "parkyh",
    email: "parkyh@company.com",
    name: "박영희",
    role: UserRole.MANAGER,
    department: "경영지원팀",
    phone: "010-2345-6789",
    lastLogin: "2025-03-14T14:20:00"
  },
  {
    id: "USER-004",
    username: "leejh",
    email: "leejh@company.com",
    name: "이지훈",
    role: UserRole.BUYER,
    department: "구매팀",
    phone: "010-3456-7890",
    lastLogin: "2025-03-16T10:30:00"
  },
  {
    id: "USER-005",
    username: "techsolutions",
    email: "sales@techsolutions.co.kr",
    name: "강현우",
    role: UserRole.SUPPLIER,
    department: "영업부",
    phone: "010-9876-5432",
    lastLogin: "2025-03-15T11:45:00",
    supplierId: "SUP-1001"
  },
  {
    id: "USER-006",
    username: "digitaladmin",
    email: "info@digitalsystems.co.kr",
    name: "김민석",
    role: UserRole.SUPPLIER,
    department: "영업부",
    phone: "010-8765-4321",
    lastLogin: "2025-03-16T09:20:00",
    supplierId: "SUP-1003"
  },
  {
    id: "USER-007",
    username: "datacoreuser",
    email: "contact@datacore.co.kr",
    name: "홍지수",
    role: UserRole.SUPPLIER,
    department: "영업부",
    phone: "010-7654-3210",
    lastLogin: "2025-03-15T16:30:00",
    supplierId: "SUP-1005"
  }
];

// 공급사 더미데이터
export const suppliersData = [
  {
    id: "SUP-1001",
    name: "테크솔루션 주식회사",
    businessNumber: "123-45-67890",
    address: "서울특별시 강남구 테헤란로 123",
    contactPerson: "강현우",
    email: "sales@techsolutions.co.kr",
    phone: "02-1234-5678",
    categories: ["IT장비", "컴퓨터", "네트워크"],
    rating: 4.8,
    contractHistory: [
      { year: 2023, amount: 450000000, projectCount: 8 },
      { year: 2024, amount: 520000000, projectCount: 10 }
    ],
    status: "ACTIVE"
  },
  {
    id: "SUP-1002",
    name: "오피스웨어 코리아",
    businessNumber: "234-56-78901",
    address: "서울특별시 영등포구 여의대로 456",
    contactPerson: "박지영",
    email: "service@officeware.co.kr",
    phone: "02-2345-6789",
    categories: ["사무용품", "가구", "문구"],
    rating: 4.5,
    contractHistory: [
      { year: 2023, amount: 120000000, projectCount: 15 },
      { year: 2024, amount: 150000000, projectCount: 18 }
    ],
    status: "ACTIVE"
  },
  {
    id: "SUP-1003",
    name: "디지털시스템즈",
    businessNumber: "345-67-89012",
    address: "경기도 성남시 분당구 판교로 789",
    contactPerson: "김민석",
    email: "info@digitalsystems.co.kr",
    phone: "031-3456-7890",
    categories: ["IT장비", "소프트웨어", "보안장비"],
    rating: 4.7,
    contractHistory: [
      { year: 2023, amount: 380000000, projectCount: 7 },
      { year: 2024, amount: 420000000, projectCount: 9 }
    ],
    status: "ACTIVE"
  },
  {
    id: "SUP-1004",
    name: "그린빌딩시스템",
    businessNumber: "456-78-90123",
    address: "서울특별시 마포구 월드컵로 357",
    contactPerson: "이성진",
    email: "sales@greenbuilding.co.kr",
    phone: "02-4567-8901",
    categories: ["냉난방설비", "건축자재", "시설장비"],
    rating: 4.4,
    contractHistory: [
      { year: 2023, amount: 670000000, projectCount: 4 },
      { year: 2024, amount: 720000000, projectCount: 5 }
    ],
    status: "ACTIVE"
  },
  {
    id: "SUP-1005",
    name: "데이터코어",
    businessNumber: "567-89-01234",
    address: "서울특별시 금천구 가산디지털로 123",
    contactPerson: "홍지수",
    email: "contact@datacore.co.kr",
    phone: "02-5678-9012",
    categories: ["서버", "스토리지", "네트워크"],
    rating: 4.9,
    contractHistory: [
      { year: 2023, amount: 890000000, projectCount: 6 },
      { year: 2024, amount: 950000000, projectCount: 7 }
    ],
    status: "ACTIVE"
  },
  {
    id: "SUP-1006",
    name: "퓨처테크놀로지",
    businessNumber: "678-90-12345",
    address: "대전광역시 유성구 대학로 234",
    contactPerson: "송민지",
    email: "info@futuretech.co.kr",
    phone: "042-6789-0123",
    categories: ["IT장비", "연구장비", "미디어장비"],
    rating: 4.6,
    contractHistory: [
      { year: 2023, amount: 320000000, projectCount: 5 },
      { year: 2024, amount: 380000000, projectCount: 6 }
    ],
    status: "ACTIVE"
  },
  {
    id: "SUP-1007",
    name: "글로벌인포메이션",
    businessNumber: "789-01-23456",
    address: "서울특별시 서초구 서초대로 789",
    contactPerson: "황준혁",
    email: "sales@globalinfo.co.kr",
    phone: "02-7890-1234",
    categories: ["소프트웨어", "IT컨설팅", "클라우드서비스"],
    rating: 4.7,
    contractHistory: [
      { year: 2023, amount: 420000000, projectCount: 12 },
      { year: 2024, amount: 480000000, projectCount: 14 }
    ],
    status: "ACTIVE"
  },
  {
    id: "SUP-1008",
    name: "스마트오피스솔루션",
    businessNumber: "890-12-34567",
    address: "경기도 수원시 영통구 삼성로 456",
    contactPerson: "임하영",
    email: "contact@smartoffice.co.kr",
    phone: "031-8901-2345",
    categories: ["사무용가구", "IT장비", "사무용품"],
    rating: 4.5,
    contractHistory: [
      { year: 2023, amount: 250000000, projectCount: 9 },
      { year: 2024, amount: 290000000, projectCount: 11 }
    ],
    status: "ACTIVE"
  }
];

// 상태 변경 이력 더미데이터
export const statusHistoriesData = [
  {
    id: "HIST-001",
    biddingId: "BID-2025-0001",
    fromStatus: { childCode: BiddingStatus.PENDING, name: "대기중" },
    toStatus: { childCode: BiddingStatus.ONGOING, name: "진행중" },
    reason: "승인 완료",
    changedBy: { id: "USER-002", username: "김철수" },
    changedAt: "2025-01-25T09:30:00"
  },
  {
    id: "HIST-002",
    biddingId: "BID-2025-0002",
    fromStatus: { childCode: null, name: "생성" },
    toStatus: { childCode: BiddingStatus.PENDING, name: "대기중" },
    reason: "신규 생성",
    changedBy: { id: "USER-004", username: "이지훈" },
    changedAt: "2025-02-05T11:15:00"
  },
  {
    id: "HIST-003",
    biddingId: "BID-2025-0003",
    fromStatus: { childCode: null, name: "생성" },
    toStatus: { childCode: BiddingStatus.PENDING, name: "대기중" },
    reason: "신규 생성",
    changedBy: { id: "USER-004", username: "이지훈" },
    changedAt: "2025-02-25T13:45:00"
  },
  {
    id: "HIST-004",
    biddingId: "BID-2025-0003",
    fromStatus: { childCode: BiddingStatus.PENDING, name: "대기중" },
    toStatus: { childCode: BiddingStatus.ONGOING, name: "진행중" },
    reason: "승인 완료",
    changedBy: { id: "USER-003", username: "박영희" },
    changedAt: "2025-02-25T14:30:00"
  },
  {
    id: "HIST-005",
    biddingId: "BID-2025-0004",
    fromStatus: { childCode: null, name: "생성" },
    toStatus: { childCode: BiddingStatus.PENDING, name: "대기중" },
    reason: "신규 생성",
    changedBy: { id: "USER-002", username: "김철수" },
    changedAt: "2025-03-10T10:00:00"
  },
  {
    id: "HIST-006",
    biddingId: "BID-2025-0004",
    fromStatus: { childCode: BiddingStatus.PENDING, name: "대기중" },
    toStatus: { childCode: BiddingStatus.ONGOING, name: "진행중" },
    reason: "승인 완료",
    changedBy: { id: "USER-003", username: "박영희" },
    changedAt: "2025-03-10T13:25:00"
  },
  {
    id: "HIST-007",
    biddingId: "BID-2025-0005",
    fromStatus: { childCode: null, name: "생성" },
    toStatus: { childCode: BiddingStatus.PENDING, name: "대기중" },
    reason: "신규 생성",
    changedBy: { id: "USER-004", username: "이지훈" },
    changedAt: "2025-03-20T09:00:00"
  },
  {
    id: "HIST-008",
    biddingId: "BID-2025-0005",
    fromStatus: { childCode: BiddingStatus.PENDING, name: "대기중" },
    toStatus: { childCode: BiddingStatus.ONGOING, name: "진행중" },
    reason: "승인 완료",
    changedBy: { id: "USER-003", username: "박영희" },
    changedAt: "2025-03-20T10:15:00"
  },
  {
    id: "HIST-009",
    biddingId: "BID-2025-0005",
    fromStatus: { childCode: BiddingStatus.ONGOING, name: "진행중" },
    toStatus: { childCode: BiddingStatus.CLOSED, name: "마감" },
    reason: "입찰 마감 및 공급사 선정 완료",
    changedBy: { id: "USER-004", username: "이지훈" },
    changedAt: "2025-04-25T14:30:00"
  },
  {
    id: "HIST-010",
    biddingId: "BID-2025-0006",
    fromStatus: { childCode: null, name: "생성" },
    toStatus: { childCode: BiddingStatus.PENDING, name: "대기중" },
    reason: "신규 생성",
    changedBy: { id: "USER-002", username: "김철수" },
    changedAt: "2025-03-25T11:30:00"
  },
  {
    id: "HIST-011",
    biddingId: "BID-2025-0006",
    fromStatus: { childCode: BiddingStatus.PENDING, name: "대기중" },
    toStatus: { childCode: BiddingStatus.ONGOING, name: "진행중" },
    reason: "승인 완료",
    changedBy: { id: "USER-003", username: "박영희" },
    changedAt: "2025-03-25T13:45:00"
  },
  {
    id: "HIST-012",
    biddingId: "BID-2025-0006",
    fromStatus: { childCode: BiddingStatus.ONGOING, name: "진행중" },
    toStatus: { childCode: BiddingStatus.CANCELED, name: "취소" },
    reason: "예산 문제로 인한 취소, 차년도 재검토 예정",
    changedBy: { id: "USER-002", username: "김철수" },
    changedAt: "2025-03-28T09:15:00"
  }
];

// 평가 데이터
export const evaluationsData = [
  {
    id: "EVAL-001",
    biddingParticipationId: "PART-001",
    supplierId: "SUP-1001",
    biddingId: "BID-2025-0001",
    evaluator: {
      id: "USER-002",
      name: "김철수"
    },
    criteria: [
      { name: "가격 경쟁력", weight: 30, score: 28 },
      { name: "기술 적합성", weight: 30, score: 27 },
      { name: "납기 일정", weight: 20, score: 19 },
      { name: "추가 서비스", weight: 20, score: 18 }
    ],
    totalScore: 92,
    comments: "가격 및 기술 모두 우수, 추가 서비스 조건 만족",
    createdAt: "2025-02-17T10:30:00"
  },
  {
    id: "EVAL-002",
    biddingParticipationId: "PART-002",
    supplierId: "SUP-1003",
    biddingId: "BID-2025-0001",
    evaluator: {
      id: "USER-002",
      name: "김철수"
    },
    criteria: [
      { name: "가격 경쟁력", weight: 30, score: 25 },
      { name: "기술 적합성", weight: 30, score: 28 },
      { name: "납기 일정", weight: 20, score: 17 },
      { name: "추가 서비스", weight: 20, score: 18 }
    ],
    totalScore: 88,
    comments: "기술력은 우수하나 가격이 다소 높음",
    createdAt: "2025-02-17T11:15:00"
  },
  {
    id: "EVAL-003",
    biddingParticipationId: "PART-003",
    supplierId: "SUP-1005",
    biddingId: "BID-2025-0001",
    evaluator: {
      id: "USER-002",
      name: "김철수"
    },
    criteria: [
      { name: "가격 경쟁력", weight: 30, score: 26 },
      { name: "기술 적합성", weight: 30, score: 25 },
      { name: "납기 일정", weight: 20, score: 17 },
      { name: "추가 서비스", weight: 20, score: 17 }
    ],
    totalScore: 85,
    comments: "전반적으로 양호하나 특별한 장점 없음",
    createdAt: "2025-02-17T11:45:00"
  },
  {
    id: "EVAL-004",
    biddingParticipationId: "PART-007",
    supplierId: "SUP-1005",
    biddingId: "BID-2025-0005",
    evaluator: {
      id: "USER-004",
      name: "이지훈"
    },
    criteria: [
      { name: "가격 경쟁력", weight: 25, score: 23 },
      { name: "기술 적합성", weight: 30, score: 29 },
      { name: "납기 일정", weight: 15, score: 14 },
      { name: "추가 서비스", weight: 15, score: 14 },
      { name: "기술 지원", weight: 15, score: 15 }
    ],
    totalScore: 95,
    comments: "모든 면에서 우수, 특히 기술 지원 및 SLA 조건이 탁월",
    createdAt: "2025-04-23T13:30:00"
  },
  {
    id: "EVAL-005",
    biddingParticipationId: "PART-008",
    supplierId: "SUP-1001",
    biddingId: "BID-2025-0005",
    evaluator: {
      id: "USER-004",
      name: "이지훈"
    },
    criteria: [
      { name: "가격 경쟁력", weight: 25, score: 22 },
      { name: "기술 적합성", weight: 30, score: 26 },
      { name: "납기 일정", weight: 15, score: 13 },
      { name: "추가 서비스", weight: 15, score: 13 },
      { name: "기술 지원", weight: 15, score: 14 }
    ],
    totalScore: 88,
    comments: "SLA 기간이 짧고 기술 지원 내용이 다소 부족",
    createdAt: "2025-04-23T14:00:00"
  },
  {
    id: "EVAL-006",
    biddingParticipationId: "PART-009",
    supplierId: "SUP-1003",
    biddingId: "BID-2025-0005",
    evaluator: {
      id: "USER-004",
      name: "이지훈"
    },
    criteria: [
      { name: "가격 경쟁력", weight: 25, score: 20 },
      { name: "기술 적합성", weight: 30, score: 25 },
      { name: "납기 일정", weight: 15, score: 12 },
      { name: "추가 서비스", weight: 15, score: 12 },
      { name: "기술 지원", weight: 15, score: 13 }
    ],
    totalScore: 82,
    comments: "가격이 높고 납기 일정이 길어 비효율적",
    createdAt: "2025-04-23T14:30:00"
  }
];

// 알림 더미데이터
export const notificationsData = [
  {
    id: "NOTI-001",
    userId: "USER-002",
    title: "신규 입찰 참여 알림",
    message:
      "테크솔루션 주식회사가 '2025년 1분기 서버 장비 구매 입찰'에 참여했습니다.",
    isRead: true,
    createdAt: "2025-01-28T14:20:00",
    referenceId: "BID-2025-0001",
    entityType: "BIDDING"
  },
  {
    id: "NOTI-002",
    userId: "USER-002",
    title: "신규 입찰 참여 알림",
    message:
      "디지털시스템즈가 '2025년 1분기 서버 장비 구매 입찰'에 참여했습니다.",
    isRead: true,
    createdAt: "2025-01-29T10:15:00",
    referenceId: "BID-2025-0001",
    entityType: "BIDDING"
  },
  {
    id: "NOTI-003",
    userId: "USER-002",
    title: "신규 입찰 참여 알림",
    message: "데이터코어가 '2025년 1분기 서버 장비 구매 입찰'에 참여했습니다.",
    isRead: false,
    createdAt: "2025-01-30T16:45:00",
    referenceId: "BID-2025-0001",
    entityType: "BIDDING"
  },
  {
    id: "NOTI-004",
    userId: "USER-005",
    title: "낙찰 알림",
    message:
      "귀사가 '2025년 1분기 서버 장비 구매 입찰'에 낙찰되었습니다. 세부 사항은 곧 연락드리겠습니다.",
    isRead: true,
    createdAt: "2025-02-17T15:30:00",
    referenceId: "BID-2025-0001",
    entityType: "BIDDING"
  },
  {
    id: "NOTI-005",
    userId: "USER-004",
    title: "신규 입찰 참여 알림",
    message:
      "테크솔루션 주식회사가 '2025년 개발팀 노트북 장비 교체 입찰'에 참여했습니다.",
    isRead: true,
    createdAt: "2025-02-26T10:30:00",
    referenceId: "BID-2025-0003",
    entityType: "BIDDING"
  },
  {
    id: "NOTI-006",
    userId: "USER-004",
    title: "신규 입찰 참여 알림",
    message:
      "퓨처테크놀로지가 '2025년 개발팀 노트북 장비 교체 입찰'에 참여했습니다.",
    isRead: false,
    createdAt: "2025-02-27T15:20:00",
    referenceId: "BID-2025-0003",
    entityType: "BIDDING"
  }
];

// 주요 도우미 함수
export const getStatusText = (status) => {
  if (!status) return "알 수 없음";

  switch (status.childCode) {
    case BiddingStatus.PENDING:
      return "대기중";
    case BiddingStatus.ONGOING:
      return "진행중";
    case BiddingStatus.CLOSED:
      return "마감";
    case BiddingStatus.CANCELED:
      return "취소";
    default:
      return status.name || "알 수 없음";
  }
};

export const getBidMethodText = (method) => {
  switch (method) {
    case BiddingMethod.FIXED_PRICE:
      return "정가제안";
    case BiddingMethod.OPEN_PRICE:
      return "가격제안";
    default:
      return "알 수 없음";
  }
};

// 모킹 API 함수 - 입찰 공고 목록 조회
export const mockFetchBiddings = (params = {}) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 필터링 로직 구현
      let filteredData = [...biddingsData];

      // 검색어 필터링
      if (params?.keyword) {
        const keyword = params.keyword.toLowerCase();
        filteredData = filteredData.filter(
          (item) =>
            (item.title && item.title.toLowerCase().includes(keyword)) ||
            (item.bidNumber && item.bidNumber.toLowerCase().includes(keyword))
        );
      }

      // 상태 필터링
      if (params?.statusCode) {
        filteredData = filteredData.filter(
          (item) => item.status.childCode === params.statusCode
        );
      }

      // 날짜 필터링
      if (params?.startDate) {
        const startDate = new Date(params.startDate);
        filteredData = filteredData.filter(
          (item) => new Date(item.startDate) >= startDate
        );
      }

      if (params?.endDate) {
        const endDate = new Date(params.endDate);
        filteredData = filteredData.filter(
          (item) => new Date(item.endDate) <= endDate
        );
      }

      // 페이지네이션
      const page = params?.page || 0;
      const size = params?.size || 10;
      const start = page * size;
      const paginatedData = filteredData.slice(start, start + size);

      resolve({
        content: paginatedData,
        totalElements: filteredData.length,
        totalPages: Math.ceil(filteredData.length / size),
        size: size,
        number: page
      });
    }, 500);
  });
};

// 특정 ID의 입찰 공고 정보 조회 함수
export const mockFetchBiddingDetail = (id) => {
  return new Promise((resolve, reject) => {
    // 실제 ID와 무관하게 첫 번째 데이터 반환
    const bidding = biddingsData[0];

    if (bidding) {
      resolve(bidding);
    } else {
      reject(new Error("해당 ID의 입찰 공고를 찾을 수 없습니다."));
    }
  });
};

// 구매요청 목록 가져오기
export const mockFetchPurchaseRequests = (params = {}) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 필터링 로직 구현
      let filteredData = [...purchaseRequestsData];

      // 검색어 필터링
      if (params?.keyword) {
        const keyword = params.keyword.toLowerCase();
        filteredData = filteredData.filter(
          (item) =>
            (item.title && item.title.toLowerCase().includes(keyword)) ||
            (item.id && item.id.toLowerCase().includes(keyword))
        );
      }

      // 부서 필터링
      if (params?.department) {
        filteredData = filteredData.filter(
          (item) => item.department === params.department
        );
      }

      // 상태 필터링
      if (params?.status) {
        filteredData = filteredData.filter(
          (item) => item.status === params.status
        );
      }

      // 페이지네이션
      const page = params?.page || 0;
      const size = params?.size || 10;
      const start = page * size;
      const paginatedData = filteredData.slice(start, start + size);

      resolve({
        content: paginatedData,
        totalElements: filteredData.length,
        totalPages: Math.ceil(filteredData.length / size),
        size: size,
        number: page
      });
    }, 500);
  });
};

// 공급사 목록 가져오기
export const mockFetchSuppliers = (params = {}) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 필터링 로직 구현
      let filteredData = [...suppliersData];

      // 검색어 필터링
      if (params?.keyword) {
        const keyword = params.keyword.toLowerCase();
        filteredData = filteredData.filter(
          (item) =>
            (item.name && item.name.toLowerCase().includes(keyword)) ||
            (item.id && item.id.toLowerCase().includes(keyword)) ||
            (item.businessNumber && item.businessNumber.includes(keyword))
        );
      }

      // 카테고리 필터링
      if (params?.category) {
        filteredData = filteredData.filter((item) =>
          item.categories.includes(params.category)
        );
      }

      // 상태 필터링
      if (params?.status) {
        filteredData = filteredData.filter(
          (item) => item.status === params.status
        );
      }

      // 페이지네이션
      const page = params?.page || 0;
      const size = params?.size || 10;
      const start = page * size;
      const paginatedData = filteredData.slice(start, start + size);

      resolve({
        content: paginatedData,
        totalElements: filteredData.length,
        totalPages: Math.ceil(filteredData.length / size),
        size: size,
        number: page
      });
    }, 500);
  });
};

export default {
  purchaseRequestsData,
  suppliersData,
  biddingsData,
  bidResponsesData,
  usersData,
  statusHistoriesData,
  evaluationsData,
  notificationsData,
  BiddingStatus,
  BiddingMethod,
  UserRole,
  getStatusText,
  getBidMethodText,
  mockFetchBiddings,
  mockFetchBiddingDetail,
  mockFetchPurchaseRequests,
  mockFetchSuppliers
};
