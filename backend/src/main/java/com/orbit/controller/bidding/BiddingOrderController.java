package com.orbit.controller.bidding;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.orbit.dto.bidding.BiddingOrderDto;
import com.orbit.entity.bidding.BiddingOrder.OrderStatus;
import com.orbit.service.bidding.BiddingOrderService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/biddings/orders")
@RequiredArgsConstructor
public class BiddingOrderController {
    
    private final BiddingOrderService biddingOrderService;
    
    /**
     * 발주 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<BiddingOrderDto>> getAllOrders() {
        List<BiddingOrderDto> orders = biddingOrderService.getAllOrders();
        return ResponseEntity.ok(orders);
    }
    
    /**
     * 발주 상세 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<BiddingOrderDto> getOrderById(@PathVariable Long id) {
        BiddingOrderDto order = biddingOrderService.getOrderById(id);
        return ResponseEntity.ok(order);
    }
    
    /**
     * 입찰별 발주 목록 조회
     */
    @GetMapping("/bidding/{biddingId}")
    public ResponseEntity<List<BiddingOrderDto>> getOrdersByBiddingId(@PathVariable Long biddingId) {
        List<BiddingOrderDto> orders = biddingOrderService.getOrdersByBiddingId(biddingId);
        return ResponseEntity.ok(orders);
    }
    
    /**
     * 낙찰자(공급자)별 발주 목록 조회
     */
    @GetMapping("/selected-bidder/{supplierId}")
    public ResponseEntity<List<BiddingOrderDto>> getOrdersBySelectedBidder(@PathVariable Long supplierId) {
        List<BiddingOrderDto> orders = biddingOrderService.getOrdersBySelectedBidder(supplierId);
        return ResponseEntity.ok(orders);
    }
    
    /**
     * 공급자별 발주 목록 조회
     */
    @GetMapping("/supplier/{supplierId}")
    public ResponseEntity<List<BiddingOrderDto>> getOrdersBySupplierId(@PathVariable Long supplierId) {
        List<BiddingOrderDto> orders = biddingOrderService.getOrdersBySupplierId(supplierId);
        return ResponseEntity.ok(orders);
    }
    
    /**
     * 상태별 발주 목록 조회
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<BiddingOrderDto>> getOrdersByStatus(@PathVariable OrderStatus status) {
        List<BiddingOrderDto> orders = biddingOrderService.getOrdersByStatus(status);
        return ResponseEntity.ok(orders);
    }
    
    /**
     * 날짜 범위로 발주 목록 조회
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<BiddingOrderDto>> getOrdersByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        List<BiddingOrderDto> orders = biddingOrderService.getOrdersByDateRange(startDate, endDate);
        return ResponseEntity.ok(orders);
    }
    
    /**
     * 특정 기간 내 발주의 총 금액 조회
     */
    @GetMapping("/total-amount")
    public ResponseEntity<BigDecimal> getTotalOrderAmountByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        BigDecimal totalAmount = biddingOrderService.getTotalOrderAmountByDateRange(startDate, endDate);
        return ResponseEntity.ok(totalAmount);
    }
    
    /**
     * 낙찰자로 선정된 발주의 총 금액 조회
     */
    @GetMapping("/selected-bidder-amount")
    public ResponseEntity<BigDecimal> getTotalSelectedBidderAmountByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        BigDecimal totalAmount = biddingOrderService.getTotalSelectedBidderAmountByDateRange(startDate, endDate);
        return ResponseEntity.ok(totalAmount);
    }
    
    /**
     * 입찰 수동 마감 및 낙찰자 선정하여 발주 생성
     */
    @PostMapping("/close-bidding/{biddingId}/select-bidder/{participationId}")
    public ResponseEntity<BiddingOrderDto> closeBiddingAndCreateOrder(
            @PathVariable Long biddingId,
            @PathVariable Long participationId,
            @RequestParam Long userId) {
        BiddingOrderDto order = biddingOrderService.closeBiddingAndCreateOrder(biddingId, participationId, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }
    
    /**
     * 발주 수정
     */
    @PutMapping("/{id}")
    public ResponseEntity<BiddingOrderDto> updateOrder(
            @PathVariable Long id,
            @Valid @RequestBody BiddingOrderDto orderDto) {
        BiddingOrderDto updatedOrder = biddingOrderService.updateOrder(id, orderDto);
        return ResponseEntity.ok(updatedOrder);
    }
    
    /**
     * 발주 승인
     */
    @PutMapping("/{id}/approve")
    public ResponseEntity<BiddingOrderDto> approveOrder(
            @PathVariable Long id,
            @RequestParam Long approverId) {
        BiddingOrderDto order = biddingOrderService.approveOrder(id, approverId);
        return ResponseEntity.ok(order);
    }
    
    /**
     * 발주 진행 시작
     */
    @PutMapping("/{id}/start")
    public ResponseEntity<BiddingOrderDto> startOrder(@PathVariable Long id) {
        BiddingOrderDto order = biddingOrderService.startOrder(id);
        return ResponseEntity.ok(order);
    }
    
    /**
     * 발주 완료 처리
     */
    @PutMapping("/{id}/complete")
    public ResponseEntity<BiddingOrderDto> completeOrder(@PathVariable Long id) {
        BiddingOrderDto order = biddingOrderService.completeOrder(id);
        return ResponseEntity.ok(order);
    }
    
    /**
     * 발주 취소
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<BiddingOrderDto> cancelOrder(@PathVariable Long id) {
        BiddingOrderDto order = biddingOrderService.cancelOrder(id);
        return ResponseEntity.ok(order);
    }
    
    /**
     * 발주 삭제 (초안 상태일 때만 가능)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        biddingOrderService.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }
}