package com.orbit.config.datainitializer;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.orbit.entity.commonCode.SystemStatus;
import com.orbit.entity.member.Member;
import com.orbit.entity.supplier.SupplierAttachment;
import com.orbit.entity.supplier.SupplierRegistration;
import com.orbit.repository.member.MemberRepository;
import com.orbit.repository.supplier.SupplierAttachmentRepository;
import com.orbit.repository.supplier.SupplierRegistrationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 공급업체 등록 정보 및 첨부 파일의 더미 데이터 생성을 위한 초기화 클래스
 * 각 비즈니스 타입별로 약 20개의 데이터를 생성합니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Order(4) // MemberDataInitializer 이후 실행되도록 순서 지정
public class SupplierRegistrationInitializer {

    private final SupplierRegistrationRepository supplierRegistrationRepository;
    private final SupplierAttachmentRepository supplierAttachmentRepository;
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder; 

    private static final Random random = new Random();

    private String generateRandomPhoneNumber() {
        return String.format("%04d-%04d",
                (int)(Math.random() * 10000),
                (int)(Math.random() * 10000)
        );
    }

    // 상태 상수 정의
    private static final String STATUS_ENTITY_TYPE = "SUPPLIER";
    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_APPROVED = "APPROVED";
    private static final String STATUS_REJECTED = "REJECTED";

    // 비즈니스 타입 정의
    private static final String[] BUSINESS_TYPES = {
            "제조업", "도소매업", "서비스업", "유통업", "정보통신업"
    };

    // 업종 카테고리
    private static final Map<String, String[]> BUSINESS_CATEGORIES = Map.of(
            "제조업", new String[]{"컴퓨터 및 주변기기 제조", "사무용 기기 제조", "가구 제조", "문구용품 제조"},
            "도소매업", new String[]{"컴퓨터 및 주변기기 도매", "사무용품 도매", "가구 도매", "문구용품 도매"},
            "서비스업", new String[]{"컴퓨터 및 주변기기 수리", "사무기기 대여", "사무실 인테리어", "IT 컨설팅"},
            "유통업", new String[]{"컴퓨터 및 주변기기 유통", "사무용품 유통", "소모품 유통", "무역업"},
            "정보통신업", new String[]{"소프트웨어 개발", "네트워크 장비", "통신장비 유통", "SI 서비스"}
    );

    // 소싱 카테고리
    private static final String[] SOURCING_CATEGORIES = {
            "사무기기", "문구류", "가구", "IT장비", "소모품"
    };

    // 소싱 하위 카테고리
    private static final Map<String, String[]> SOURCING_SUB_CATEGORIES = Map.of(
            "사무기기", new String[]{"프린터", "복합기", "스캐너", "정보기기"},
            "문구류", new String[]{"필기구", "노트/수첩", "사무용품", "데스크용품"},
            "가구", new String[]{"의자", "책상", "수납가구", "사무가구"},
            "IT장비", new String[]{"컴퓨터", "모니터", "네트워크장비", "주변기기"},
            "소모품", new String[]{"프린터소모품", "사무용지", "데스크소모품", "사무소모품"}
    );

    // 소싱 상세 카테고리
    private static final Map<String, String[]> SOURCING_DETAIL_CATEGORIES = Map.of(
            "프린터", new String[]{"레이저프린터", "잉크젯프린터", "포토프린터", "라벨프린터"},
            "복합기", new String[]{"레이저복합기", "잉크젯복합기", "흑백복합기", "컬러복합기"},
            "필기구", new String[]{"볼펜", "연필", "마커", "형광펜"},
            "의자", new String[]{"사무용의자", "메쉬의자", "회의용의자", "접이식의자"},
            "책상", new String[]{"사무용책상", "회의용테이블", "스탠딩책상", "컴퓨터책상"},
            "컴퓨터", new String[]{"데스크탑", "노트북", "태블릿", "서버"},
            "프린터소모품", new String[]{"토너", "잉크", "드럼", "카트리지"}
    );

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void initializeData() {
        log.info("Starting supplier registration data initialization process...");
        log.info("Current database state:");
        log.info("SupplierRegistration count: {}", supplierRegistrationRepository.count());
        log.info("Member count: {}", memberRepository.count());

        // 이미 등록 정보가 있는 경우 중단
        if (supplierRegistrationRepository.count() > 0) {
            log.info("Supplier registrations already exist. Skipping initialization.");
            return;
        }

        try {
            // 회원 데이터 가져오기 (SUPPLIER 역할을 가진 회원만)
            List<Member> supplierMembers = getSupplierMembers();
            
            if (supplierMembers.isEmpty()) {
                log.error("No supplier members found. Supplier registration initialization aborted.");
                return;
            }
            
            log.info("Found {} supplier members for registrations", supplierMembers.size());
            
            // 비즈니스 타입별로 데이터 생성
            List<SupplierRegistration> allRegistrations = new ArrayList<>();
            
            for (Member supplier : supplierMembers) {
                // 이미 등록 정보가 있는지 확인
                if (hasExistingRegistration(supplier)) {
                    log.info("Supplier {} already has registration data. Skipping.", supplier.getId());
                    continue;
                }
                
                // 비즈니스 타입 무작위 선택
                String businessType = BUSINESS_TYPES[random.nextInt(BUSINESS_TYPES.length)];
                
                // 공급업체 등록 정보 생성
                SupplierRegistration registration = createSupplierRegistration(supplier, businessType);
                allRegistrations.add(registration);
            }
            
            // 등록 정보 저장
            allRegistrations = supplierRegistrationRepository.saveAll(allRegistrations);
            log.info("Total supplier registrations created: {}", allRegistrations.size());
            
            // 첨부 파일 생성 및 저장
            List<SupplierAttachment> attachments = createSupplierAttachments(allRegistrations);
            supplierAttachmentRepository.saveAll(attachments);
            log.info("Created {} supplier attachments", attachments.size());
            
            // 생성된 데이터 요약 로깅
            summarizeCreatedData(allRegistrations);
            
        } catch (Exception e) {
            log.error("Error during supplier registration initialization", e);
            throw new RuntimeException("Supplier registration initialization failed", e);
        }
    }

    /**
     * SUPPLIER 역할의 회원 목록 가져오기
     */

/**
 * SUPPLIER 역할의 회원 목록 가져오기
 */
private List<Member> getSupplierMembers() {
    // 모든 회원 가져오기
    List<Member> allMembers = memberRepository.findAll();
    
    // SUPPLIER 역할 필터링
    List<Member> supplierMembers = new ArrayList<>();
    for (Member member : allMembers) {
        if (member.getRole() == Member.Role.SUPPLIER) {
            supplierMembers.add(member);
        }
    }
    
    // 공급업체 회원이 없으면 새로운 공급사 회원 생성
    if (supplierMembers.isEmpty()) {
        log.info("No supplier members found. Creating new supplier members.");
        
        // 신규 공급사 회원 20개 생성
        int suppliersToCreate = 20;
        
        // 새 공급사 회원 생성
        for (int i = 0; i < suppliersToCreate; i++) {
            String username = "supplier" + (i + 1);
            String companyName = "공급사 " + (i + 1);
            
            Member supplier = Member.builder()
                .username(username)
                .name(companyName + " 담당자")
                .password(passwordEncoder.encode("1234")) // 기본 비밀번호
                .email(username + "@supplier.com")
                .companyName(companyName)
                .contactNumber("010-" + generateRandomPhoneNumber())
                .role(Member.Role.SUPPLIER)
                .enabled(true)
                .build();
            
            supplierMembers.add(supplier);
        }
        
        // 새 회원 저장
        supplierMembers = memberRepository.saveAll(supplierMembers);
        log.info("Created {} new supplier members", supplierMembers.size());
    } else {
        log.info("Found {} existing supplier members", supplierMembers.size());
    }
    
    return supplierMembers;
}
    
    /**
     * 회원이 이미 등록 정보를 가지고 있는지 확인
     */
    private boolean hasExistingRegistration(Member supplier) {
        List<SupplierRegistration> existingRegistrations = supplierRegistrationRepository.findBySupplier(supplier);
        return !existingRegistrations.isEmpty();
    }

    /**
     * 공급업체 등록 정보 생성
     */
    private SupplierRegistration createSupplierRegistration(Member supplier, String businessType) {
        // 업종 선택
        String[] businessCategories = BUSINESS_CATEGORIES.get(businessType);
        String businessCategory = businessCategories[random.nextInt(businessCategories.length)];
        
        // 소싱 카테고리 선택
        String sourcingCategory = SOURCING_CATEGORIES[random.nextInt(SOURCING_CATEGORIES.length)];
        
        // 소싱 하위 카테고리 선택
        String[] subCategories = SOURCING_SUB_CATEGORIES.get(sourcingCategory);
        String sourcingSubCategory = subCategories[random.nextInt(subCategories.length)];
        
        // 소싱 상세 카테고리 선택 (있는 경우)
        String sourcingDetailCategory = "";
        if (SOURCING_DETAIL_CATEGORIES.containsKey(sourcingSubCategory)) {
            String[] detailCategories = SOURCING_DETAIL_CATEGORIES.get(sourcingSubCategory);
            sourcingDetailCategory = detailCategories[random.nextInt(detailCategories.length)];
        }
        
        // 상태 결정 (60% 승인, 30% 대기, 10% 거부)
        String status = determineRandomStatus();
        
        // 등록 정보 생성
        SupplierRegistration registration = new SupplierRegistration();
        registration.setSupplier(supplier);
        registration.setRegistrationDate(LocalDate.now().minusDays(random.nextInt(30)));
        registration.setStatus(new SystemStatus(STATUS_ENTITY_TYPE, status));
        
        // 비즈니스 정보 설정
        registration.setBusinessNo(generateBusinessNo());
        registration.setCeoName(generateCeoName());
        registration.setBusinessType(businessType);
        registration.setBusinessCategory(businessCategory);
        registration.setSourcingCategory(sourcingCategory);
        registration.setSourcingSubCategory(sourcingSubCategory);
        registration.setSourcingDetailCategory(sourcingDetailCategory);
        
        // 연락처 및 주소 정보
        registration.setPhoneNumber(generatePhoneNumber());
        registration.setPostalCode(generatePostalCode());
        registration.setRoadAddress(generateAddress());
        registration.setDetailAddress(generateDetailAddress());
        registration.setComments("자동 생성된 공급업체 등록 정보입니다.");
        
        // 반려 사유 (필요한 경우)
        if (STATUS_REJECTED.equals(status)) {
            registration.setRejectionReason(generateRejectionReason());
        }
        
        // 담당자 정보
        registration.setContactPerson(generateContactPerson());
        registration.setContactPhone(generateMobileNumber());
        registration.setContactEmail(generateEmail(supplier.getCompanyName()));
        
        return registration;
    }

    /**
     * 공급업체 등록 정보에 대한 첨부 파일 생성
     */
    private List<SupplierAttachment> createSupplierAttachments(List<SupplierRegistration> registrations) {
        List<SupplierAttachment> attachments = new ArrayList<>();
        
        for (SupplierRegistration registration : registrations) {
            // 사업자등록증은 필수 첨부
            SupplierAttachment businessLicense = SupplierAttachment.builder()
                .supplierRegistration(registration)
                .fileName("사업자등록증_" + registration.getBusinessNo() + ".pdf")
                .filePath("/uploads/suppliers/" + UUID.randomUUID().toString().substring(0, 8) + "/business-license.pdf")
                .fileSize(random.nextInt(1000000) + 500000L) // 500KB ~ 1.5MB
                .fileType("application/pdf")
                .build();
            
            attachments.add(businessLicense);
            
            // 50% 확률로 추가 서류 첨부
            if (random.nextBoolean()) {
                String[] additionalDocTypes = {"법인등기부등본", "인감증명서", "사업장증명서", "재무제표"};
                String docType = additionalDocTypes[random.nextInt(additionalDocTypes.length)];
                
                SupplierAttachment additionalDoc = SupplierAttachment.builder()
                    .supplierRegistration(registration)
                    .fileName(docType + "_" + registration.getBusinessNo() + ".pdf")
                    .filePath("/uploads/suppliers/" + UUID.randomUUID().toString().substring(0, 8) + "/" + docType.toLowerCase() + ".pdf")
                    .fileSize(random.nextInt(2000000) + 300000L) // 300KB ~ 2.3MB
                    .fileType("application/pdf")
                    .build();
                
                attachments.add(additionalDoc);
            }
        }
        
        return attachments;
    }

    /**
     * 랜덤 상태 결정 (비율: 60% 승인, 30% 대기, 10% 거부)
     */
    private String determineRandomStatus() {
        int rand = random.nextInt(100);
        if (rand < 60) {
            return STATUS_APPROVED;
        } else if (rand < 90) {
            return STATUS_PENDING;
        } else {
            return STATUS_REJECTED;
        }
    }

    /**
     * 생성된 데이터 요약 로깅
     */
    private void summarizeCreatedData(List<SupplierRegistration> registrations) {
        // 비즈니스 타입별 카운트
        Map<String, Integer> businessTypeCounts = new HashMap<>();
        for (String type : BUSINESS_TYPES) {
            businessTypeCounts.put(type, 0);
        }
        
        // 상태별 카운트
        int approvedCount = 0;
        int pendingCount = 0;
        int rejectedCount = 0;
        
        for (SupplierRegistration reg : registrations) {
            // 비즈니스 타입 카운팅
            String businessType = reg.getBusinessType();
            businessTypeCounts.put(businessType, businessTypeCounts.getOrDefault(businessType, 0) + 1);
            
            // 상태 카운팅
            String status = reg.getStatus().getChildCode();
            if (STATUS_APPROVED.equals(status)) {
                approvedCount++;
            } else if (STATUS_PENDING.equals(status)) {
                pendingCount++;
            } else if (STATUS_REJECTED.equals(status)) {
                rejectedCount++;
            }
        }
        
        // 비즈니스 타입별 요약 로깅
        for (String type : BUSINESS_TYPES) {
            log.info("Business type '{}': {} registrations", type, businessTypeCounts.get(type));
        }
        
        // 상태별 요약 로깅
        log.info("Status distribution - Approved: {}, Pending: {}, Rejected: {}",
                approvedCount, pendingCount, rejectedCount);
        
        // 첨부 파일 통계
        log.info("Total registrations with attachments: {}", registrations.size());
    }
    
    // 데이터 생성 도우미 메소드들
    
    private String generateBusinessNo() {
        return String.format("%03d-%02d-%05d",
                100 + random.nextInt(900),
                10 + random.nextInt(90),
                10000 + random.nextInt(90000));
    }
    
    private String generateCeoName() {
        String[] lastNames = {"김", "이", "박", "최", "정", "강", "조", "윤", "장", "임"};
        String[] firstNames = {"준호", "민수", "지훈", "성민", "영호", "정수", "현우", "승현", "도윤", "지원"};
        
        return lastNames[random.nextInt(lastNames.length)] + 
               firstNames[random.nextInt(firstNames.length)];
    }
    
    private String generatePhoneNumber() {
        String[] prefixes = {"02", "031", "032", "033", "041", "042", "043", "051", "053", "055", "064"};
        String prefix = prefixes[random.nextInt(prefixes.length)];
        
        if ("02".equals(prefix)) {
            return String.format("%s-%04d-%04d", prefix, 1000 + random.nextInt(9000), 1000 + random.nextInt(9000));
        } else {
            return String.format("%s-%03d-%04d", prefix, 100 + random.nextInt(900), 1000 + random.nextInt(9000));
        }
    }
    
    private String generateMobileNumber() {
        return String.format("010-%04d-%04d", 
                1000 + random.nextInt(9000), 
                1000 + random.nextInt(9000));
    }
    
    private String generatePostalCode() {
        return String.format("%05d", 10000 + random.nextInt(90000));
    }
    
    private String generateAddress() {
        String[] cities = {"서울특별시", "부산광역시", "인천광역시", "대구광역시", "대전광역시", "광주광역시", "울산광역시", "세종특별자치시", 
                "경기도 수원시", "경기도 성남시", "경기도 고양시", "경기도 용인시", "경기도 부천시", "경기도 안산시"};
        String[] districts = {"중구", "서구", "동구", "남구", "북구", "강남구", "서초구", "송파구", "강서구", "영등포구", 
                "마포구", "분당구", "일산동구", "수지구", "권선구", "팔달구"};
        String[] roadNames = {"중앙로", "번영로", "산업로", "혁신로", "테헤란로", "강남대로", "판교로", "디지털로", 
                "경인로", "과천대로", "분당수서로", "백현로"};
        
        return String.format("%s %s %s %d길 %d", 
                cities[random.nextInt(cities.length)],
                districts[random.nextInt(districts.length)],
                roadNames[random.nextInt(roadNames.length)],
                1 + random.nextInt(50),
                1 + random.nextInt(100));
    }
    
    private String generateDetailAddress() {
        String[] buildingTypes = {"빌딩", "오피스텔", "타워", "센터", "플라자", "스퀘어", "파크", "벤처밸리"};
        String[] buildingNames = {"대한", "서울", "미래", "성공", "행복", "해피", "스마일", "글로벌", "퍼스트", "이노", "테크", "비즈"};
        
        return String.format("%s%s %d층 %d호", 
                buildingNames[random.nextInt(buildingNames.length)],
                buildingTypes[random.nextInt(buildingTypes.length)],
                2 + random.nextInt(20),
                1 + random.nextInt(10));
    }
    
    private String generateContactPerson() {
        String[] lastNames = {"김", "이", "박", "최", "정", "강", "조", "윤", "장", "임"};
        String[] firstNames = {"영희", "철수", "민지", "준영", "소희", "민수", "지현", "서연", "준호", "민서", "은지", "지훈"};
        
        return lastNames[random.nextInt(lastNames.length)] + 
               firstNames[random.nextInt(firstNames.length)];
    }
    
    private String generateEmail(String companyName) {
        String[] domains = {"gmail.com", "naver.com", "daum.net", "kakao.com", "hotmail.com", "icloud.com"};
        String[] prefixes = {"info", "contact", "sales", "support", "help", "admin", "service"};
        
        // 영문 변환 또는 임의 접두사 사용
        String emailPrefix = convertToEmailPrefix(companyName);
        if (random.nextBoolean() && !emailPrefix.equals("company")) {
            return emailPrefix + "@" + domains[random.nextInt(domains.length)];
        } else {
            return prefixes[random.nextInt(prefixes.length)] + 
                   String.format("%03d", random.nextInt(1000)) + 
                   "@" + domains[random.nextInt(domains.length)];
        }
    }
    
    private String convertToEmailPrefix(String name) {
        // 영문자와 숫자만 포함하는 변환
        String simplified = name.replaceAll("[^a-zA-Z0-9]", "");
        
        if (simplified.isEmpty()) {
            // 영문이 없는 경우 기본값 사용
            return "company" + (100 + random.nextInt(900));
        }
        
        return simplified.toLowerCase().substring(0, Math.min(simplified.length(), 8));
    }
    
    private String generateRejectionReason() {
        String[] reasons = {
            "제출하신 사업자등록증 사본의 인장이 불분명합니다. 명확한 사본을 다시 제출해주세요.",
            "소싱 카테고리와 업종 정보가 일치하지 않습니다. 정확한 정보로 수정 후 재신청해주세요.",
            "담당자 연락처 정보가 부정확합니다. 확인 후 재신청해주세요.",
            "회사 정보와 제출 서류의 내용이 일치하지 않습니다. 확인 후 재신청해주세요.",
            "사업자등록증의 등록 주소와 입력하신 주소가 일치하지 않습니다. 확인 후 재신청해주세요.",
            "영업 관련 필수 인허가 서류가 누락되었습니다. 추가 서류를 첨부하여 재신청해주세요.",
            "기업신용등급 관련 추가 서류 제출이 필요합니다. 재신청 시 첨부해 주세요."
        };
        
        return reasons[random.nextInt(reasons.length)];
    }
}