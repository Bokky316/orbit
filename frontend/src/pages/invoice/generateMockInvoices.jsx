// 송장 상태 타입
const STATUS_TYPES = {
  WAITING: '대기',
  PAID: '지불완료',
  OVERDUE: '연체'
};

// 공급업체 목데이터
const suppliers = [
  {
    id: 'SUP001',
    name: '(주)한국전자',
    contactPerson: '김민수',
    email: 'mskim@koreaelectronics.co.kr',
    phone: '02-1234-5678',
    address: '서울시 강남구 테헤란로 123'
  },
  {
    id: 'SUP002',
    name: '대한물류(주)',
    contactPerson: '박지성',
    email: 'jspark@daehanlogistics.com',
    phone: '031-456-7890',
    address: '경기도 성남시 분당구 판교로 789'
  },
  {
    id: 'SUP003',
    name: '신성산업',
    contactPerson: '이영희',
    email: 'yhlee@shinsung.co.kr',
    phone: '02-2345-6789',
    address: '서울시 서초구 서초대로 456'
  },
  {
    id: 'SUP004',
    name: '글로벌소프트',
    contactPerson: '최재원',
    email: 'jwchoi@globalsoft.kr',
    phone: '02-5678-9012',
    address: '서울시 영등포구 여의대로 567'
  },
  {
    id: 'SUP005',
    name: '동방물산',
    contactPerson: '정수민',
    email: 'smjung@dongbang.co.kr',
    phone: '051-345-6789',
    address: '부산시 해운대구 해운대로 234'
  },
  {
    id: 'SUP006',
    name: '하이테크놀러지',
    contactPerson: '윤태호',
    email: 'thyoon@hitech.co.kr',
    phone: '042-567-8901',
    address: '대전시 유성구 대학로 567'
  },
  {
    id: 'SUP007',
    name: '미래정밀',
    contactPerson: '송미라',
    email: 'mrsong@miraeprecision.com',
    phone: '053-678-9012',
    address: '대구시 동구 동대구로 789'
  },
  {
    id: 'SUP008',
    name: '우주기획',
    contactPerson: '한승우',
    email: 'swhan@woojoo.com',
    phone: '062-789-0123',
    address: '광주시 북구 첨단과기로 123'
  }
];

// 계약 목데이터
const contracts = [
  {
    id: 'CT-2025-001',
    transactionNumber: 'TR-2025-001',
    supplierId: 'SUP001',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    items: [
      {
        itemName: 'A급 반도체 칩',
        quantity: 100,
        unitPrice: 5000,
        supplyAmount: 500000,
        vatAmount: 50000,
        totalAmount: 550000
      }
    ]
  },
  {
    id: 'CT-2025-002',
    transactionNumber: 'TR-2025-002',
    supplierId: 'SUP002',
    startDate: '2025-02-01',
    endDate: '2025-08-31',
    items: [
      {
        itemName: '물류 서비스 A패키지',
        quantity: 200,
        unitPrice: 5000,
        supplyAmount: 1000000,
        vatAmount: 100000,
        totalAmount: 1100000
      }
    ]
  },
  {
    id: 'CT-2025-003',
    transactionNumber: 'TR-2025-003',
    supplierId: 'SUP003',
    startDate: '2025-01-15',
    endDate: '2025-07-14',
    items: [
      {
        itemName: '산업용 부품 세트',
        quantity: 80,
        unitPrice: 10000,
        supplyAmount: 800000,
        vatAmount: 80000,
        totalAmount: 880000
      }
    ]
  },
  {
    id: 'CT-2025-004',
    transactionNumber: 'TR-2025-004',
    supplierId: 'SUP004',
    startDate: '2025-03-01',
    endDate: '2026-02-28',
    items: [
      {
        itemName: '소프트웨어 라이센스',
        quantity: 60,
        unitPrice: 20000,
        supplyAmount: 1200000,
        vatAmount: 120000,
        totalAmount: 1320000
      }
    ]
  },
  {
    id: 'CT-2025-005',
    transactionNumber: 'TR-2025-005',
    supplierId: 'SUP005',
    startDate: '2025-02-15',
    endDate: '2025-05-14',
    items: [
      {
        itemName: '사무용품 세트',
        quantity: 40,
        unitPrice: 15000,
        supplyAmount: 600000,
        vatAmount: 60000,
        totalAmount: 660000
      }
    ]
  },
  {
    id: 'CT-2025-006',
    transactionNumber: 'TR-2025-006',
    supplierId: 'SUP006',
    startDate: '2025-01-10',
    endDate: '2025-12-09',
    items: [
      {
        itemName: '연구장비 A',
        quantity: 2,
        unitPrice: 1500000,
        supplyAmount: 3000000,
        vatAmount: 300000,
        totalAmount: 3300000
      }
    ]
  },
  {
    id: 'CT-2025-007',
    transactionNumber: 'TR-2025-007',
    supplierId: 'SUP007',
    startDate: '2025-02-20',
    endDate: '2025-08-19',
    items: [
      {
        itemName: '정밀기계 부품',
        quantity: 50,
        unitPrice: 30000,
        supplyAmount: 1500000,
        vatAmount: 150000,
        totalAmount: 1650000
      }
    ]
  },
  {
    id: 'CT-2025-008',
    transactionNumber: 'TR-2025-008',
    supplierId: 'SUP008',
    startDate: '2025-03-05',
    endDate: '2025-09-04',
    items: [
      {
        itemName: '마케팅 서비스',
        quantity: 1,
        unitPrice: 2200000,
        supplyAmount: 2200000,
        vatAmount: 220000,
        totalAmount: 2420000
      }
    ]
  },
  {
    id: 'CT-2025-009',
    transactionNumber: 'TR-2025-009',
    supplierId: 'SUP001',
    startDate: '2025-03-15',
    endDate: '2025-12-14',
    items: [
      {
        itemName: 'B급 반도체 칩',
        quantity: 150,
        unitPrice: 4000,
        supplyAmount: 600000,
        vatAmount: 60000,
        totalAmount: 660000
      }
    ]
  },
  {
    id: 'CT-2025-010',
    transactionNumber: 'TR-2025-010',
    supplierId: 'SUP003',
    startDate: '2025-03-10',
    endDate: '2025-06-09',
    items: [
      {
        itemName: '중형 산업용 부품',
        quantity: 30,
        unitPrice: 25000,
        supplyAmount: 750000,
        vatAmount: 75000,
        totalAmount: 825000
      }
    ]
  },
  {
    id: 'CT-2025-011',
    transactionNumber: 'TR-2025-011',
    supplierId: 'SUP002',
    startDate: '2025-04-01',
    endDate: '2025-09-30',
    items: [
      {
        itemName: '물류 서비스 B패키지',
        quantity: 1,
        unitPrice: 3500000,
        supplyAmount: 3500000,
        vatAmount: 350000,
        totalAmount: 3850000
      }
    ]
  },
  {
    id: 'CT-2025-012',
    transactionNumber: 'TR-2025-012',
    supplierId: 'SUP004',
    startDate: '2025-03-20',
    endDate: '2026-03-19',
    items: [
      {
        itemName: '기업용 솔루션',
        quantity: 1,
        unitPrice: 4800000,
        supplyAmount: 4800000,
        vatAmount: 480000,
        totalAmount: 5280000
      }
    ]
  },
  {
    id: 'CT-2025-013',
    transactionNumber: 'TR-2025-013',
    supplierId: 'SUP006',
    startDate: '2025-04-10',
    endDate: '2025-10-09',
    items: [
      {
        itemName: '연구장비 B',
        quantity: 1,
        unitPrice: 4000000,
        supplyAmount: 4000000,
        vatAmount: 400000,
        totalAmount: 4400000
      }
    ]
  },
  {
    id: 'CT-2025-014',
    transactionNumber: 'TR-2025-014',
    supplierId: 'SUP007',
    startDate: '2025-04-05',
    endDate: '2025-10-04',
    items: [
      {
        itemName: '대형 정밀기계',
        quantity: 1,
        unitPrice: 8500000,
        supplyAmount: 8500000,
        vatAmount: 850000,
        totalAmount: 9350000
      }
    ]
  },
  {
    id: 'CT-2025-015',
    transactionNumber: 'TR-2025-015',
    supplierId: 'SUP005',
    startDate: '2025-03-15',
    endDate: '2025-09-14',
    items: [
      {
        itemName: '사무가구 세트',
        quantity: 10,
        unitPrice: 180000,
        supplyAmount: 1800000,
        vatAmount: 180000,
        totalAmount: 1980000
      }
    ]
  }
];

// 송장 모의 데이터 생성 함수
const generateMockInvoices = (count = 30) => {
  const invoices = [];
  const today = new Date();
  
  for (let i = 1; i <= count; i++) {
    // 계약 선택
    const contractIndex = Math.floor(Math.random() * contracts.length);
    const contract = contracts[contractIndex];
    
    // 공급업체 조회
    const supplier = suppliers.find(s => s.id === contract.supplierId);
    
    // 발행일 랜덤 생성 (최근 3개월 내)
    const issueDate = new Date(today);
    issueDate.setDate(today.getDate() - Math.floor(Math.random() * 90));
    
    // 마감일은 발행일로부터 30일 후
    const dueDate = new Date(issueDate);
    dueDate.setDate(issueDate.getDate() + 30);
    
    // 상태 결정
    let status, paymentDate = null, overdueDays = 0;
    
    if (dueDate < today) {
      // 마감일이 지났을 경우
      const isPaid = Math.random() > 0.3; // 70% 확률로 지불 완료
      
      if (isPaid) {
        status = STATUS_TYPES.PAID;
        paymentDate = new Date(dueDate);
        paymentDate.setDate(dueDate.getDate() - Math.floor(Math.random() * 10)); // 마감일 이전에 결제
      } else {
        status = STATUS_TYPES.OVERDUE;
        overdueDays = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      }
    } else {
      // 마감일이 아직 안 지났을 경우
      const isPaid = Math.random() > 0.7; // 30% 확률로 미리 지불 완료
      
      if (isPaid) {
        status = STATUS_TYPES.PAID;
        paymentDate = new Date(issueDate);
        paymentDate.setDate(issueDate.getDate() + Math.floor(Math.random() * 15)); // 발행일로부터 15일 이내 결제
      } else {
        status = STATUS_TYPES.WAITING;
      }
    }
    
    // 송장 번호 생성
    const invoiceNumber = `INV-${issueDate.getFullYear()}-${String(issueDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(3, '0')}`;
    
    invoices.push({
      id: `INV-${i}`,
      invoiceNumber,
      contractId: contract.id,
      transactionNumber: contract.transactionNumber,
      supplier: {
        id: supplier.id,
        name: supplier.name,
        contactPerson: supplier.contactPerson,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address
      },
      items: contract.items,
      issueDate: issueDate.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      supplyAmount: contract.items.reduce((sum, item) => sum + item.supplyAmount, 0),
      vatAmount: contract.items.reduce((sum, item) => sum + item.vatAmount, 0),
      totalAmount: contract.items.reduce((sum, item) => sum + item.totalAmount, 0),
      status,
      paymentDate: paymentDate ? paymentDate.toISOString().split('T')[0] : null,
      overdueDays,
      notes: '',
      createdAt: issueDate.toISOString(),
      updatedAt: issueDate.toISOString()
    });
  }
  
  return invoices;
};

// 30개의 모의 송장 데이터 생성
const mockInvoices = generateMockInvoices(30);

export { 
  suppliers, 
  contracts, 
  mockInvoices, 
  STATUS_TYPES 
};