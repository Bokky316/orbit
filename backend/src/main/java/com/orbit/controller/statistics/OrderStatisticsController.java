package com.orbit.controller.statistics;

import com.orbit.service.bidding.BiddingOrderService;
import com.orbit.service.statistics.OrderStatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
public class OrderStatisticsController {

    private final OrderStatisticsService orderStatisticsService;
    private final BiddingOrderService biddingOrderService;

    // 통계 메인 화면 엔드포인트
    @GetMapping("/orders/main/{year}")
    public ResponseEntity<Map<String, Object>> getMainStatistics(@PathVariable("year") int year) {
        Map<String, Object> response = new HashMap<>();
        response.put("monthlyPurchaseData", orderStatisticsService.getMonthlyOrderStatistics(year));
        response.put("categoryPurchaseData", orderStatisticsService.getCategoryOrderStatistics(year));
        return ResponseEntity.ok(response);
    }

    // 월별 구매 실적 통계 엔드포인트
    @GetMapping("/orders/monthly/{year}")
    public ResponseEntity<Map<String, Object>> getMonthlyOrderStatistics(@PathVariable("year") int year) {
        return ResponseEntity.ok(orderStatisticsService.getMonthlyOrderStatistics(year));
    }

    // 카테고리별 주문 통계 엔드포인트
    @GetMapping("/orders/category/{year}")
    public ResponseEntity<List<Map<String, Object>>> getCategoryOrderStatistics(@PathVariable("year") int year) {
        return ResponseEntity.ok(orderStatisticsService.getCategoryOrderStatistics(year));
    }

    // 품목별 주문 통계 엔드포인트
    @GetMapping("/orders/item/{year}")
    public ResponseEntity<List<Map<String, Object>>> getItemOrderStatistics(@PathVariable("year") int year) {
        return ResponseEntity.ok(orderStatisticsService.getItemOrderStatistics(year));
    }


    // 공급업체별 주문 통계 엔드포인트
    @GetMapping("/orders/supplier/{year}")
    public ResponseEntity<List<Map<String, Object>>> getSupplierOrderStatistics(@PathVariable("year") int year) {
        return ResponseEntity.ok(orderStatisticsService.getSupplierOrderStatistics(year));
    }

    // // 입찰 월별 통계 엔드포인트
    // @GetMapping("/bidding/orders/monthly")
    // public ResponseEntity<List<MonthlyOrderStatisticsDto>> getBiddingMonthlyStatistics(
    //         @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime startDate,
    //         @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime endDate) {

    //     if (startDate.isAfter(endDate)) {
    //         throw new IllegalArgumentException("시작일이 종료일보다 늦을 수 없습니다.");
    //     }

    //     List<MonthlyOrderStatisticsDto> statistics = biddingOrderService.getMonthlyOrderStatistics(startDate, endDate);
    //     return ResponseEntity.ok(statistics);
    // }
} 