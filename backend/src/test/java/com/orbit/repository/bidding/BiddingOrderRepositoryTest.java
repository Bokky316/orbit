package com.orbit.repository.bidding;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import lombok.extern.log4j.Log4j2;

@SpringBootTest
@Log4j2
@Transactional
class BiddingOrderRepositoryTest {

    @Autowired
    private BiddingOrderRepository biddingOrderRepository;

    private static final DateTimeFormatter DATE_FORMATTER = 
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Test
    @DisplayName("월별 발주 통계 조회 테스트")
    void findMonthlyOrderStatistics() {
        // given
        LocalDateTime startDate = LocalDateTime.of(2025, 1, 1, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2025, 12, 31, 23, 59, 59);

        // when
        List<Object[]> results = biddingOrderRepository.findMonthlyOrderStatistics(startDate, endDate);

        // then
        assertThat(results).isNotEmpty(); // 데이터가 있는지 확인
        
        // 각 결과의 형식 검증
        results.forEach(stat -> {
            assertThat(stat).hasSize(3); // yearMonth, orderCount, totalAmount 컬럼 존재
            assertThat(stat[0]).asString().matches("\\d{4}-\\d{2}"); // YYYY-MM 형식
            assertThat(stat[1]).isInstanceOf(Long.class); // orderCount는 Long 타입
            assertThat(stat[2]).isInstanceOf(BigDecimal.class); // totalAmount는 BigDecimal 타입
            
            // 값의 유효성 검증
            assertThat((Long) stat[1]).isPositive(); // orderCount > 0
            assertThat((BigDecimal) stat[2]).isPositive(); // totalAmount > 0
        });

        // 결과가 yearMonth로 정렬되어 있는지 확인
        assertThat(results).isSortedAccordingTo((a, b) -> 
            ((String) a[0]).compareTo((String) b[0]));
    }

    @Test
    @DisplayName("특정 기간 내 발주 통계가 없는 경우 테스트")
    void findMonthlyOrderStatistics_NoData() {
        // given
        LocalDateTime startDate = LocalDateTime.of(2020, 1, 1, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2020, 12, 31, 23, 59, 59);

        // when
        List<Object[]> results = biddingOrderRepository.findMonthlyOrderStatistics(startDate, endDate);

        // then
        assertThat(results).isEmpty();
    }

    @Test
    @DisplayName("단일 월에 대한 발주 통계 조회 테스트")
    void findMonthlyOrderStatistics_SingleMonth() {
        // given
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startDate = now.withDayOfMonth(1)
                                   .withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endDate = now.withDayOfMonth(now.toLocalDate().lengthOfMonth())
                                 .withHour(23).withMinute(59).withSecond(59);

        // when
        List<Object[]> results = biddingOrderRepository.findMonthlyOrderStatistics(startDate, endDate);

        // then
        if (!results.isEmpty()) { // 현재 월에 데이터가 있는 경우
            assertThat(results).hasSize(1);
            Object[] stats = results.get(0);
            
            String expectedYearMonth = String.format("%d-%02d", 
                now.getYear(), 
                now.getMonthValue());
            
            assertThat(stats[0]).isEqualTo(expectedYearMonth);
            assertThat((Long) stats[1]).isPositive();
            assertThat((BigDecimal) stats[2]).isPositive();
        }
    }
} 