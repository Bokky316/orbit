package com.orbit.service.statistics;

import com.orbit.repository.bidding.BiddingOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderStatisticsService {

    private final BiddingOrderRepository biddingOrderRepository;

    public Map<String, Object> getMonthlyOrderStatistics(int year) {
        LocalDateTime startDate = LocalDateTime.of(year, 1, 1, 0, 0);
        LocalDateTime endDate = startDate.with(TemporalAdjusters.lastDayOfYear()).withHour(23).withMinute(59).withSecond(59);

        List<Object[]> monthlyStats = biddingOrderRepository.findMonthlyOrderStatistics(startDate, endDate);
        
        List<Map<String, Object>> monthlyData = monthlyStats.stream()
            .map(stat -> {
                Map<String, Object> data = new HashMap<>();
                data.put("yearMonth", stat[0]);
                data.put("orderCount", stat[1]);
                data.put("totalAmount", stat[2]);
                return data;
            })
            .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("year", year);
        result.put("monthlyData", monthlyData);
        
        return result;
    }

    public List<Map<String, Object>> getSupplierOrderStatistics(int year) {
        LocalDateTime startDate = LocalDateTime.of(year, 1, 1, 0, 0);
        LocalDateTime endDate = startDate.with(TemporalAdjusters.lastDayOfYear()).withHour(23).withMinute(59).withSecond(59);

        List<Object[]> supplierStats = biddingOrderRepository.findSupplierOrderStatistics(startDate, endDate);
        
        return supplierStats.stream()
            .map(stat -> {
                Map<String, Object> data = new HashMap<>();
                data.put("supplierName", stat[0]);
                data.put("orderCount", stat[1]);
                data.put("totalAmount", stat[2]);
                return data;
            })
            .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getCategoryOrderStatistics(int year) {
        LocalDateTime startDate = LocalDateTime.of(year, 1, 1, 0, 0);
        LocalDateTime endDate = startDate.with(TemporalAdjusters.lastDayOfYear()).withHour(23).withMinute(59).withSecond(59);

        List<Object[]> categoryStats = biddingOrderRepository.findCategoryOrderStatistics(startDate, endDate);
        
        return categoryStats.stream()
            .map(stat -> {
                Map<String, Object> data = new HashMap<>();
                data.put("category", stat[0]);
                data.put("orderCount", stat[1]);
                data.put("totalAmount", stat[2]);
                return data;
            })
            .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getItemOrderStatistics(int year) {
        LocalDateTime startDate = LocalDateTime.of(year, 1, 1, 0, 0);
        LocalDateTime endDate = startDate.with(TemporalAdjusters.lastDayOfYear()).withHour(23).withMinute(59).withSecond(59);

        List<Object[]> itemStats = biddingOrderRepository.findItemOrderStatistics(startDate, endDate);
        
        return itemStats.stream()
            .map(stat -> {
                Map<String, Object> data = new HashMap<>();
                data.put("item", stat[0]);
                data.put("orderCount", stat[1]);
                data.put("totalAmount", stat[2]);
                return data;
            })
            .collect(Collectors.toList());
    }
} 