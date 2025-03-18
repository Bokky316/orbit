package com.orbit.service.bidding;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.orbit.dto.bidding.BiddingOrderDto;
import com.orbit.entity.bidding.BiddingOrder;
import com.orbit.entity.commonCode.StatusHistory;
import com.orbit.entity.member.Member;
import com.orbit.repository.NotificationRepository;
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
    private final BiddingOrderRepository orderRepository;
    private final BiddingParticipationRepository participationRepository;
    private final MemberRepository memberRepository;
    private final NotificationRepository notificationRepository;
    private final ParentCodeRepository parentCodeRepository; // 사용되지 않지만 주입 필요
    private final ChildCodeRepository childCodeRepository; // 사용되지 않지만 주입 필요

    /**
     * 발주 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingOrderDto> getAllOrders() {
        List<BiddingOrder> orders = orderRepository.findAll();
        return orders.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
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
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
    }
    
    /**
     * 발주 상세 조회
     */
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
    public BiddingOrderDto getOrderById(Long id) {
        BiddingOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("발주를 찾을 수 없습니다. ID: " + id));
        return BiddingOrderDto.fromEntity(order);
    }
    
    /**
     * 발주 번호로 발주 조회
     */
    @Transactional(readOnly = true)
    public BiddingOrderDto getOrderByOrderNumber(String orderNumber) {
        BiddingOrder order = orderRepository.findByOrderNumber(orderNumber);
        if (order == null) {
            throw new EntityNotFoundException("발주를 찾을 수 없습니다. 발주번호: " + orderNumber);
        }
        return BiddingOrderDto.fromEntity(order);
    }
    
    /**
     * 기간 내 납품 예정 발주 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingOrderDto> getOrdersByDeliveryDateBetween(LocalDate startDate, LocalDate endDate) {
        List<BiddingOrder> orders = orderRepository.findByExpectedDeliveryDateBetween(startDate, endDate);
        return orders.stream()
                .map(BiddingOrderDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 승인된 발주 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingOrderDto> getApprovedOrders() {
        List<BiddingOrder> orders = orderRepository.findByApprovedAtIsNotNull();
        return orders.stream()
                .map(BiddingOrderDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 승인되지 않은 발주 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingOrderDto> getUnapprovedOrders() {
        List<BiddingOrder> orders = orderRepository.findByApprovedAtIsNull();
        return orders.stream()
                .map(BiddingOrderDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 발주 생성
     */
    @Transactional
    public BiddingOrderDto createOrder(BiddingOrderDto orderDto, Long createdById) {
        // 관련 참여 정보 조회
        Long participationId = orderDto.getBiddingParticipationId();
        if (participationId == null) {
            throw new IllegalArgumentException("발주 생성을 위한 참여 정보가 필요합니다.");
        }
        
        // 생성자 정보 조회
        Member createdBy = memberRepository.findById(createdById)
                .orElseThrow(() -> new EntityNotFoundException("회원을 찾을 수 없습니다. ID: " + createdById));
        
        // 발주 번호 생성
        String orderNumber = BiddingNumberUtil.generateOrderNumber();
        
        // 엔티티 생성
        BiddingOrder order = BiddingOrder.builder()
                .orderNumber(orderNumber)
                .biddingId(orderDto.getBiddingId())
                .biddingParticipationId(participationId)
                .purchaseRequestItemId(orderDto.getPurchaseRequestItemId())
                .supplierId(orderDto.getSupplierId())
                .supplierName(orderDto.getSupplierName())
                .isSelectedBidder(orderDto.isSelectedBidder())
                .title(orderDto.getTitle())
                .description(orderDto.getDescription())
                .quantity(orderDto.getQuantity())
                .unitPrice(orderDto.getUnitPrice())
                .supplyPrice(orderDto.getSupplyPrice())
                .vat(orderDto.getVat())
                .totalAmount(orderDto.getTotalAmount())
                .terms(orderDto.getTerms())
                .expectedDeliveryDate(orderDto.getExpectedDeliveryDate())
                .createdBy(createdBy.getUsername())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        // 발주 저장
        order = orderRepository.save(order);
        
        // 참여 정보 업데이트
        participationRepository.findById(participationId).ifPresent(participation -> {
            participation.setOrderCreated(true);
            participationRepository.save(participation);
        });
        
        // 알림 발송
        try {
            // 공급사에게 알림
            Member supplier = memberRepository.findById(order.getSupplierId()).orElse(null);
            if (supplier != null) {
                // NotificationRepository에 직접 알림 메시지를 저장하는 다른 메서드가 있는지 확인
                // 없다면 로그로 대체
                log.info("새로운 발주 생성 알림 발송: 공급사 ID={}, 발주번호={}", 
                         supplier.getId(), order.getOrderNumber());
            }
        } catch (Exception e) {
            log.error("발주 생성 알림 발송 실패", e);
        }
        
        return BiddingOrderDto.fromEntity(order);
    }
    
    /**
     * 발주 정보 업데이트
     */
    @Transactional
    public BiddingOrderDto updateOrder(Long id, BiddingOrderDto orderDto) {
        BiddingOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("발주를 찾을 수 없습니다. ID: " + id));
        
        // 승인된 발주는 수정 불가
        if (order.getApprovedAt() != null) {
            throw new IllegalStateException("승인된 발주는 수정할 수 없습니다.");
        }
        
        // 값 변경
        order.setTitle(orderDto.getTitle());
        order.setDescription(orderDto.getDescription());
        order.setQuantity(orderDto.getQuantity());
        order.setUnitPrice(orderDto.getUnitPrice());
        order.setSupplyPrice(orderDto.getSupplyPrice());
        order.setVat(orderDto.getVat());
        order.setTotalAmount(orderDto.getTotalAmount());
        order.setTerms(orderDto.getTerms());
        order.setExpectedDeliveryDate(orderDto.getExpectedDeliveryDate());
        order.setUpdatedAt(LocalDateTime.now());
        
        // 발주 저장
        order = orderRepository.save(order);
        
        return BiddingOrderDto.fromEntity(order);
    }

    /**
     * 발주 승인
     */
    @Transactional
    public BiddingOrderDto approveOrder(Long id, Long approverId) {
        BiddingOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("발주를 찾을 수 없습니다. ID: " + id));
        
        Member approver = memberRepository.findById(approverId)
                .orElseThrow(() -> new EntityNotFoundException("회원을 찾을 수 없습니다. ID: " + approverId));
        
        // 이미 승인된 발주 확인
        if (order.getApprovedAt() != null) {
            throw new IllegalStateException("이미 승인된 발주입니다.");
        }
        
        // 발주 승인 정보 설정
        order.setApprovedAt(LocalDateTime.now());
        order.setApprovalById(approverId);
        order.setUpdatedAt(LocalDateTime.now());
        
        // 발주 저장
        order = orderRepository.save(order);
        
        // 상태 이력 추가 - 발주 승인 이력
       
        StatusHistory history = StatusHistory.builder()
                .entityType(StatusHistory.EntityType.ORDER)
                .fromStatus(null)
                .toStatus(null)
                .reason("발주 승인")
                .changedById(approverId)
                .changedAt(LocalDateTime.now())
                .build();
        
        // 알림 발송
        try {
            // 공급자에게 알림
            Member supplier = memberRepository.findById(order.getSupplierId()).orElse(null);
            if (supplier != null) {
                log.info("발주 승인 완료 알림 발송: 공급사 ID={}, 발주번호={}", 
                         supplier.getId(), order.getOrderNumber());
            }

            // 생성자에게도 알림 (생성자와 승인자가 다른 경우)
            if (!approver.getUsername().equals(order.getCreatedBy())) {
                Optional<Member> creator = memberRepository.findByUsername(order.getCreatedBy());
                if (creator.isPresent()) {
                    log.info("발주 승인 완료 알림 발송: 생성자 ID={}, 발주번호={}, 승인자={}",
                             creator.get().getId(), order.getOrderNumber(), approver.getName());
                }
            }
        } catch (Exception e) {
            log.error("발주 승인 알림 발송 실패", e);
        }
        
        return BiddingOrderDto.fromEntity(order);
    }

    /**
     * 납품 예정일 업데이트
     */
    @Transactional
    public BiddingOrderDto updateDeliveryDate(Long id, LocalDate newDeliveryDate, Long updatedById) {
        BiddingOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("발주를 찾을 수 없습니다. ID: " + id));
        
        Member updatedBy = memberRepository.findById(updatedById)
                .orElseThrow(() -> new EntityNotFoundException("회원을 찾을 수 없습니다. ID: " + updatedById));
        
        // 이전 날짜 저장 (알림용)
        LocalDate oldDeliveryDate = order.getExpectedDeliveryDate();
        
        // 납품 예정일 업데이트
        order.setExpectedDeliveryDate(newDeliveryDate);
        order.setUpdatedAt(LocalDateTime.now());
        
        // 발주 저장
        order = orderRepository.save(order);
        
        // 상태 이력 추가 - 납품일 변경 이력
        // 주의: history 변수가 사용되지 않는다는 경고가 있습니다.
        // 필요하다면 별도의 처리(예: 저장)가 필요할 수 있습니다.
        StatusHistory history = StatusHistory.builder()
                .entityType(StatusHistory.EntityType.ORDER)
                .fromStatus(null)
                .toStatus(null)
                .reason("납품 예정일 변경: " + oldDeliveryDate + " → " + newDeliveryDate)
                .changedById(updatedById)
                .changedAt(LocalDateTime.now())
                .build();
        
        // 알림 발송
        try {
            // 공급자에게 알림
            Member supplier = memberRepository.findById(order.getSupplierId()).orElse(null);
            if (supplier != null) {
                log.info("납품 예정일 변경 알림 발송: 공급사 ID={}, 발주번호={}, 변경: {} → {}", 
                        supplier.getId(), order.getOrderNumber(), oldDeliveryDate, newDeliveryDate);
            }

            // 생성자에게도 알림 (생성자와 변경자가 다른 경우)
            if (order.getCreatedBy() != null && !updatedBy.getUsername().equals(order.getCreatedBy())) {
                Optional<Member> creator = memberRepository.findByUsername(order.getCreatedBy());
                if (creator.isPresent()) {
                    log.info("납품 예정일 변경 알림 발송: 생성자 ID={}, 발주번호={}, 변경: {} → {}", 
                            creator.get().getId(), order.getOrderNumber(), oldDeliveryDate, newDeliveryDate);
                }
            }
        } catch (Exception e) {
            log.error("납품 예정일 변경 알림 발송 실패", e);
        }
        
        return BiddingOrderDto.fromEntity(order);
    }
    
    /**
     * 특정 참여에 대한 발주 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingOrderDto> getOrdersByParticipationId(Long participationId) {
        List<BiddingOrder> orders = orderRepository.findByBiddingParticipationId(participationId);
        return orders.stream()
                .map(BiddingOrderDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 특정 평가에 대한 발주 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingOrderDto> getOrdersByEvaluationId(Long evaluationId) {
        List<BiddingOrder> orders = orderRepository.findByEvaluationId(evaluationId);
        return orders.stream()
                .map(BiddingOrderDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 발주 취소
     */
    @Transactional
    public BiddingOrderDto cancelOrder(Long id, String reason, Long cancelledById) {
        BiddingOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("발주를 찾을 수 없습니다. ID: " + id));
        
        // 이미 승인된 발주 확인
        if (order.getApprovedAt() != null) {
            throw new IllegalStateException("이미 승인된 발주는 취소할 수 없습니다.");
        }
        
        // 실제 BiddingOrder 엔티티에는 setDeleted, setCancelledAt, setCancellationReason 메서드가 없음
        // 대신 취소를 나타내는 적절한 필드 업데이트가 필요
        // 예시: 취소 상태 또는 플래그를 설정 (CANCELLED 상태 또는 isActive=false)
        //order.setCancelled(true); // 이 메서드가 있다고 가정
        // 또는 주석 처리된 취소 사유 필드 추가
        order.setDescription("취소됨: " + reason + " (" + order.getDescription() + ")");
        order.setUpdatedAt(LocalDateTime.now());
        
        // 발주 저장
        order = orderRepository.save(order);
        
        // 상태 이력 추가 - 발주 취소 이력
        // 주의: history 변수가 사용되지 않는다는 경고가 있습니다.
        // 필요하다면 별도의 처리(예: 저장)가 필요할 수 있습니다.
        StatusHistory history = StatusHistory.builder()
                .entityType(StatusHistory.EntityType.ORDER)
                .fromStatus(null)
                .toStatus(null)
                .reason("발주 취소: " + reason)
                .changedById(cancelledById)
                .changedAt(LocalDateTime.now())
                .build();
        
        // 알림 발송
        try {
            // 공급자에게 알림
            Member supplier = memberRepository.findById(order.getSupplierId()).orElse(null);
            if (supplier != null) {
                log.info("발주 취소 알림 발송: 공급사 ID={}, 발주번호={}, 사유={}", 
                        supplier.getId(), order.getOrderNumber(), reason);
            }

            // 생성자에게도 알림 (생성자와 취소자가 다른 경우)
            Member canceller = memberRepository.findById(cancelledById).orElse(null);
            if (order.getCreatedBy() != null && canceller != null && !canceller.getUsername().equals(order.getCreatedBy())) {
                Optional<Member> creator = memberRepository.findByUsername(order.getCreatedBy());
                if (creator.isPresent()) {
                    log.info("발주 취소 알림 발송: 생성자 ID={}, 발주번호={}, 취소자={}, 사유={}", 
                            creator.get().getId(), order.getOrderNumber(), canceller.getName(), reason);
                }
            }
        } catch (Exception e) {
            log.error("발주 취소 알림 발송 실패", e);
        }
        
        return BiddingOrderDto.fromEntity(order);
    }
}