// package com.orbit.config.datainitializer;

// import com.orbit.entity.commonCode.ChildCode;
// import com.orbit.entity.commonCode.ParentCode;
// import com.orbit.entity.commonCode.SystemStatus;
// import com.orbit.entity.member.Member;
// import com.orbit.entity.supplier.SupplierAttachment;
// import com.orbit.entity.supplier.SupplierRegistration;
// import com.orbit.repository.commonCode.ChildCodeRepository;
// import com.orbit.repository.commonCode.ParentCodeRepository;
// import com.orbit.repository.member.MemberRepository;
// import com.orbit.repository.supplier.SupplierAttachmentRepository;
// import com.orbit.repository.supplier.SupplierRegistrationRepository;
// import lombok.RequiredArgsConstructor;
// import lombok.extern.slf4j.Slf4j;
// import org.springframework.boot.context.event.ApplicationReadyEvent;
// import org.springframework.context.event.EventListener;
// import org.springframework.core.annotation.Order;
// import org.springframework.stereotype.Component;
// import org.springframework.transaction.annotation.Transactional;

// import java.time.LocalDate;
// import java.time.LocalDateTime;
// import java.util.*;
// import java.util.stream.Collectors;

// @Slf4j
// @Component
// @RequiredArgsConstructor
// @Order(4) // SupplierDataInitializer 이후 실행되도록 순서 지정
// public class SupplierRegistrationInitializer {

//     private final SupplierRegistrationRepository supplierRegistrationRepository;
//     private final SupplierAttachmentRepository supplierAttachmentRepository;
//     private final MemberRepository memberRepository;
//     private final ParentCodeRepository parentCodeRepository;
//     private final ChildCodeRepository childCodeRepository;

//     private static final Random random = new Random();

//     // 상태 상수 정의
//     private static final String STATUS_ENTITY_TYPE = "SUPPLIER";
//     private static final String STATUS_PENDING = "PENDING";
//     private static final String STATUS_APPROVED = "APPROVED";
//     private static final String STATUS_REJECTED = "REJECTED";

//     // 비즈니스 범주
//     private static final String[] BUSINESS_TYPES = {"제조업", "도소매업", "서비스업", "유통업", "정보통신업"};
//     private static final Map<String, String[]> BUSINESS_CATEGORIES = Map.of(
//             "제조업", new String[]{"컴퓨터 및 주변기기 제조", "사무용 기기 제조", "가구 제조", "문구용품 제조"},
//             "도소매업", new String[]{"컴퓨터 및 주변기기 도매", "사무용품 도매", "가구 도매", "문구용품 도매"},
//             "서비스업", new String[]{"컴퓨터 및 주변기기 수리", "사무기기 대여", "사무실 인테리어", "IT 컨설팅"},
//             "유통업", new String[]{"컴퓨터 및 주변기기 유통", "사무용품 유통", "소모품 유통", "무역업"},
//             "정보통신업", new String[]{"소프트웨어 개발", "네트워크 장비", "통신장비 유통", "SI 서비스"}
//     );

//     // 소싱 카테고리
//     private static final String[] SOURCING_CATEGORIES = {"사무기기", "문구류", "가구", "IT장비", "소모품"};
//     private static final Map<String, String[]> SOURCING_SUB_CATEGORIES = Map.of(
//             "사무기기", new String[]{"프린터", "복합기", "스캐너", "정보기기"},
//             "문구류", new String[]{"필기구", "노트/수첩", "사무용품", "데스크용품"},
//             "가구", new String[]{"의자", "책상", "수납가구", "사무가구"},
//             "IT장비", new String[]{"컴퓨터", "모니터", "네트워크장비", "주변기기"},
//             "소모품", new String[]{"프린터소모품", "사무용지", "데스크소모품", "사무소모품"}
//     );
//     private static final Map<String, String[]> SOURCING_DETAIL_CATEGORIES = Map.of(
//             "프린터", new String[]{"레이저프린터", "잉크젯프린터", "포토프린터", "라벨프린터"},
//             "복합기", new String[]{"레이저복합기", "잉크젯복합기", "흑백복합기", "컬러복합기"},
//             "필기구", new String[]{"볼펜", "연필", "마커", "형광펜"},
//             "의자", new String[]{"사무용의자", "메쉬의자", "회의용의자", "접이식의자"},
//             "책상", new String[]{"사무용책상", "회의용테이블", "스탠딩책상", "컴퓨터책상"},
//             "컴퓨터", new String[]{"데스크탑", "노트북", "태블릿", "서버"},
//             "프린터소모품", new String[]{"토너", "잉크", "드럼", "카트리지"}
//     );

//     @EventListener(ApplicationReadyEvent.class)
//     @Transactional
//     public void initializeData() {
//         log.info("Starting supplier registration data initialization process...");
//         log.info("Current database state:");
//         log.info("SupplierRegistration count: {}", supplierRegistrationRepository.count());
//         log.info("Member count: {}", memberRepository.count());

//         // 이미 등록 정보가 있는 경우 중단
//         if (supplierRegistrationRepository.count() > 0) {
//             log.info("Supplier registrations already exist. Skipping initialization.");
//             return;
//         }

//         // SUPPLIER 역할을 가진 회원 조회 (없으면 일부 BUYER 역할 회원 활용)
//         List<Member> suppliers = memberRepository.findByRole(Member.Role.SUPPLIER);
//         if (suppliers.isEmpty()) {
//             log.info("No members with SUPPLIER role found. Using some BUYER role members instead.");
//             suppliers = memberRepository.findByRole(Member.Role.BUYER).stream()
//                     .limit(10) // 10명만 선택
//                     .collect(Collectors.toList());
//         }

//         if (suppliers.isEmpty()) {
//             log.error("No suitable members found for supplier registrations. Initialization aborted.");
//             return;
//         }

//         try {
//             // 등록 상태 조회
//             List<SupplierRegistration> supplierRegistrations = new ArrayList<>();
            
//             // 각 공급자에 대해 등록 정보 생성
//             for (Member supplier : suppliers) {
//                 // 대기, 승인, 거절 상태를 랜덤하게 분배
//                 String status = getRandomStatus();
                
//                 SupplierRegistration registration = createSupplierRegistration(supplier, status);
//                 supplierRegistrations.add(registration);
//             }
            
//             // 등록 정보 저장
//             supplierRegistrations = supplierRegistrationRepository.saveAll(supplierRegistrations);
//             log.info("Created {} supplier registrations", supplierRegistrations.size());
            
//             // 첨부 파일 생성 및 저장
//             List<SupplierAttachment> attachments = new ArrayList<>();
//             for (SupplierRegistration registration : supplierRegistrations) {
//                 SupplierAttachment attachment = createSupplierAttachment(registration);
//                 attachments.add(attachment);
//             }
            
//             supplierAttachmentRepository.saveAll(attachments);
//             log.info("Created {} supplier attachments", attachments.size());
            
//             // 로그 출력
//             for (SupplierRegistration registration : supplierRegistrations) {
//                 log.info("Created SupplierRegistration - BusinessNo: {}, CEO: {}, Status: {}, Company: {}",
//                         registration.getBusinessNo(),
//                         registration.getCeoName(),
//                         registration.getStatus().getChildCode(),
//                         registration.getSupplier().getCompanyName());
//             }
            
//         } catch (Exception e) {
//             log.error("Error during supplier registration initialization", e);
//             throw new RuntimeException("Supplier registration initialization failed", e);
//         }
//     }

//     private SupplierRegistration createSupplierRegistration(Member supplier, String status) {
//         // 랜덤 데이터 생성
//         String businessType = BUSINESS_TYPES[random.nextInt(BUSINESS_TYPES.length)];
//         String businessCategory = BUSINESS_CATEGORIES.get(businessType)[random.nextInt(BUSINESS_CATEGORIES.get(businessType).length)];
        
//         String sourcingCategory = SOURCING_CATEGORIES[random.nextInt(SOURCING_CATEGORIES.length)];
//         String sourcingSubCategory = SOURCING_SUB_CATEGORIES.get(sourcingCategory)[random.nextInt(SOURCING_SUB_CATEGORIES.get(sourcingCategory).length)];
        
//         String sourcingDetailCategory = "";
//         if (SOURCING_DETAIL_CATEGORIES.containsKey(sourcingSubCategory)) {
//             sourcingDetailCategory = SOURCING_DETAIL_CATEGORIES.get(sourcingSubCategory)[random.nextInt(SOURCING_DETAIL_CATEGORIES.get(sourcingSubCategory).length)];
//         }

//         SupplierRegistration registration = new SupplierRegistration();
//         registration.setSupplier(supplier);
//         registration.setRegistrationDate(LocalDate.now().minusDays(random.nextInt(30)));
//         registration.setStatus(new SystemStatus(STATUS_ENTITY_TYPE, status));
//         registration.setBusinessNo(generateBusinessNo());
//         registration.setCeoName(generateCeoName());
//         registration.setBusinessType(businessType);
//         registration.setBusinessCategory(businessCategory);
//         registration.setSourcingCategory(sourcingCategory);
//         registration.setSourcingSubCategory(sourcingSubCategory);
//         registration.setSourcingDetailCategory(sourcingDetailCategory);
//         registration.setPhoneNumber(generatePhoneNumber());
//         registration.setPostalCode(generatePostalCode());
//         registration.setRoadAddress(generateAddress());
//         registration.setDetailAddress(generateDetailAddress());
//         registration.setComments("자동 생성된 공급업체 등록 정보입니다.");
        
//         // 상태가 REJECTED인 경우 반려 사유 추가
//         if (STATUS_REJECTED.equals(status)) {
//             registration.setRejectionReason(generateRejectionReason());
//         }
        
//         // 담당자 정보
//         registration.setContactPerson(generateContactPerson());
//         registration.setContactPhone(generateMobileNumber());
//         registration.setContactEmail(generateEmail(supplier.getCompanyName()));
        
//         return registration;
//     }

//     private SupplierAttachment createSupplierAttachment(SupplierRegistration registration) {
//         SupplierAttachment attachment = new SupplierAttachment();
//         attachment.setSupplierRegistration(registration);
//         attachment.setFileName("사업자등록증_" + registration.getBusinessNo() + ".pdf");
//         attachment.setOriginalFileName("사업자등록증.pdf");
//         attachment.setFilePath("/uploads/suppliers/" + UUID.randomUUID() + ".pdf");
//         attachment.setFileSize(random.nextInt(1000000) + 500000L); // 500KB ~ 1.5MB
//         attachment.setFileType("application/pdf");
//         attachment.setCreatedAt(LocalDateTime.now());
//         return attachment;
//     }

//     private String getRandomStatus() {
//         // 60% 승인, 30% 대기, 10% 거부 비율로 설정
//         int rand = random.nextInt(100);
//         if (rand < 60) {
//             return STATUS_APPROVED;
//         } else if (rand < 90) {
//             return STATUS_PENDING;
//         } else {
//             return STATUS_REJECTED;
//         }
//     }

//     // 랜덤 데이터 생성 헬퍼 메소드들
//     private String generateBusinessNo() {
//         return String.format("%03d-%02d-%05d",
//                 100 + random.nextInt(900),
//                 10 + random.nextInt(90),
//                 10000 + random.nextInt(90000)
//         );
//     }
    
//     private String generateCeoName() {
//         String[] lastNames = {"김", "이", "박", "최", "정", "강", "조", "윤", "장", "임"};
//         String[] firstNames = {"준호", "민수", "지훈", "성민", "영호", "정수", "현우", "승현", "도윤", "지원"};
        
//         return lastNames[random.nextInt(lastNames.length)] + 
//                firstNames[random.nextInt(firstNames.length)];
//     }
    
//     private String generatePhoneNumber() {
//         String[] prefixes = {"02", "031", "032", "033", "041", "042", "043", "044", "051", "052", "053", "054", "055", "061", "062", "063", "064"};
//         String prefix = prefixes[random.nextInt(prefixes.length)];
        
//         if (prefix.equals("02")) {
//             return String.format("%s-%04d-%04d", prefix, 1000 + random.nextInt(9000), 1000 + random.nextInt(9000));
//         } else {
//             return String.format("%s-%03d-%04d", prefix, 100 + random.nextInt(900), 1000 + random.nextInt(9000));
//         }
//     }
    
//     private String generateMobileNumber() {
//         String[] prefixes = {"010", "011", "016", "017", "018", "019"};
//         String prefix = prefixes[0]; // 요즘은 대부분 010
        
//         return String.format("%s-%04d-%04d", prefix, 1000 + random.nextInt(9000), 1000 + random.nextInt(9000));
//     }
    
//     private String generatePostalCode() {
//         return String.format("%05d", 10000 + random.nextInt(90000));
//     }
    
//     private String generateAddress() {
//         String[] cities = {"서울특별시", "부산광역시", "인천광역시", "대구광역시", "대전광역시", "광주광역시", "울산광역시", "경기도 수원시", "경기도 고양시", "경기도 용인시"};
//         String[] districts = {"중구", "서구", "동구", "남구", "북구", "강남구", "강서구", "영통구", "일산동구", "분당구", "수지구"};
//         String[] roadNames = {"중앙로", "번영로", "산업로", "혁신로", "테헤란로", "강남대로", "판교로", "디지털로", "경인로", "과천대로"};
        
//         return String.format("%s %s %s %d길 %d", 
//                 cities[random.nextInt(cities.length)],
//                 districts[random.nextInt(districts.length)],
//                 roadNames[random.nextInt(roadNames.length)],
//                 1 + random.nextInt(50),
//                 1 + random.nextInt(100));
//     }
    
//     private String generateDetailAddress() {
//         String[] buildingTypes = {"빌딩", "오피스텔", "타워", "센터", "플라자", "스퀘어"};
//         String[] buildingNames = {"대한", "서울", "미래", "성공", "행복", "해피", "스마일", "글로벌", "퍼스트", "이노"};
        
//         return String.format("%s%s %d층 %d호", 
//                 buildingNames[random.nextInt(buildingNames.length)],
//                 buildingTypes[random.nextInt(buildingTypes.length)],
//                 2 + random.nextInt(20),
//                 1 + random.nextInt(10));
//     }
    
//     private String generateContactPerson() {
//         String[] lastNames = {"김", "이", "박", "최", "정", "강", "조", "윤", "장", "임"};
//         String[] firstNames = {"영희", "철수", "민지", "준영", "소희", "민수", "지현", "서연", "준호", "민서"};
        
//         return lastNames[random.nextInt(lastNames.length)] + 
//                firstNames[random.nextInt(firstNames.length)];
//     }
    
//     private String generateEmail(String companyName) {
//         String[] domains = {"gmail.com", "naver.com", "daum.net", "kakao.com", "hotmail.com"};
        
//         // 공급사 이름에서 영문 부분 추출하거나 한글을 영문 초성으로 변환
//         String namePart = convertToEmailPrefix(companyName);
//         String randomPart = String.format("%03d", random.nextInt(1000));
        
//         return namePart + randomPart + "@" + domains[random.nextInt(domains.length)];
//     }
    
//     private String convertToEmailPrefix(String name) {
//         // 영문자와 숫자만 포함하는 간단한 변환
//         String simplified = name.replaceAll("[^a-zA-Z0-9]", "");
        
//         if (simplified.isEmpty()) {
//             // 영문이 없는 경우 임의의 문자열 반환
//             return "company" + (100 + random.nextInt(900));
//         }
        
//         return simplified.toLowerCase().substring(0, Math.min(simplified.length(), 8));
//     }
    
//     private String generateRejectionReason() {
//         String[] reasons = {
//             "제출하신 사업자등록증 사본의 인장이 불분명합니다. 명확한 사본을 다시 제출해주세요.",
//             "소싱 카테고리와 업종 정보가 일치하지 않습니다. 정확한 정보로 수정 후 재신청해주세요.",
//             "담당자 연락처 정보가 부정확합니다. 확인 후 재신청해주세요.",
//             "회사 정보와 제출 서류의 내용이 일치하지 않습니다. 확인 후 재신청해주세요.",
//             "사업자등록증의 등록 주소와 입력하신 주소가 일치하지 않습니다. 확인 후 재신청해주세요."
//         };
        
//         return reasons[random.nextInt(reasons.length)];
//     }
// }