package com.orbit.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.orbit.dto.bidding.BiddingDto;
import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.Bidding.BidMethod;
import com.orbit.entity.bidding.Bidding.BiddingStatus;
import com.orbit.repository.bidding.BiddingEvaluationRepository;
import com.orbit.repository.bidding.BiddingParticipationRepository;
import com.orbit.repository.bidding.BiddingRepository;
import com.orbit.repository.bidding.SimplifiedContractRepository;
import com.orbit.util.PriceCalculator;
import com.orbit.util.PriceCalculator.PriceResult;

@ExtendWith(MockitoExtension.class)
public class BiddingServiceTest {

    @Mock
    private BiddingRepository biddingRepository;
    
    @Mock
    private BiddingParticipationRepository participationRepository;
    
    @Mock
    private BiddingEvaluationRepository evaluationRepository;
    
    @Mock
    private SimplifiedContractRepository contractRepository;
    
    @InjectMocks
    private BiddingService biddingService;
    
    private List<Bidding> mockBiddings;
    
    @BeforeEach
    void setup() {
        // 테스트용 입찰 데이터 생성
        mockBiddings = Arrays.asList(
            createBidding(1L, "컴퓨터 구매", BidMethod.가격제안, new BigDecimal("1000000"), 10),
            createBidding(2L, "서버 장비 구매", BidMethod.가격제안, new BigDecimal("5000000"), 2),
            createBidding(3L, "소프트웨어 라이센스", BidMethod.가격제안, new BigDecimal("200000"), 50),
            createBidding(4L, "사무용 가구", BidMethod.가격제안, new BigDecimal("300000"), 20)
        );
    }
    
    @Test
    @DisplayName("금액 계산 테스트 - 컴퓨터 구매")
    void testPriceCalculation_Computer() {
        // 준비
        BigDecimal unitPrice = new BigDecimal("1000000");
        Integer quantity = 10;
        
        // 실행
        PriceResult result = PriceCalculator.calculateAll(unitPrice, quantity);
        
        // 검증
        assertEquals(new BigDecimal("10000000.00"), result.getSupplyPrice());
        assertEquals(new BigDecimal("1000000.00"), result.getVat());
        assertEquals(new BigDecimal("11000000.00"), result.getTotalAmount());
    }
    
    @Test
    @DisplayName("금액 계산 테스트 - 서버 장비 구매")
    void testPriceCalculation_Server() {
        // 준비
        BigDecimal unitPrice = new BigDecimal("5000000");
        Integer quantity = 2;
        
        // 실행
        PriceResult result = PriceCalculator.calculateAll(unitPrice, quantity);
        
        // 검증
        assertEquals(new BigDecimal("10000000.00"), result.getSupplyPrice());
        assertEquals(new BigDecimal("1000000.00"), result.getVat());
        assertEquals(new BigDecimal("11000000.00"), result.getTotalAmount());
    }
    
    @Test
    @DisplayName("금액 계산 테스트 - 소프트웨어 라이센스")
    void testPriceCalculation_Software() {
        // 준비
        BigDecimal unitPrice = new BigDecimal("200000");
        Integer quantity = 50;
        
        // 실행
        PriceResult result = PriceCalculator.calculateAll(unitPrice, quantity);
        
        // 검증
        assertEquals(new BigDecimal("10000000.00"), result.getSupplyPrice());
        assertEquals(new BigDecimal("1000000.00"), result.getVat());
        assertEquals(new BigDecimal("11000000.00"), result.getTotalAmount());
    }
    
    @Test
    @DisplayName("금액 계산 테스트 - 사무용 가구")
    void testPriceCalculation_Furniture() {
        // 준비
        BigDecimal unitPrice = new BigDecimal("300000");
        Integer quantity = 20;
        
        // 실행
        PriceResult result = PriceCalculator.calculateAll(unitPrice, quantity);
        
        // 검증
        assertEquals(new BigDecimal("6000000.00"), result.getSupplyPrice());
        assertEquals(new BigDecimal("600000.00"), result.getVat());
        assertEquals(new BigDecimal("6600000.00"), result.getTotalAmount());
    }
    
    @Test
    @DisplayName("입찰 공고 생성 시 금액 계산 테스트")
    void testCreateBiddingWithPriceCalculation() {
        // 준비
        BiddingDto biddingDto = createBiddingDto("테스트 입찰", BidMethod.가격제안, new BigDecimal("1000"), 10);
        
        Bidding mockSavedBidding = biddingDto.toEntity();
        mockSavedBidding.setId(1L);
        when(biddingRepository.count()).thenReturn(0L);
        when(biddingRepository.save(any(Bidding.class))).thenReturn(mockSavedBidding);
        
        // 실행
        BiddingDto result = biddingService.createBidding(biddingDto);
        
        // 검증
        assertNotNull(result);
        assertEquals(new BigDecimal("10000.00"), result.getSupplyPrice());
        assertEquals(new BigDecimal("1000.00"), result.getVat());
        assertEquals(new BigDecimal("11000.00"), result.getTotalAmount());
    }
    
    // 테스트용 입찰 생성 메서드
    private Bidding createBidding(Long id, String title, BidMethod bidMethod, BigDecimal unitPrice, Integer quantity) {
        Bidding bidding = new Bidding();
        bidding.setId(id);
        bidding.setTitle(title);
        bidding.setBidNumber("BID-2023-" + String.format("%04d", id));
        bidding.setBidMethod(bidMethod);
        bidding.setStartDate(LocalDateTime.now());
        bidding.setEndDate(LocalDateTime.now().plusDays(7));
        bidding.setStatus(BiddingStatus.대기중);
        bidding.setUnitPrice(unitPrice);
        bidding.setQuantity(quantity);
        
        // 금액 계산
        PriceResult result = PriceCalculator.calculateAll(unitPrice, quantity);
        bidding.setSupplyPrice(result.getSupplyPrice());
        bidding.setVat(result.getVat());
        bidding.setTotalAmount(result.getTotalAmount());
        
        return bidding;
    }
    
    // 테스트용 DTO 생성 메서드
    private BiddingDto createBiddingDto(String title, BidMethod bidMethod, BigDecimal unitPrice, Integer quantity) {
        BiddingDto dto = new BiddingDto();
        dto.setTitle(title);
        dto.setBidMethod(bidMethod);
        dto.setStartDate(LocalDateTime.now());
        dto.setEndDate(LocalDateTime.now().plusDays(7));
        dto.setStatus(BiddingStatus.대기중);
        dto.setUnitPrice(unitPrice);
        dto.setQuantity(quantity);
        return dto;
    }
}
