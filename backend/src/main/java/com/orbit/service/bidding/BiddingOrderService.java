package com.orbit.service.bidding;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.orbit.dto.bidding.BiddingEvaluationDto;
import com.orbit.dto.bidding.BiddingOrderDto;
import com.orbit.dto.bidding.BiddingParticipationDto;
import com.orbit.entity.bidding.BiddingEvaluation;
import com.orbit.entity.bidding.BiddingOrder;
import com.orbit.entity.bidding.BiddingParticipation;
import com.orbit.repository.bidding.BiddingEvaluationRepository;
import com.orbit.repository.bidding.BiddingOrderRepository;
import com.orbit.repository.bidding.BiddingParticipationRepository;
import com.orbit.repository.commonCode.ChildCodeRepository;
import com.orbit.repository.commonCode.ParentCodeRepository;
import com.orbit.repository.member.MemberRepository;
import com.orbit.util.BiddingNumberUtil;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class BiddingOrderService {
    private final BiddingRepository biddingRepository;
    private final BiddingParticipationRepository participationRepository;
    private final BiddingEvaluationRepository evaluationRepository;
    private final BiddingOrderRepository biddingOrderRepository;


    /**
     * 발주 번호 생성
     * (예: ORD-YYYYMMDD-XXXX)
     */
    private String generateOrderNumber() {
        LocalDateTime now = LocalDateTime.now();
        String datePart = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomPart = String.format("%04d", (int)(Math.random() * 10000));
        return "ORD-" + datePart + "-" + randomPart;
    }

    /**
     * 발주 생성
     */
    public BiddingOrderDto createOrder(BiddingOrderDto orderDto) {
        String orderNumber = generateOrderNumber();
        orderDto.setOrderNumber(orderNumber);
        
        // 낙찰자 정보 설정
        orderDto.setSelectedBidder(true);
        if (orderDto.getBidderSelectedAt() == null) {
            orderDto.setBidderSelectedAt(LocalDateTime.now());
        }
        
        // 엔티티 변환 및 저장
        BiddingOrder orderEntity = orderDto.toEntity();
        BiddingOrder savedOrder = biddingOrderRepository.save(orderEntity);
        
        // 참여 정보 업데이트 (발주 생성 표시)
        updateParticipationOrderStatus(orderDto.getBiddingParticipationId(), true);
        
        return BiddingOrderDto.fromEntity(savedOrder);
    }

    /**
     * 참여 정보 발주 상태 업데이트
     */
    private void updateParticipationOrderStatus(Long participationId, boolean isOrderCreated) {
        BiddingParticipation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new EntityNotFoundException("참여 정보를 찾을 수 없습니다. ID: " + participationId));
        
        participation.setOrderCreated(isOrderCreated);
        participationRepository.save(participation);
    }



    /**
     * 전체 발주 목록 조회
     */
    public List<BiddingOrderDto> getAllOrders() {
        List<BiddingOrder> orders = orderRepository.findAll();
        return orders.stream()
                .map(BiddingOrderDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 특정 입찰 공고의 발주 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingOrderDto> getOrdersByBiddingId(Long biddingId) {
        List<BiddingOrder> orders = orderRepository.findByBiddingId(biddingId);
        return orders.stream()
                .map(BiddingOrderDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 특정 공급사의 발주 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingOrderDto> getOrdersBySupplierId(Long supplierId) {
        List<BiddingOrder> orders = orderRepository.findBySupplierId(supplierId);
        return orders.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
    }
    
    /**
     * 발주 상세 조회
     */
    public BiddingOrderDto getOrderById(Long id) {
        BiddingOrder order = biddingOrderRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("발주 정보를 찾을 수 없습니다. ID: " + id));
        return convertToDto(order);
    }
    
    // DTO 변환 메서드
    private BiddingOrderDto convertToDto(BiddingOrder order) {
        BiddingOrderDto dto = new BiddingOrderDto();
        dto.setId(order.getId());
        dto.setOrderNumber(order.getOrderNumber());
        dto.setBiddingId(order.getBiddingId());
        dto.setBiddingParticipationId(order.getBiddingParticipationId());
        dto.setBiddingItemId(order.getBiddingItemId());
        dto.setSupplierId(order.getSupplierId());
        dto.setSupplierName(order.getSupplierName());
        dto.setSelectedBidder(order.isSelectedBidder());
        dto.setBidderSelectedAt(order.getBidderSelectedAt());
        dto.setTitle(order.getTitle());
        dto.setDescription(order.getDescription());
        dto.setQuantity(order.getQuantity());
        dto.setUnitPrice(order.getUnitPrice());
        dto.setSupplyPrice(order.getSupplyPrice());
        dto.setVat(order.getVat());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setTerms(order.getTerms());
        dto.setExpectedDeliveryDate(order.getExpectedDeliveryDate());
        dto.setEvaluationId(order.getEvaluationId());
        dto.setApprovedAt(order.getApprovedAt());
        dto.setCreatedBy(order.getCreatedBy());
        return dto;
    }
    
     /**
     * 공급자 참여 의사 확인
     */
    @Transactional
    public BiddingParticipationDto confirmSupplierParticipation(Long participationId) {
        BiddingParticipation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 참여 정보를 찾을 수 없습니다. ID: " + participationId));
        
        participation.confirmParticipation();
        participation = participationRepository.save(participation);
        
        return BiddingParticipationDto.fromEntity(participation);
    }

    /**
     * 낙찰자 선정 (최고 점수 기준)
     */
    @Transactional
    public BiddingEvaluationDto selectWinningBidder(Long biddingId) {
        // 해당 입찰의 모든 평가 중 최고 점수 평가 조회
        List<BiddingEvaluation> evaluations = evaluationRepository.findByBiddingId(biddingId);
        
        // 최고 점수 평가 찾기
        BiddingEvaluation highestScoringEvaluation = evaluations.stream()
                .max((e1, e2) -> {
                    // null 처리 및 점수 비교
                    Integer score1 = e1.getTotalScore() != null ? e1.getTotalScore() : 0;
                    Integer score2 = e2.getTotalScore() != null ? e2.getTotalScore() : 0;
                    return score1.compareTo(score2);
                })
                .orElseThrow(() -> new EntityNotFoundException("해당 입찰의 평가 정보를 찾을 수 없습니다. ID: " + biddingId));
        
        // 기존 낙찰자 초기화
        List<BiddingEvaluation> previousWinners = evaluationRepository.findByBiddingIdAndIsSelectedBidderTrue(biddingId);
        previousWinners.forEach(BiddingEvaluation::cancelSelectedBidder);
        evaluationRepository.saveAll(previousWinners);
        
        // 새 낙찰자 선정
        highestScoringEvaluation.selectAsBidder();
        highestScoringEvaluation = evaluationRepository.save(highestScoringEvaluation);
        
        return BiddingEvaluationDto.fromEntity(highestScoringEvaluation);
    }

    /**
     * 입찰 공고별 낙찰자 목록 조회
     */
    // @Transactional(readOnly = true)
    // public List<BiddingEvaluationDto> getWinningBidders(Long biddingId) {
    //     List<BiddingEvaluation> winningBidders = evaluationRepository.findByBiddingIdAndIsSelectedBidderTrue(biddingId);
        
    //     return winningBidders.stream()
    //             .map(BiddingEvaluationDto::fromEntity)
    //             .collect(Collectors.toList());
    // }


}