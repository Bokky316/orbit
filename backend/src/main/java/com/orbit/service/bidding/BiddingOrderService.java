package com.orbit.service.bidding;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.orbit.dto.bidding.BiddingDto;
import com.orbit.dto.bidding.BiddingEvaluationDto;
import com.orbit.dto.bidding.BiddingOrderDto;
import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.Bidding.BiddingStatus;
import com.orbit.entity.bidding.BiddingEvaluation;
import com.orbit.entity.bidding.BiddingOrder;
import com.orbit.entity.bidding.BiddingOrder.OrderStatus;
import com.orbit.entity.bidding.BiddingParticipation;
import com.orbit.repository.bidding.BiddingEvaluationRepository;
import com.orbit.repository.bidding.BiddingOrderRepository;
import com.orbit.repository.bidding.BiddingParticipationRepository;
import com.orbit.repository.bidding.BiddingRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class BiddingOrderService {
    
    private final BiddingOrderRepository biddingOrderRepository;
    private final BiddingRepository biddingRepository;
    private final BiddingParticipationRepository participationRepository;
    private final BiddingEvaluationRepository evaluationRepository;
    private final BiddingService biddingService;
    
    /**
     * 입찰 마감 및 자동 발주 생성
     * 마감일이 지난 입찰을 자동으로 마감하고 평가 점수가 가장 높은 참여자를 낙찰자로 선정하여 발주 생성
     */
    @Transactional
    public void processExpiredBiddings() {
        log.info("마감일이 지난 입찰 처리 시작");
        
        // 마감일이 지났지만 아직 OPEN 상태인 입찰 조회
        List<Bidding> expiredBiddings = biddingRepository.findByStatusAndEndDateBefore(
                BiddingStatus.OPEN, LocalDateTime.now());
        
        for (Bidding bidding : expiredBiddings) {
            log.info("입찰 마감 처리: BID-{}", bidding.getId());
            
            // 입찰 상태를 CLOSED로 변경
            bidding.setStatus(BiddingStatus.CLOSED);
            biddingRepository.save(bidding);
            
            // 발주가 이미 존재하는지 확인
            if (biddingOrderRepository.existsByBiddingId(bidding.getId())) {
                log.info("이미 발주가 생성된 입찰: BID-{}", bidding.getId());
                continue;
            }
            
            // 낙찰자 선정
            BiddingEvaluationDto selectedBidderEval = biddingService.selectWinningBid(bidding.getId());
            if (selectedBidderEval == null) {
                log.info("평가된 입찰 참여자가 없습니다: BID-{}", bidding.getId());
                continue;
            }
            
            try {
                // 평가에서 낙찰자로 선정 표시
                updateSelectedBidderStatus(selectedBidderEval.getId(), true);
                
                // 발주 생성
                createOrderFromBidding(bidding.getId(), selectedBidderEval.getBiddingParticipationId(), null);
                log.info("발주 자동 생성 완료: BID-{}", bidding.getId());
            } catch (Exception e) {
                log.error("발주 생성 중 오류 발생: BID-{}", bidding.getId(), e);
            }
        }
        
        log.info("마감일이 지난 입찰 처리 완료: 총 {}건", expiredBiddings.size());
    }
    
    /**
     * 낙찰자 상태 업데이트 (평가 테이블)
     */
    @Transactional
    public void updateSelectedBidderStatus(Long evaluationId, boolean isSelectedBidder) {
        BiddingEvaluation evaluation = evaluationRepository.findById(evaluationId)
                .orElseThrow(() -> new EntityNotFoundException("평가 정보를 찾을 수 없습니다. ID: " + evaluationId));
        
        if (isSelectedBidder) {
            evaluation.selectAsBidder();
        } else {
            evaluation.cancelSelectedBidder();
        }
        
        evaluationRepository.save(evaluation);
    }
    
    /**
     * 입찰 수동 마감 및 낙찰자 선정
     */
    @Transactional
    public BiddingOrderDto closeBiddingAndCreateOrder(Long biddingId, Long selectedParticipationId, Long userId) {
        log.info("입찰 수동 마감 요청: BID-{}, 낙찰자 참여 ID: {}", biddingId, selectedParticipationId);
        
        // 입찰 상태 확인
        Bidding bidding = biddingRepository.findById(biddingId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));
        
        if (bidding.getStatus() == BiddingStatus.CLOSED || bidding.getStatus() == BiddingStatus.CANCELED) {
            throw new IllegalStateException("이미 마감되었거나 취소된 입찰입니다.");
        }
        
        // 입찰 상태를 CLOSED로 변경
        bidding.setStatus(BiddingStatus.CLOSED);
        biddingRepository.save(bidding);
        
        // 선택된 평가 정보 찾기
        BiddingParticipation selectedBidder = participationRepository.findById(selectedParticipationId)
        .orElseThrow(() -> new EntityNotFoundException("입찰 참여 정보를 찾을 수 없습니다. ID: " + selectedParticipationId));

        // 공급자 정보 가져오기
        // String supplierName = ""; // 기본값
        // Supplier supplier = supplierRepository.findById(selectedBidder.getSupplierId())
        //         .orElse(null);
        // if (supplier != null) {
        //     supplierName = supplier.getName(); // 공급자 이름 가져오기
        // }
        
        // 발주 정보 설정
        BiddingOrderDto biddingOrderDto = new BiddingOrderDto();

        //biddingOrderDto.setSupplierName(supplierName); // 별도로 가져온 공급자 이름 설정

        // 발주 생성
        return createOrderFromBidding(biddingId, selectedParticipationId, userId);
    }
    
    /**
     * 입찰 정보를 바탕으로 발주 생성
     */
    @Transactional
    public BiddingOrderDto createOrderFromBidding(Long biddingId, Long selectedParticipationId, Long userId) {
        BiddingDto bidding = biddingService.getBiddingById(biddingId);
        BiddingParticipation selectedBidder = participationRepository.findById(selectedParticipationId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 참여 정보를 찾을 수 없습니다. ID: " + selectedParticipationId));
        
        // 입찰 참여자가 해당 입찰에 참여한 것인지 확인
        if (!selectedBidder.getBiddingId().equals(biddingId)) {
            throw new IllegalArgumentException("선택한 참여자는 해당 입찰에 참여하지 않았습니다.");
        }
        
        // 발주 정보 설정
        BiddingOrderDto biddingOrderDto = new BiddingOrderDto();
        biddingOrderDto.setBiddingId(biddingId);
        biddingOrderDto.setBiddingParticipationId(selectedParticipationId);
        biddingOrderDto.setBiddingItemId(selectedBidder.getBiddingItemId());
        biddingOrderDto.setSupplierId(selectedBidder.getSupplierId());
        //biddingOrderDto.setSupplierName(selectedBidder.getSupplierName());
        biddingOrderDto.setTitle(bidding.getTitle());
        biddingOrderDto.setDescription("입찰 " + bidding.getBidNumber() + "에 대한 발주");
        biddingOrderDto.setQuantity(selectedBidder.getQuantity());
        biddingOrderDto.setUnitPrice(selectedBidder.getUnitPrice());
        biddingOrderDto.setSupplyPrice(selectedBidder.getSupplyPrice());
        biddingOrderDto.setVat(selectedBidder.getVat());
        biddingOrderDto.setTotalAmount(selectedBidder.getTotalAmount());
        biddingOrderDto.setTerms(bidding.getConditions());
        
        // 낙찰자 정보 설정
        biddingOrderDto.setSelectedBidder(true);
        biddingOrderDto.setBidderSelectedAt(LocalDateTime.now());
        
        // 발주 번호 생성 (예: PO-년도-일련번호)
        String orderNumber = generateOrderNumber();
        biddingOrderDto.setOrderNumber(orderNumber);
        
        // 예상 납품일은 입찰 참여에서 설정한 납기일 또는 현재일로부터 1개월 후
        LocalDate deliveryDate = selectedBidder.getDeliveryDate();
        if (deliveryDate == null) {
            biddingOrderDto.setExpectedDeliveryDate(LocalDateTime.now().plusMonths(1).toLocalDate());
        } else {
            biddingOrderDto.setExpectedDeliveryDate(deliveryDate);
        }
        
        // 발주 상태는 초안으로 설정
        biddingOrderDto.setStatus(OrderStatus.DRAFT);
        
        // 생성자 정보
        biddingOrderDto.setCreatedBy(userId);
        
        // 엔티티 변환 및 저장
        BiddingOrder order = biddingOrderDto.toEntity();
        
        // 연관 엔티티 설정
        Bidding biddingEntity = biddingRepository.findById(biddingId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));
        order.setBidding(biddingEntity);
        
        order.setBiddingParticipation(selectedBidder);
        
        order = biddingOrderRepository.save(order);
        
        return BiddingOrderDto.fromEntity(order);
    }
    
    /**
     * 발주 번호 생성 메소드
     */
    private String generateOrderNumber() {
        String year = String.valueOf(LocalDateTime.now().getYear());
        long count = biddingOrderRepository.count() + 1;
        return String.format("PO-%s-%04d", year, count);
    }
    
    /**
     * 발주 승인
     */
    @Transactional
    public BiddingOrderDto approveOrder(Long orderId, Long approverId) {
        BiddingOrder order = getBiddingOrderById(orderId);
        
        if (order.getStatus() != OrderStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("승인 대기 상태의 발주만 승인할 수 있습니다.");
        }
        
        order.setStatus(OrderStatus.APPROVED);
        order.setApprovedBy(approverId);
        order.setApprovedAt(LocalDateTime.now());
        
        order = biddingOrderRepository.save(order);
        
        return BiddingOrderDto.fromEntity(order);
    }
    
    /**
     * 발주 진행 시작
     */
    @Transactional
    public BiddingOrderDto startOrder(Long orderId) {
        BiddingOrder order = getBiddingOrderById(orderId);
        
        if (order.getStatus() != OrderStatus.APPROVED) {
            throw new IllegalStateException("승인된 발주만 진행할 수 있습니다.");
        }
        
        order.setStatus(OrderStatus.IN_PROGRESS);
        order = biddingOrderRepository.save(order);
        
        return BiddingOrderDto.fromEntity(order);
    }
    
    /**
     * 발주 완료 처리
     */
    @Transactional
    public BiddingOrderDto completeOrder(Long orderId) {
        BiddingOrder order = getBiddingOrderById(orderId);
        
        if (order.getStatus() != OrderStatus.IN_PROGRESS) {
            throw new IllegalStateException("진행 중인 발주만 완료 처리할 수 있습니다.");
        }
        
        order.setStatus(OrderStatus.COMPLETED);
        order = biddingOrderRepository.save(order);
        
        return BiddingOrderDto.fromEntity(order);
    }
    
    /**
     * 발주 취소
     */
    @Transactional
    public BiddingOrderDto cancelOrder(Long orderId) {
        BiddingOrder order = getBiddingOrderById(orderId);
        
        if (order.getStatus() == OrderStatus.COMPLETED) {
            throw new IllegalStateException("이미 완료된 발주는 취소할 수 없습니다.");
        }
        
        order.setStatus(OrderStatus.CANCELLED);
        order = biddingOrderRepository.save(order);
        
        return BiddingOrderDto.fromEntity(order);
    }
    
    /**
     * 발주 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingOrderDto> getAllOrders() {
        List<BiddingOrder> orders = biddingOrderRepository.findAll();
        return orders.stream()
                .map(BiddingOrderDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 발주 상세 조회
     */
    @Transactional(readOnly = true)
    public BiddingOrderDto getOrderById(Long id) {
        BiddingOrder order = getBiddingOrderById(id);
        return BiddingOrderDto.fromEntity(order);
    }
    
    /**
     * 입찰별 발주 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingOrderDto> getOrdersByBiddingId(Long biddingId) {
        List<BiddingOrder> orders = biddingOrderRepository.findByBiddingId(biddingId);
        
        return orders.stream()
                .map(BiddingOrderDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 낙찰자(공급자)별 발주 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingOrderDto> getOrdersBySelectedBidder(Long supplierId) {
        List<BiddingOrder> orders = biddingOrderRepository.findBySupplierIdAndIsSelectedBidderTrue(supplierId);
        
        return orders.stream()
                .map(BiddingOrderDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 공급자별 발주 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingOrderDto> getOrdersBySupplierId(Long supplierId) {
        List<BiddingOrder> orders = biddingOrderRepository.findBySupplierId(supplierId);
        
        return orders.stream()
                .map(BiddingOrderDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 상태별 발주 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingOrderDto> getOrdersByStatus(OrderStatus status) {
        List<BiddingOrder> orders = biddingOrderRepository.findByStatus(status);
        
        return orders.stream()
                .map(BiddingOrderDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 날짜 범위로 발주 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingOrderDto> getOrdersByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        List<BiddingOrder> orders = biddingOrderRepository.findByCreatedAtBetween(startDate, endDate);
        
        return orders.stream()
                .map(BiddingOrderDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 발주 수정
     */
    @Transactional
    public BiddingOrderDto updateOrder(Long id, BiddingOrderDto orderDto) {
        BiddingOrder order = getBiddingOrderById(id);
        
        // 초안 상태만 수정 가능
        if (order.getStatus() != OrderStatus.DRAFT) {
            throw new IllegalStateException("초안 상태의 발주만 수정할 수 있습니다.");
        }
        
        // 기본 정보만 수정 가능
        order.setTitle(orderDto.getTitle());
        order.setDescription(orderDto.getDescription());
        order.setTerms(orderDto.getTerms());
        order.setExpectedDeliveryDate(orderDto.getExpectedDeliveryDate());
        
        if (orderDto.getStatus() == OrderStatus.PENDING_APPROVAL) {
            order.setStatus(OrderStatus.PENDING_APPROVAL);
        }
        
        order = biddingOrderRepository.save(order);
        
        return BiddingOrderDto.fromEntity(order);
    }
    
    /**
     * 발주 삭제 (초안 상태일 때만 가능)
     */
    @Transactional
    public void deleteOrder(Long id) {
        BiddingOrder order = getBiddingOrderById(id);
        
        if (order.getStatus() != OrderStatus.DRAFT) {
            throw new IllegalStateException("초안 상태의 발주만 삭제할 수 있습니다.");
        }
        
        biddingOrderRepository.delete(order);
    }
    
    /**
     * 특정 입찰 참여에 대한 발주 생성 여부 확인
     */
    @Transactional(readOnly = true)
    public boolean hasOrderForParticipation(Long participationId) {
        return biddingOrderRepository.existsByBiddingParticipationId(participationId);
    }
    
    /**
     * 특정 기간 내 발주의 총 금액 조회
     */
    @Transactional(readOnly = true)
    public BigDecimal getTotalOrderAmountByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return biddingOrderRepository.sumTotalAmountByCreatedAtBetweenAndStatus(
                startDate, endDate, OrderStatus.COMPLETED);
    }
    
    /**
     * 낙찰자로 선정된 발주의 총 금액 조회
     */
    @Transactional(readOnly = true)
    public BigDecimal getTotalSelectedBidderAmountByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return biddingOrderRepository.sumTotalAmountByCreatedAtBetweenAndStatusAndIsSelectedBidderTrue(
                startDate, endDate, OrderStatus.COMPLETED);
    }
    
    /**
     * ID로 BiddingOrder 엔티티 조회 (내부 사용)
     */
    private BiddingOrder getBiddingOrderById(Long id) {
        return biddingOrderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("발주를 찾을 수 없습니다. ID: " + id));
    }
}