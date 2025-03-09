package com.orbit.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.orbit.dto.bidding.BiddingDto;
import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.Bidding.BidMethod;
import com.orbit.entity.bidding.Bidding.BiddingStatus;
import com.orbit.repository.bidding.BiddingEvaluationRepository;
import com.orbit.repository.bidding.BiddingParticipationRepository;
import com.orbit.repository.bidding.BiddingRepository;
import com.orbit.repository.bidding.SimplifiedContractRepository;
import com.orbit.service.bidding.BiddingService;

import lombok.extern.slf4j.Slf4j;

@SpringBootTest
@Slf4j
public class BiddingServiceTest {

    @Autowired
    private BiddingService biddingService;
    
    @Autowired
    private BiddingRepository biddingRepository;
    
    @Autowired
    private BiddingParticipationRepository participationRepository;
    
    @Autowired
    private BiddingEvaluationRepository evaluationRepository;
    
    @Autowired
    private SimplifiedContractRepository contractRepository;

    private Bidding sampleBidding;
    private BiddingDto sampleBiddingDto;
    private List<Bidding> sampleBiddings;
    

    @BeforeEach
    void setUp() {
        // 샘플 입찰 공고 생성
        sampleBidding = Bidding.builder()
            .bidNumber("BID-2023-001")
            .purchaseRequestId(1L)
            .purchaseRequestItemId(1L)
            .title("Test Bidding")
            .description("Test Description")
            .bidMethod(BidMethod.PRICE_SUGGESTION)
            .status(BiddingStatus.PENDING)
            .startDate(LocalDateTime.now())
            .endDate(LocalDateTime.now().plusDays(30))
            .quantity(10) // quantity 필드 추가
            .unitPrice(BigDecimal.valueOf(10000))
            .supplyPrice(BigDecimal.valueOf(100000))
            .vat(BigDecimal.valueOf(10000))
            .totalAmount(BigDecimal.valueOf(110000))
            .createdBy(1L) // 이미 있지만 null로 설정되는 문제가 있을 수 있음
            .build();

        sampleBiddingDto = BiddingDto.builder()
            .bidNumber("BID-2023-001")
            .purchaseRequestId(1L)
            .purchaseRequestItemId(1L)
            .title("Test Bidding")
            .description("Test Description")
            .bidMethod(BidMethod.PRICE_SUGGESTION)
            .status(BiddingStatus.PENDING)
            .startDate(LocalDateTime.now())
            .endDate(LocalDateTime.now().plusDays(30))
            .quantity(10) // quantity 필드 추가
            .unitPrice(BigDecimal.valueOf(10000))
            .supplyPrice(BigDecimal.valueOf(100000))
            .vat(BigDecimal.valueOf(10000))
            .totalAmount(BigDecimal.valueOf(110000))
            .createdBy(1L) // DTO에도 createdBy 설정 확인
            .build();
        
        // 20개의 샘플 입찰 공고 생성
        sampleBiddings = createSampleBiddings(20);
    }
    
    /**
     * 다수의 샘플 입찰 공고를 생성하는 헬퍼 메서드
     * 
     * @param count 생성할 입찰 공고 수
     * @return 생성된 입찰 공고 목록
     */
    private List<Bidding> createSampleBiddings(int count) {
        List<Bidding> biddings = new ArrayList<>();
        BiddingStatus[] statuses = BiddingStatus.values();
        BidMethod[] methods = BidMethod.values();
        
        for (int i = 1; i <= count; i++) {
            // 다양한 데이터 패턴을 위한 변수들
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime startDate = now.minusDays(i % 10);
            LocalDateTime endDate = now.plusDays(30 - (i % 15));
            BiddingStatus status = statuses[i % statuses.length];
            BidMethod method = methods[i % methods.length];
            BigDecimal basePrice = BigDecimal.valueOf(1000 * (i + 5));
            
            Bidding bidding = Bidding.builder()
                .bidNumber("BID-2023-" + String.format("%03d", i))
                .purchaseRequestId((long) (i % 5 + 1))
                .purchaseRequestItemId((long) (i % 10 + 1))
                .title("Sample Bidding " + i)
                .description("This is a sample bidding description " + i)
                .bidMethod(method)
                .status(status)
                .startDate(startDate)
                .endDate(endDate)
                .conditions("Condition " + i)
                .internalNote("Internal note " + i)
                .quantity(10) // quantity 필드 추가
                .unitPrice(basePrice)
                .supplyPrice(basePrice.multiply(BigDecimal.valueOf(10)))
                .vat(basePrice.multiply(BigDecimal.valueOf(1)))
                .totalAmount(basePrice.multiply(BigDecimal.valueOf(11)))
                .createdBy(1L) // 명시적으로 createdBy 설정
                .updatedBy(i % 2 == 0 ? 2L : null)
                .build();
                
            biddings.add(bidding);
        }
        
        return biddings;
    }

    /**
     * 실제 데이터베이스에 샘플 데이터 저장 테스트
     * 이 테스트를 한번만 실행하여 데이터를 저장합니다.
     */
    @Test
    @DisplayName("샘플 입찰 공고 데이터 생성 및 저장")
    void createSampleData() {
        // 기존 데이터 모두 삭제
        biddingRepository.deleteAll();
        
        // 샘플 데이터 저장
        biddingRepository.saveAll(sampleBiddings);
        
        // 저장된 데이터 확인
        List<Bidding> savedBiddings = biddingRepository.findAll();
        assert savedBiddings.size() == 20;
        
        System.out.println("샘플 입찰 공고 데이터 " + savedBiddings.size() + "개가 성공적으로 저장되었습니다.");
    }

    /**
     * 입찰 공고 생성 테스트 (단일 항목)
     */
    @Test
    @DisplayName("단일 입찰 공고 생성 테스트")
    void testCreateSingleBidding() {
        // 샘플 DTO 대신 직접 엔티티 생성하여 저장
        Bidding bidding = Bidding.builder()
            .bidNumber("BID-2023-TEST")
            .purchaseRequestId(1L)
            .purchaseRequestItemId(1L)
            .title("Test Bidding Direct")
            .description("Test Description Direct")
            .bidMethod(BidMethod.PRICE_SUGGESTION)
            .status(BiddingStatus.PENDING)
            .startDate(LocalDateTime.now())
            .endDate(LocalDateTime.now().plusDays(30))
            .quantity(10)
            .unitPrice(BigDecimal.valueOf(10000))
            .supplyPrice(BigDecimal.valueOf(100000))
            .vat(BigDecimal.valueOf(10000))
            .totalAmount(BigDecimal.valueOf(110000))
            .createdBy(1L)
            .build();
        
        // 직접 리포지토리를 통해 저장
        Bidding savedBidding = biddingRepository.save(bidding);
        
        // 저장된 입찰 공고 확인
        assert savedBidding != null;
        assert savedBidding.getId() != null;
        assert savedBidding.getTitle().equals("Test Bidding Direct");
        
        System.out.println("입찰 공고가 성공적으로 생성되었습니다. ID: " + savedBidding.getId());
    }
    
    /**
     * 입찰 공고 목록 조회 테스트
     */
    @Test
    @DisplayName("입찰 공고 목록 조회 테스트")
    void testGetBiddingList() {
        // 먼저 샘플 데이터 저장
        if (biddingRepository.count() == 0) {
            biddingRepository.saveAll(sampleBiddings);
        }
        
        // 파라미터 없이 모든 입찰 공고 조회
        Map<String, Object> params = new HashMap<>();
        List<BiddingDto> biddings = biddingService.getBiddingList(params);
        
        // 조회 결과 확인
        assert biddings != null;
        assert !biddings.isEmpty();
        
        System.out.println("입찰 공고 목록 조회 성공. 총 " + biddings.size() + "개의 입찰 공고가 있습니다.");
        
        // 조회된 첫 번째 입찰 공고 정보 출력
        if (!biddings.isEmpty()) {
            BiddingDto first = biddings.get(0);
            System.out.println("첫 번째 입찰 공고 정보:");
            System.out.println("ID: " + first.getId());
            System.out.println("제목: " + first.getTitle());
            System.out.println("상태: " + first.getStatus());
            System.out.println("입찰방법: " + first.getBidMethod());
        }
    }
    
    /**
     * 상태별 입찰 공고 필터링 테스트
     */
    @Test
    @DisplayName("상태별 입찰 공고 필터링 테스트")
    void testGetBiddingListByStatus() {
        // 먼저 샘플 데이터 저장
        if (biddingRepository.count() == 0) {
            biddingRepository.saveAll(sampleBiddings);
        }
        
        // PENDING 상태 입찰 공고 조회
        Map<String, Object> params = new HashMap<>();
        params.put("status", BiddingStatus.PENDING);
        
        List<BiddingDto> pendingBiddings = biddingService.getBiddingList(params);
        
        // 조회 결과 확인
        assert pendingBiddings != null;
        
        if (!pendingBiddings.isEmpty()) {
            assert pendingBiddings.stream().allMatch(b -> b.getStatus() == BiddingStatus.PENDING);
            System.out.println("PENDING 상태 입찰 공고 조회 성공. 총 " + pendingBiddings.size() + "개의 입찰 공고가 있습니다.");
        } else {
            System.out.println("PENDING 상태의 입찰 공고가 없습니다.");
        }
    }
    
    /**
     * 날짜별 입찰 공고 필터링 테스트
     */
    @Test
    @DisplayName("날짜별 입찰 공고 필터링 테스트")
    void testGetBiddingListByDate() {
        // 먼저 샘플 데이터 저장
        if (biddingRepository.count() == 0) {
            biddingRepository.saveAll(sampleBiddings);
        }
        
        // 최근 30일 이내의 입찰 공고 조회
        LocalDateTime startDate = LocalDateTime.now().minusDays(30);
        LocalDateTime endDate = LocalDateTime.now();
        
        Map<String, Object> params = new HashMap<>();
        params.put("startDate", startDate);
        params.put("endDate", endDate);
        
        List<BiddingDto> recentBiddings = biddingService.getBiddingList(params);
        
        // 조회 결과 확인
        assert recentBiddings != null;
        
        System.out.println("날짜별 입찰 공고 조회 성공. 총 " + recentBiddings.size() + "개의 입찰 공고가 있습니다.");
    }
    
    /**
     * 입찰 공고 상세 조회 테스트
     */
    @Test
    @DisplayName("입찰 공고 상세 조회 테스트")
    void testGetBiddingById() {
        // 먼저 샘플 데이터 저장 후 첫 번째 입찰 공고의 ID를 가져옴
        Bidding testBidding = biddingRepository.save(sampleBidding);
        Long id = testBidding.getId();
        
        // ID로 상세 조회
        BiddingDto bidding = biddingService.getBiddingById(id);
        
        // 조회 결과 확인
        assert bidding != null;
        assert bidding.getId().equals(id);
        
        System.out.println("입찰 공고 상세 조회 성공. ID: " + bidding.getId() + ", 제목: " + bidding.getTitle());
    }
}