package com.orbit.service.bidding;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import com.orbit.dto.statistics.MonthlyOrderStatisticsDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

//import com.orbit.dto.bidding.MonthlyOrderStatisticsDto;
import com.orbit.repository.bidding.BiddingOrderRepository;

@ExtendWith(MockitoExtension.class)
class BiddingOrderServiceTest {

    @Mock
    private BiddingOrderRepository biddingOrderRepository;

    @InjectMocks
    private BiddingOrderService biddingOrderService;

    @Test
    @DisplayName("월별 발주 통계 조회 테스트")
    void getMonthlyOrderStatisticsTest() {
        // given
        LocalDateTime startDate = LocalDateTime.of(2025, 1, 1, 0, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2025, 12, 31, 23, 59, 59);

        // 테스트 데이터 설정
        Object[] january = new Object[]{"2025-01", 1L, 6600000.00};
        Object[] february = new Object[]{"2025-02", 1L, 1650000.00};
        Object[] march = new Object[]{"2025-03", 6L, 16087500.00};
        List<Object[]> mockResults = Arrays.asList(january, february, march);

        // Mock 설정
        when(biddingOrderRepository.findMonthlyOrderStatistics(startDate, endDate))
            .thenReturn(mockResults);

        // when
        List<MonthlyOrderStatisticsDto> result = biddingOrderService.getMonthlyOrderStatistics(startDate, endDate);

        // then
        assertNotNull(result);
        assertEquals(3, result.size());
        
        // 1월 데이터 검증
        MonthlyOrderStatisticsDto januaryStats = result.get(0);
        assertEquals("2025-01", januaryStats.getYearMonth());
        assertEquals(1L, januaryStats.getOrderCount());
        assertEquals(6600000.00, januaryStats.getTotalAmount());

        // 2월 데이터 검증
        MonthlyOrderStatisticsDto februaryStats = result.get(1);
        assertEquals("2025-02", februaryStats.getYearMonth());
        assertEquals(1L, februaryStats.getOrderCount());
        assertEquals(1650000.00, februaryStats.getTotalAmount());

        // 3월 데이터 검증
        MonthlyOrderStatisticsDto marchStats = result.get(2);
        assertEquals("2025-03", marchStats.getYearMonth());
        assertEquals(6L, marchStats.getOrderCount());
        assertEquals(16087500.00, marchStats.getTotalAmount());

        // Repository 메소드 호출 검증
        verify(biddingOrderRepository, times(1)).findMonthlyOrderStatistics(startDate, endDate);
    }
} 