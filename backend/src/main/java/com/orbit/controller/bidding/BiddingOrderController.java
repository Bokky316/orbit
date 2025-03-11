package com.orbit.controller.bidding;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.orbit.dto.bidding.BiddingEvaluationDto;
import com.orbit.dto.bidding.BiddingOrderDto;
import com.orbit.dto.bidding.BiddingParticipationDto;
import com.orbit.service.bidding.BiddingOrderService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Slf4j
public class BiddingOrderController {
    private final BiddingOrderService biddingOrderService;

     /**
     * 발주 생성
     */
    @PostMapping
    public ResponseEntity<BiddingOrderDto> createOrder(@Valid @RequestBody BiddingOrderDto orderDto) {
        log.info("발주 생성 요청");
        BiddingOrderDto createdOrder = biddingOrderService.createOrder(orderDto);
        return new ResponseEntity<>(createdOrder, HttpStatus.CREATED);
    }
    @GetMapping
    public ResponseEntity<List<BiddingOrderDto>> getAllOrders() {
        log.info("전체 발주 목록 조회 요청");
        List<BiddingOrderDto> orders = biddingOrderService.getAllOrders();
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BiddingOrderDto> getOrderById(@PathVariable Long id) {
        log.info("발주 상세 조회 요청 - ID: {}", id);
        BiddingOrderDto order = biddingOrderService.getOrderById(id);
        return ResponseEntity.ok(order);
    }

   

    /**
     * 공급자 참여 의사 확인
     */
    @PutMapping("/{participationId}/confirm")
    public ResponseEntity<BiddingParticipationDto> confirmSupplierParticipation(
            @PathVariable Long participationId) {
        BiddingParticipationDto participation = biddingOrderService.confirmSupplierParticipation(participationId);
        return ResponseEntity.ok(participation);
    }

    /**
     * 낙찰자 선정
     */
    @PutMapping("/{evaluationId}/select-bidder")
    public ResponseEntity<BiddingEvaluationDto> selectWinningBidder(
            @PathVariable Long evaluationId) {
        BiddingEvaluationDto evaluation = biddingOrderService.selectWinningBidder(evaluationId);
        return ResponseEntity.ok(evaluation);
    }

   
    /**
     * 입찰 공고별 낙찰자 목록 조회
     */
    // @GetMapping("/{biddingId}/winning-bidders")
    // public ResponseEntity<List<BiddingEvaluationDto>> getWinningBidders(
    //         @PathVariable Long biddingId) {
    //     List<BiddingEvaluationDto> winningBidders = biddingOrderService.getWinningBidders(biddingId);
    //     return ResponseEntity.ok(winningBidders);
    // }

   
}