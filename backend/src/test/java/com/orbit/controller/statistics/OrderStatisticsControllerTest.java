package com.orbit.controller.statistics;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;

import com.orbit.config.SecurityConfig;
import com.orbit.config.jwt.TokenAuthenticationFilter;
import com.orbit.config.jwt.RefreshTokenCheckFilter;
import com.orbit.dto.statistics.MonthlyOrderStatisticsDto;
import com.orbit.service.bidding.BiddingOrderService;
import com.orbit.service.statistics.OrderStatisticsService;

@WebMvcTest(value = OrderStatisticsController.class,
    excludeFilters = {
        @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, 
        classes = {
            SecurityConfig.class,
            TokenAuthenticationFilter.class,
            RefreshTokenCheckFilter.class
        })
    }
)
class OrderStatisticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BiddingOrderService biddingOrderService;

    @MockBean
    private OrderStatisticsService orderStatisticsService;

    @Test
    @WithMockUser(roles = "USER")
    @DisplayName("월별 발주 통계 조회 API 테스트")
    void getMonthlyStatisticsTest() throws Exception {
        // given
        List<MonthlyOrderStatisticsDto> mockStats = Arrays.asList(
            MonthlyOrderStatisticsDto.builder()
                .yearMonth("2025-01")
                .orderCount(1L)
                .totalAmount(6600000.00)
                .build(),
            MonthlyOrderStatisticsDto.builder()
                .yearMonth("2025-02")
                .orderCount(1L)
                .totalAmount(1650000.00)
                .build(),
            MonthlyOrderStatisticsDto.builder()
                .yearMonth("2025-03")
                .orderCount(6L)
                .totalAmount(16087500.00)
                .build()
        );

        // Mock service response
        when(biddingOrderService.getMonthlyOrderStatistics(any(LocalDateTime.class), any(LocalDateTime.class)))
            .thenReturn(mockStats);

        // when & then
        mockMvc.perform(get("/api/statistics/bidding/orders/monthly")
                .param("startDate", "2025-01-01 00:00:00")
                .param("endDate", "2025-12-31 23:59:59")
                .contentType(MediaType.APPLICATION_JSON))
            .andDo(print())
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$.length()").value(3))
            .andExpect(jsonPath("$[0].yearMonth").value("2025-01"))
            .andExpect(jsonPath("$[0].orderCount").value(1))
            .andExpect(jsonPath("$[0].totalAmount").value(6600000.00))
            .andExpect(jsonPath("$[1].yearMonth").value("2025-02"))
            .andExpect(jsonPath("$[1].orderCount").value(1))
            .andExpect(jsonPath("$[1].totalAmount").value(1650000.00))
            .andExpect(jsonPath("$[2].yearMonth").value("2025-03"))
            .andExpect(jsonPath("$[2].orderCount").value(6))
            .andExpect(jsonPath("$[2].totalAmount").value(16087500.00));
    }
} 