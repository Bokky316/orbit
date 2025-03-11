//package com.orbit.config;
//
//import com.orbit.entity.code.CommonCode;
//import com.orbit.entity.code.CommonCodeGroup;
//import com.orbit.entity.item.Category;
//import com.orbit.entity.item.Item;
//import com.orbit.repository.CommonCodeGroupRepository;
//import com.orbit.repository.CommonCodeRepository;
//import com.orbit.repository.CategoryRepository;
//import com.orbit.repository.ItemRepository;
//import lombok.RequiredArgsConstructor;
//import org.springframework.boot.CommandLineRunner;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.context.annotation.Profile;
//
//import java.math.BigDecimal;
//import java.time.LocalDateTime;
//import java.util.HashMap;
//import java.util.Map;
//
//@Configuration
//@RequiredArgsConstructor
//public class DataInitializer {
//
//    private final CommonCodeGroupRepository codeGroupRepository;
//    private final CommonCodeRepository codeRepository;
//    private final CategoryRepository categoryRepository;
//    private final ItemRepository itemRepository;
//
//    @Bean
//    @Profile({"local", "dev"})  // 로컬 및 개발 환경에서만 데이터 초기화
//    public CommandLineRunner initDatabase() {
//        return args -> {
//            // 이미 초기화되었는지 확인
//            if (codeGroupRepository.count() > 0) {
//                return;
//            }
//
//            // =========== 공통코드 그룹 초기화 ===========
//            Map<String, CommonCodeGroup> codeGroups = new HashMap<>();
//
//            // 공통코드 그룹 생성
//            String[] groupData = {
//                    "GRP001,구매요청상태,구매요청의 진행 상태를 관리하는 코드",
//                    "GRP002,프로젝트상태,프로젝트의 진행 상태를 관리하는 코드",
//                    "GRP003,입찰상태,입찰의 진행 상태를 관리하는 코드",
//                    "GRP004,계약상태,계약의 진행 상태를 관리하는 코드",
//                    "GRP005,발주상태,발주의 진행 상태를 관리하는 코드",
//                    "GRP006,검수상태,입고/검수의 진행 상태를 관리하는 코드",
//                    "GRP007,인보이스상태,인보이스의 진행 상태를 관리하는 코드",
//                    "GRP008,결제상태,대금결제의 진행 상태를 관리하는 코드",
//                    "GRP009,부서,회사 부서 정보",
//                    "GRP010,직급,직원 직급 정보",
//                    "GRP011,권한,시스템 사용자 권한",
//                    "GRP012,거래처유형,거래처 유형 정보",
//                    "GRP013,단위,품목 단위 정보",
//                    "GRP014,결제방법,대금 결제 방법",
//                    "GRP015,검수결과,물품 검수 결과"
//            };
//
//            for (String group : groupData) {
//                String[] parts = group.split(",");
//                CommonCodeGroup codeGroup = new CommonCodeGroup();
//                codeGroup.setId(parts[0]);
//                codeGroup.setName(parts[1]);
//                codeGroup.setDescription(parts[2]);
//                codeGroup.setCreatedBy("SYSTEM");
//                codeGroups.put(codeGroup.getId(), codeGroup);
//                codeGroupRepository.save(codeGroup);
//            }
//
//            // =========== 공통코드 초기화 ===========
//
//            // 구매요청상태 코드
//            String[] requestStatusData = {
//                    "REQ_STAT_01,GRP001,임시저장,DRAFT,1,작성 중인 구매요청",
//                    "REQ_STAT_02,GRP001,승인요청,REQUESTED,2,승인 대기 중인 구매요청",
//                    "REQ_STAT_03,GRP001,승인완료,APPROVED,3,승인이 완료된 구매요청",
//                    "REQ_STAT_04,GRP001,반려,REJECTED,4,반려된 구매요청",
//                    "REQ_STAT_05,GRP001,취소,CANCELED,5,취소된 구매요청",
//                    "REQ_STAT_06,GRP001,완료,COMPLETED,6,처리가 완료된 구매요청"
//            };
//
//            addCommonCodes(requestStatusData, codeGroups);
//
//            // 프로젝트상태 코드
//            String[] projectStatusData = {
//                    "PRJ_STAT_01,GRP002,계획,PLANNING,1,계획 단계의 프로젝트",
//                    "PRJ_STAT_02,GRP002,입찰중,BIDDING,2,입찰 진행 중인 프로젝트",
//                    "PRJ_STAT_03,GRP002,계약중,CONTRACTING,3,계약 진행 중인 프로젝트",
//                    "PRJ_STAT_04,GRP002,진행중,IN_PROGRESS,4,진행 중인 프로젝트",
//                    "PRJ_STAT_05,GRP002,완료,COMPLETED,5,완료된 프로젝트",
//                    "PRJ_STAT_06,GRP002,취소,CANCELED,6,취소된 프로젝트"
//            };
//
//            addCommonCodes(projectStatusData, codeGroups);
//
//            // 입찰상태 코드
//            String[] bidStatusData = {
//                    "BID_STAT_01,GRP003,준비중,PREPARING,1,준비 중인 입찰",
//                    "BID_STAT_02,GRP003,공고중,ANNOUNCED,2,공고 중인 입찰",
//                    "BID_STAT_03,GRP003,마감,CLOSED,3,접수가 마감된 입찰",
//                    "BID_STAT_04,GRP003,평가중,EVALUATING,4,평가 중인 입찰",
//                    "BID_STAT_05,GRP003,낙찰완료,AWARDED,5,낙찰이 완료된 입찰",
//                    "BID_STAT_06,GRP003,유찰,FAILED,6,유찰된 입찰",
//                    "BID_STAT_07,GRP003,취소,CANCELED,7,취소된 입찰"
//            };
//
//            addCommonCodes(bidStatusData, codeGroups);
//
//            // 계약상태 코드
//            String[] contractStatusData = {
//                    "CONT_STAT_01,GRP004,작성중,DRAFTING,1,작성 중인 계약",
//                    "CONT_STAT_02,GRP004,검토중,REVIEWING,2,검토 중인 계약",
//                    "CONT_STAT_03,GRP004,확정,CONFIRMED,3,확정된 계약",
//                    "CONT_STAT_04,GRP004,진행중,IN_PROGRESS,4,진행 중인 계약",
//                    "CONT_STAT_05,GRP004,완료,COMPLETED,5,완료된 계약",
//                    "CONT_STAT_06,GRP004,해지,TERMINATED,6,해지된 계약"
//            };
//
//            addCommonCodes(contractStatusData, codeGroups);
//
//            // 발주상태 코드
//            String[] poStatusData = {
//                    "PO_STAT_01,GRP005,작성중,DRAFTING,1,작성 중인 발주",
//                    "PO_STAT_02,GRP005,발주완료,ORDERED,2,발주가 완료된 상태",
//                    "PO_STAT_03,GRP005,배송중,SHIPPING,3,배송 중인 발주",
//                    "PO_STAT_04,GRP005,입고완료,RECEIVED,4,입고가 완료된 발주",
//                    "PO_STAT_05,GRP005,취소,CANCELED,5,취소된 발주"
//            };
//
//            addCommonCodes(poStatusData, codeGroups);
//
//            // 검수상태 코드
//            String[] grStatusData = {
//                    "GR_STAT_01,GRP006,입고대기,WAITING,1,입고 대기 중인 상태",
//                    "GR_STAT_02,GRP006,입고완료,RECEIVED,2,입고가 완료된 상태",
//                    "GR_STAT_03,GRP006,검수중,INSPECTING,3,검수 중인 상태",
//                    "GR_STAT_04,GRP006,검수완료,INSPECTED,4,검수가 완료된 상태",
//                    "GR_STAT_05,GRP006,반품,RETURNED,5,반품된 상태"
//            };
//
//            addCommonCodes(grStatusData, codeGroups);
//
//            // 인보이스상태 코드
//            String[] invoiceStatusData = {
//                    "INV_STAT_01,GRP007,작성중,DRAFTING,1,작성 중인 인보이스",
//                    "INV_STAT_02,GRP007,발행완료,ISSUED,2,발행이 완료된 인보이스",
//                    "INV_STAT_03,GRP007,승인대기,PENDING,3,승인 대기 중인 인보이스",
//                    "INV_STAT_04,GRP007,승인완료,APPROVED,4,승인이 완료된 인보이스",
//                    "INV_STAT_05,GRP007,결제완료,PAID,5,결제가 완료된 인보이스",
//                    "INV_STAT_06,GRP007,취소,CANCELED,6,취소된 인보이스"
//            };
//
//            addCommonCodes(invoiceStatusData, codeGroups);
//
//            // 결제상태 코드
//            String[] paymentStatusData = {
//                    "PAY_STAT_01,GRP008,대기중,PENDING,1,결제 대기 중인 상태",
//                    "PAY_STAT_02,GRP008,진행중,PROCESSING,2,결제 진행 중인 상태",
//                    "PAY_STAT_03,GRP008,완료,COMPLETED,3,결제가 완료된 상태",
//                    "PAY_STAT_04,GRP008,실패,FAILED,4,결제가 실패한 상태",
//                    "PAY_STAT_05,GRP008,취소,CANCELED,5,취소된 결제"
//            };
//
//            addCommonCodes(paymentStatusData, codeGroups);
//
//            // 부서 코드
//            String[] departmentData = {
//                    "DEPT_01,GRP009,경영지원팀,ADMIN,1,경영지원팀",
//                    "DEPT_02,GRP009,재무팀,FINANCE,2,재무팀",
//                    "DEPT_03,GRP009,구매팀,PURCHASE,3,구매팀",
//                    "DEPT_04,GRP009,생산팀,PRODUCTION,4,생산팀",
//                    "DEPT_05,GRP009,품질관리팀,QC,5,품질관리팀",
//                    "DEPT_06,GRP009,영업팀,SALES,6,영업팀",
//                    "DEPT_07,GRP009,연구개발팀,RND,7,연구개발팀"
//            };
//
//            addCommonCodes(departmentData, codeGroups);
//
//            // 직급 코드
//            String[] positionData = {
//                    "POS_01,GRP010,사원,STAFF,1,사원",
//                    "POS_02,GRP010,대리,ASSISTANT_MANAGER,2,대리",
//                    "POS_03,GRP010,과장,MANAGER,3,과장",
//                    "POS_04,GRP010,차장,DEPUTY_GENERAL_MANAGER,4,차장",
//                    "POS_05,GRP010,부장,GENERAL_MANAGER,5,부장",
//                    "POS_06,GRP010,이사,DIRECTOR,6,이사",
//                    "POS_07,GRP010,상무,MANAGING_DIRECTOR,7,상무",
//                    "POS_08,GRP010,전무,EXECUTIVE_DIRECTOR,8,전무",
//                    "POS_09,GRP010,사장,PRESIDENT,9,사장"
//            };
//
//            addCommonCodes(positionData, codeGroups);
//
//            // 권한 코드
//            String[] roleData = {
//                    "ROLE_01,GRP011,관리자,ADMIN,1,시스템 관리자",
//                    "ROLE_02,GRP011,구매담당자,PURCHASER,2,구매 담당자",
//                    "ROLE_03,GRP011,승인권자,APPROVER,3,결재 권한자",
//                    "ROLE_04,GRP011,일반사용자,USER,4,일반 사용자"
//            };
//
//            addCommonCodes(roleData, codeGroups);
//
//            // 거래처유형 코드
//            String[] vendorTypeData = {
//                    "VEND_TYPE_01,GRP012,제조업체,MANUFACTURER,1,제품 제조업체",
//                    "VEND_TYPE_02,GRP012,도매업체,WHOLESALER,2,도매업체",
//                    "VEND_TYPE_03,GRP012,소매업체,RETAILER,3,소매업체",
//                    "VEND_TYPE_04,GRP012,서비스제공업체,SERVICE_PROVIDER,4,서비스 제공 업체",
//                    "VEND_TYPE_05,GRP012,컨설팅업체,CONSULTANT,5,컨설팅 업체"
//            };
//
//            addCommonCodes(vendorTypeData, codeGroups);
//
//            // 단위 코드
//            String[] unitData = {
//                    "UNIT_01,GRP013,개,EA,1,개(Each)",
//                    "UNIT_02,GRP013,박스,BOX,2,박스",
//                    "UNIT_03,GRP013,세트,SET,3,세트",
//                    "UNIT_04,GRP013,킬로그램,KG,4,킬로그램",
//                    "UNIT_05,GRP013,리터,L,5,리터",
//                    "UNIT_06,GRP013,미터,M,6,미터",
//                    "UNIT_07,GRP013,평방미터,M2,7,평방미터"
//            };
//
//            addCommonCodes(unitData, codeGroups);
//
//            // 결제방법 코드
//            String[] paymentMethodData = {
//                    "PAY_METH_01,GRP014,계좌이체,BANK_TRANSFER,1,계좌이체",
//                    "PAY_METH_02,GRP014,신용카드,CREDIT_CARD,2,신용카드",
//                    "PAY_METH_03,GRP014,어음,PROMISSORY_NOTE,3,어음",
//                    "PAY_METH_04,GRP014,현금,CASH,4,현금"
//            };
//
//            addCommonCodes(paymentMethodData, codeGroups);
//
//            // 검수결과 코드
//            String[] inspectionResultData = {
//                    "INSP_RES_01,GRP015,합격,PASS,1,검수 합격",
//                    "INSP_RES_02,GRP015,조건부합격,CONDITIONAL_PASS,2,조건부 검수 합격",
//                    "INSP_RES_03,GRP015,불합격,FAIL,3,검수 불합격"
//            };
//
//            addCommonCodes(inspectionResultData, codeGroups);
//
//            // =========== 카테고리 초기화 ===========
//            Map<String, Category> categories = new HashMap<>();
//
//            String[] categoryData = {
//                    "CAT001,사무용품,사무실에서 사용하는 각종 소모품 및 비품",
//                    "CAT002,전자제품,컴퓨터, 모니터 등 전자 관련 제품",
//                    "CAT003,소프트웨어,각종 소프트웨어 및 라이센스",
//                    "CAT004,IT장비,서버, 네트워크 장비 등 IT 인프라 장비",
//                    "CAT005,가구,사무용 가구 및 집기류",
//                    "CAT006,차량,회사 차량 및 관련 용품",
//                    "CAT007,도서,업무 참고용 도서",
//                    "CAT008,비품,기타 사무 비품",
//                    "CAT009,원자재,제품 생산에 필요한 원자재",
//                    "CAT010,포장재,제품 포장을 위한 자재"
//            };
//
//            for (String category : categoryData) {
//                String[] parts = category.split(",");
//                Category cat = new Category();
//                cat.setId(parts[0]);
//                cat.setName(parts[1]);
//                cat.setDescription(parts[2]);
//                cat.setCreatedBy("SYSTEM");
//                categories.put(cat.getId(), cat);
//                categoryRepository.save(cat);
//            }
//
//            // =========== 품목 초기화 ===========
//            CommonCode unitEa = codeRepository.findById("UNIT_01").orElseThrow();
//            CommonCode unitBox = codeRepository.findById("UNIT_02").orElseThrow();
//            CommonCode unitSet = codeRepository.findById("UNIT_03").orElseThrow();
//            CommonCode unitKg = codeRepository.findById("UNIT_04").orElseThrow();
//
//            // 사무용품 품목
//            String[] officeItemsData = {
//                    "ITEM0001,CAT001,A4용지,A4_PAPER,80g A4 복사용지 500매,UNIT_02,15000,프린터 및 복사기용 표준 용지",
//                    "ITEM0002,CAT001,볼펜,BALLPEN,0.5mm 블랙 볼펜,UNIT_01,1500,문서 작성용 볼펜",
//                    "ITEM0003,CAT001,포스트잇,POSTIT,3x3인치 접착식 메모지 100매,UNIT_01,2500,접착식 메모지",
//                    "ITEM0004,CAT001,클립,CLIP,소형 클립 100개입,UNIT_02,3000,문서 고정용 클립",
//                    "ITEM0005,CAT001,스테이플러,STAPLER,일반형 스테이플러,UNIT_01,8000,문서 철함용 스테이플러"
//            };
//
//            addItems(officeItemsData, categories);
//
//            // 전자제품 품목
//            String[] electronicsData = {
//                    "ITEM0101,CAT002,모니터,MONITOR,24인치 LED 모니터,UNIT_01,250000,업무용 모니터",
//                    "ITEM0102,CAT002,키보드,KEYBOARD,기계식 키보드,UNIT_01,120000,업무용 키보드",
//                    "ITEM0103,CAT002,마우스,MOUSE,무선 광 마우스,UNIT_01,45000,업무용 마우스",
//                    "ITEM0104,CAT002,노트북,LAPTOP,15인치 비즈니스 노트북,UNIT_01,1500000,업무용 노트북",
//                    "ITEM0105,CAT002,데스크탑,DESKTOP,업무용 데스크탑 PC,UNIT_01,1200000,업무용 데스크탑"
//            };
//
//            addItems(electronicsData, categories);
//
//            // 소프트웨어 품목
//            String[] softwareData = {
//                    "ITEM0201,CAT003,오피스,OFFICE,MS Office 365 비즈니스,UNIT_01,250000,문서 작업용 소프트웨어",
//                    "ITEM0202,CAT003,윈도우,WINDOWS,Windows 11 Professional,UNIT_01,300000,운영체제",
//                    "ITEM0203,CAT003,백신,ANTIVIRUS,기업용 백신 소프트웨어,UNIT_01,50000,보안 소프트웨어",
//                    "ITEM0204,CAT003,디자인툴,DESIGN_TOOL,그래픽 디자인 소프트웨어,UNIT_01,700000,디자인 작업용 소프트웨어",
//                    "ITEM0205,CAT003,개발툴,DEV_TOOL,통합 개발 환경 소프트웨어,UNIT_01,800000,개발 작업용 소프트웨어"
//            };
//
//            addItems(softwareData, categories);
//        };
//    }
//
//    /**
//     * 공통코드 추가 메소드
//     */
//    private void addCommonCodes(String[] codeDataArray, Map<String, CommonCodeGroup> codeGroups) {
//        for (String codeData : codeDataArray) {
//            String[] parts = codeData.split(",");
//            CommonCode code = new CommonCode();
//            code.setId(parts[0]);
//            code.setGroup(codeGroups.get(parts[1]));
//            code.setName(parts[2]);
//            code.setValue(parts[3]);
//            code.setSortOrder(Integer.parseInt(parts[4]));
//            code.setDescription(parts[5]);
//            code.setCreatedBy("SYSTEM");
//            codeRepository.save(code);
//        }
//    }
//
//    /**
//     * 품목 추가 메소드
//     */
//    private void addItems(String[] itemDataArray, Map<String, Category> categories) {
//        for (String itemData : itemDataArray) {
//            String[] parts = itemData.split(",");
//            Item item = new Item();
//            item.setId(parts[0]);
//            item.setCategory(categories.get(parts[1]));
//            item.setName(parts[2]);
//            item.setCode(parts[3]);
//            item.setSpecification(parts[4]);
//            item.setUnit(codeRepository.findById(parts[5]).orElseThrow());
//            item.setStandardPrice(new BigDecimal(parts[6]));
//            item.setDescription(parts[7]);
//            item.setCreatedBy("SYSTEM");
//            itemRepository.save(item);
//        }
//    }
//}