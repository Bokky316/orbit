package com.orbit.service.bidding;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.orbit.constant.BiddingStatus;
import com.orbit.dto.bidding.BiddingOrderDto;
import com.orbit.entity.bidding.BiddingContract;
import com.orbit.entity.bidding.BiddingOrder;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.entity.member.Member;
import com.orbit.repository.bidding.BiddingContractRepository;
import com.orbit.repository.bidding.BiddingOrderRepository;
import com.orbit.repository.commonCode.ChildCodeRepository;
import com.orbit.repository.commonCode.ParentCodeRepository;
import com.orbit.repository.member.MemberRepository;
import com.orbit.service.NotificationService;
import com.orbit.service.NotificationWebSocketService;
import com.orbit.util.BiddingNumberUtil;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 발주 처리 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BiddingOrderService {
    private final BiddingContractRepository contractRepository;
    private final BiddingOrderRepository orderRepository;
    private final MemberRepository memberRepository;
    private final ParentCodeRepository parentCodeRepository;
    private final ChildCodeRepository childCodeRepository;
    private final NotificationService notificationService;
    private final BiddingAuthorizationService authorizationService;
    private final NotificationWebSocketService notificationWebSocketService;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * 모든 발주 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingOrderDto> getAllBiddingOrders() {
        List<BiddingOrder> orders = orderRepository.findAll();
        return orders.stream()
                .map(BiddingOrderDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 특정 계약의 발주 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingOrderDto> getOrdersByContractId(Long contractId) {
        List<BiddingOrder> orders = orderRepository.findByContractId(contractId);
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
                .map(BiddingOrderDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 발주 상세 조회
     */
    @Transactional(readOnly = true)
    public BiddingOrderDto getOrderById(Long id) {
        BiddingOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("발주를 찾을 수 없습니다. ID: " + id));
        return BiddingOrderDto.fromEntity(order);
    }

    /**
     * 완료된 계약에 대한 발주 생성
     */
    @Transactional
    public BiddingOrderDto createOrder(Long contractId, BiddingOrderDto orderDto, Member currentMember) {
        log.info("발주 생성 시작 - 계약 ID: {}, 작성자: {}", contractId, currentMember.getUsername());
        
        // 계약 조회
        BiddingContract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new EntityNotFoundException("계약을 찾을 수 없습니다. ID: " + contractId));
        
        // 권한 체크
        if (!authorizationService.canCreateOrder(currentMember)) {
            log.warn("발주 생성 권한 없음 - 계약 ID: {}, 작성자: {}, 직급: {}", 
                    contractId, currentMember.getUsername(), currentMember.getPosition().getLevel());
            throw new AccessDeniedException("발주 생성은 과장 이상만 가능합니다.");
        }
        
        // 계약 상태 확인 (완료 상태인지)
        if (!"CLOSED".equals(contract.getStatusChild().getCodeValue())) {
            log.warn("완료되지 않은 계약에 대한 발주 생성 시도 - 계약 ID: {}, 상태: {}", 
                    contractId, contract.getStatusChild().getCodeValue());
            throw new IllegalStateException("완료된 계약에 대해서만 발주를 생성할 수 있습니다.");
        }
        
        // 발주 번호 생성
        String orderNumber = BiddingNumberUtil.generateOrderNumber();
        
        // 발주 엔티티 생성
        BiddingOrder order = BiddingOrder.builder()
                .orderNumber(orderNumber)
                .biddingId(contract.getBidding().getId())
                .biddingParticipationId(contract.getBiddingParticipation().getId())
                .purchaseRequestItemId(null)
                .supplierId(contract.getSupplier().getId())
                .supplierName(contract.getSupplier().getCompanyName())
                .isSelectedBidder(true)
                .title(contract.getTitle() + " 발주")
                .description(orderDto.getDescription())
                .quantity(orderDto.getQuantity() != null ? 
                        orderDto.getQuantity() : contract.getQuantity())
                .unitPrice(contract.getUnitPrice())
                .supplyPrice(contract.getSupplyPrice())
                .vat(contract.getVat())
                .totalAmount(contract.getTotalAmount())
                .terms(orderDto.getTerms())
                .expectedDeliveryDate(orderDto.getExpectedDeliveryDate() != null ? 
                        orderDto.getExpectedDeliveryDate() : LocalDate.now().plusDays(14))
                .createdBy(currentMember.getUsername())
                .build();
        
        // 초기 상태 설정 - "CREATED" 상태로 설정
        ParentCode statusParent = parentCodeRepository.findByEntityTypeAndCodeGroup("ORDER", "STATUS")
                .orElseThrow(() -> new IllegalStateException("발주 상태 코드 그룹을 찾을 수 없습니다."));
                
        ChildCode createdStatus = childCodeRepository.findByParentCodeAndCodeValue(statusParent, "CREATED")
                .orElseThrow(() -> new IllegalArgumentException("생성 상태 코드를 찾을 수 없습니다."));
                
        order.setStatusParent(statusParent);
        order.setStatusChild(createdStatus);
        
        // 발주 저장
        BiddingOrder savedOrder = orderRepository.save(order);
        log.info("발주 생성 완료 - 발주 ID: {}, 발주번호: {}", savedOrder.getId(), savedOrder.getOrderNumber());
        
        // 공급사에게 알림 발송
        notificationWebSocketService.sendNotificationToUser(
                BiddingStatus.NotificationType.ORDER_CREATED,
                "발주 알림",
                "계약 '" + contract.getTitle() + "'에 대한 발주가 생성되었습니다. 확인해주세요.",
                contract.getSupplier().getId(),
                BiddingStatus.NotificationPriority.HIGH
        );
        
        // 관리자에게 알림
        notificationWebSocketService.sendAdminNotification(
                BiddingStatus.NotificationType.ORDER_CREATED,
                "계약 '" + contract.getTitle() + "'에 대한 발주가 생성되었습니다."
        );
        
        // 구매 부서 과장 이상에게 알림
        notificationWebSocketService.sendNotificationToDepartmentLevel(
                BiddingStatus.NotificationType.ORDER_CREATED,
                "계약 '" + contract.getTitle() + "'에 대한 발주가 생성되었습니다.",
                BiddingStatus.MANAGER_LEVEL
        );
        
        return BiddingOrderDto.fromEntity(savedOrder);
    }

    /**
     * 발주 승인
     */
    @Transactional
    public BiddingOrderDto approveOrder(Long orderId, Member currentMember) {
        log.info("발주 승인 시작 - 발주 ID: {}, 승인자: {}", orderId, currentMember.getUsername());
        
        // 발주 조회
        BiddingOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("발주를 찾을 수 없습니다. ID: " + orderId));
        
        // 권한 체크
        if (!authorizationService.canApproveOrder(currentMember)) {
            log.warn("발주 승인 권한 없음 - 발주 ID: {}, 승인자: {}, 직급: {}", 
                    orderId, currentMember.getUsername(), currentMember.getPosition().getLevel());
            throw new AccessDeniedException("발주 승인은 부장 이상만 가능합니다.");
        }
        
        // 발주 상태 확인 - statusChild 대신 status 필드 사용
        if (order.getStatusChild() != null && !"CREATED".equals(order.getStatusChild().getCodeValue())) {
            log.warn("신규 상태가 아닌 발주에 대한 승인 시도 - 발주 ID: {}, 상태: {}", 
                    orderId, order.getStatusChild().getCodeValue());
            throw new IllegalStateException("신규 생성된 발주만 승인할 수 있습니다.");
        }
        
        // 상태 코드 조회 - "APPROVED" 상태로 설정
        ParentCode statusParent = parentCodeRepository.findByEntityTypeAndCodeGroup("ORDER", "STATUS")
                .orElseThrow(() -> new IllegalStateException("발주 상태 코드 그룹을 찾을 수 없습니다."));
                
        ChildCode approvedStatus = childCodeRepository.findByParentCodeAndCodeValue(statusParent, "APPROVED")
                .orElseThrow(() -> new IllegalArgumentException("승인 상태 코드를 찾을 수 없습니다."));
                
        order.setStatusParent(statusParent);
        order.setStatusChild(approvedStatus);
        
        // 승인 정보 설정
        order.approve(currentMember, notificationService, memberRepository);
        
        // 저장
        BiddingOrder savedOrder = orderRepository.save(order);
        log.info("발주 승인 완료 - 발주 ID: {}, 발주번호: {}", savedOrder.getId(), savedOrder.getOrderNumber());
        
        // 공급사에게 알림 발송
        notificationWebSocketService.sendNotificationToUser(
                BiddingStatus.NotificationType.ORDER_APPROVED,
                "발주 승인 알림",
                "발주 '" + order.getTitle() + "'가 승인되었습니다. 납품을 준비해주세요.",
                order.getSupplierId(),
                BiddingStatus.NotificationPriority.HIGH
        );
        
        // 발주 생성자에게 알림
        String creatorUsername = order.getCreatedBy();
        if (creatorUsername != null && !creatorUsername.isEmpty()) {
            Member creator = memberRepository.findByUsername(creatorUsername).orElse(null);
            if (creator != null) {
                notificationWebSocketService.sendNotificationToUser(
                        BiddingStatus.NotificationType.ORDER_APPROVED,
                        "발주 승인 알림",
                        "발주 '" + order.getTitle() + "'가 승인되었습니다.",
                        creator.getId(),
                        BiddingStatus.NotificationPriority.NORMAL
                );
            }
        }
        
        return BiddingOrderDto.fromEntity(savedOrder);
    }

    /**
     * 납품 예정일 변경
     */
    @Transactional
    public BiddingOrderDto updateDeliveryDate(Long orderId, LocalDate newDeliveryDate, Member currentMember) {
        log.info("납품 예정일 변경 시작 - 발주 ID: {}, 새 납품일: {}, 작성자: {}", 
                orderId, newDeliveryDate, currentMember.getUsername());
        
        // 발주 조회
        BiddingOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("발주를 찾을 수 없습니다. ID: " + orderId));
        
        // 권한 체크 (과장 이상)
        if (currentMember.getPosition().getLevel() < BiddingStatus.MANAGER_LEVEL) {
            log.warn("납품 예정일 변경 권한 없음 - 발주 ID: {}, 변경자: {}, 직급: {}", 
                    orderId, currentMember.getUsername(), currentMember.getPosition().getLevel());
            throw new AccessDeniedException("납품 예정일 변경은 과장 이상만 가능합니다.");
        }
        
        // 납품일 변경
        order.updateDeliveryDate(newDeliveryDate, currentMember, notificationService, memberRepository);
        
        // 저장
        BiddingOrder savedOrder = orderRepository.save(order);
        log.info("납품 예정일 변경 완료 - 발주 ID: {}, 기존: {}, 변경: {}", 
                savedOrder.getId(), order.getExpectedDeliveryDate(), newDeliveryDate);
        
        // 공급사에게 알림 발송
        notificationWebSocketService.sendNotificationToUser(
                BiddingStatus.NotificationType.CONTRACT_STATUS_CHANGED,
                "납품 예정일 변경 알림",
                String.format("발주 '%s'의 납품 예정일이 변경되었습니다.",
                        order.getTitle()),
                order.getSupplierId(),
                BiddingStatus.NotificationPriority.HIGH
        );
        
        return BiddingOrderDto.fromEntity(savedOrder);
    }

    /**
     * 발주 취소
     */
    @Transactional
    public BiddingOrderDto cancelOrder(Long orderId, String reason, Member currentMember) {
        log.info("발주 취소 시작 - 발주 ID: {}, 사유: {}, 취소자: {}", 
                orderId, reason, currentMember.getUsername());
        
        // 발주 조회
        BiddingOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("발주를 찾을 수 없습니다. ID: " + orderId));
        
        // 권한 체크 (부장 이상만 취소 가능)
        if (currentMember.getPosition().getLevel() < BiddingStatus.DIRECTOR_LEVEL) {
            log.warn("발주 취소 권한 없음 - 발주 ID: {}, 취소자: {}, 직급: {}", 
                    orderId, currentMember.getUsername(), currentMember.getPosition().getLevel());
            throw new AccessDeniedException("발주 취소는 부장 이상만 가능합니다.");
        }
        
        // 발주 상태 확인 (완료된 발주는 취소 불가)
        if (order.getStatusChild() != null && 
            ("COMPLETED".equals(order.getStatusChild().getCodeValue()) || 
             "DELIVERED".equals(order.getStatusChild().getCodeValue()))) {
            log.warn("완료 또는 배송된 발주에 대한 취소 시도 - 발주 ID: {}, 상태: {}", 
                    orderId, order.getStatusChild().getCodeValue());
            throw new IllegalStateException("완료된 발주는 취소할 수 없습니다.");
        }
        
        // 취소된 상태로 변경을 위한 상태 코드 조회
        ParentCode parentCode = parentCodeRepository.findByEntityTypeAndCodeGroup("ORDER", "STATUS")
                .orElseThrow(() -> new IllegalStateException("발주 상태 코드 그룹을 찾을 수 없습니다."));
        
        ChildCode canceledStatus = childCodeRepository.findByParentCodeAndCodeValue(parentCode, "CANCELED")
                .orElseThrow(() -> new IllegalArgumentException("취소 상태 코드를 찾을 수 없습니다."));
        
        // 상태 변경
        order.changeStatus(canceledStatus, reason, currentMember, notificationService, memberRepository);
        
        // 저장
        BiddingOrder savedOrder = orderRepository.save(order);
        log.info("발주 취소 완료 - 발주 ID: {}, 발주번호: {}", savedOrder.getId(), savedOrder.getOrderNumber());
        
        // 공급사에게 알림 발송
        notificationWebSocketService.sendNotificationToUser(
                BiddingStatus.NotificationType.CONTRACT_CANCELED,
                "발주 취소 알림",
                String.format("발주 '%s'가 취소되었습니다. 사유: %s", order.getTitle(), reason),
                order.getSupplierId(),
                BiddingStatus.NotificationPriority.HIGH
        );
        
        // 발주 생성자에게 알림
        String creatorUsername = order.getCreatedBy();
        if (creatorUsername != null && !creatorUsername.isEmpty()) {
            Member creator = memberRepository.findByUsername(creatorUsername).orElse(null);
            if (creator != null) {
                notificationWebSocketService.sendNotificationToUser(
                        BiddingStatus.NotificationType.CONTRACT_CANCELED,
                        "발주 취소 알림",
                        String.format("발주 '%s'가 취소되었습니다. 사유: %s", order.getTitle(), reason),
                        creator.getId(),
                        BiddingStatus.NotificationPriority.HIGH
                );
            }
        }
        
        // 구매 부서 대리급 이상에게 알림
        notificationWebSocketService.sendNotificationToDepartmentLevel(
                BiddingStatus.NotificationType.CONTRACT_CANCELED,
                String.format("발주 '%s'가 취소되었습니다. 사유: %s", order.getTitle(), reason),
                BiddingStatus.ASSISTANT_MANAGER_LEVEL,
                BiddingStatus.NotificationPriority.NORMAL
        );
        
        return BiddingOrderDto.fromEntity(savedOrder);
    }
    
    /**
     * 발주 상태 변경
     */
    @Transactional
    public BiddingOrderDto changeOrderStatus(Long orderId, String newStatus, String reason, Member currentMember) {
        log.info("발주 상태 변경 시작 - 발주 ID: {}, 새 상태: {}, 사유: {}, 작성자: {}", 
                orderId, newStatus, reason, currentMember.getUsername());
        
        // 발주 조회
        BiddingOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("발주를 찾을 수 없습니다. ID: " + orderId));
        
        // 권한 체크 (과장 이상만 상태 변경 가능)
        if (currentMember.getPosition().getLevel() < BiddingStatus.MANAGER_LEVEL) {
            log.warn("발주 상태 변경 권한 없음 - 발주 ID: {}, 변경자: {}, 직급: {}", 
                    orderId, currentMember.getUsername(), currentMember.getPosition().getLevel());
            throw new AccessDeniedException("발주 상태 변경은 과장 이상만 가능합니다.");
        }
        
        // 입력값 검증
        if (newStatus == null || newStatus.isEmpty()) {
            throw new IllegalArgumentException("유효한 상태 코드를 입력해주세요.");
        }
        
        // 허용된 상태 코드 목록
        List<String> allowedStatuses = List.of("CREATED", "APPROVED", "IN_PROGRESS", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELED");
        if (!allowedStatuses.contains(newStatus)) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드입니다: " + newStatus);
        }
        
        // 현재 상태가 취소나 완료면 변경 불가
        if (order.getStatusChild() != null && 
           ("CANCELED".equals(order.getStatusChild().getCodeValue()) || 
            "COMPLETED".equals(order.getStatusChild().getCodeValue()))) {
            log.warn("취소 또는 완료된 발주에 대한 상태 변경 시도 - 발주 ID: {}, 현재 상태: {}", 
                    orderId, order.getStatusChild().getCodeValue());
            throw new IllegalStateException("취소 또는 완료된 발주는 상태를 변경할 수 없습니다.");
        }
        
        // 특별한 상태 변경 처리
        if ("CANCELED".equals(newStatus)) {
            return cancelOrder(orderId, reason, currentMember);
        } else if ("APPROVED".equals(newStatus) && 
                  order.getStatusChild() != null && 
                  "CREATED".equals(order.getStatusChild().getCodeValue())) {
            return approveOrder(orderId, currentMember);
        }
        
        // 새 상태 코드 가져오기
        ParentCode parentCode = parentCodeRepository.findByEntityTypeAndCodeGroup("ORDER", "STATUS")
                .orElseThrow(() -> new IllegalStateException("발주 상태 코드 그룹을 찾을 수 없습니다."));
        
        ChildCode newStatusCode = childCodeRepository.findByParentCodeAndCodeValue(parentCode, newStatus)
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 상태 코드입니다: " + newStatus));
        
        // 발주 엔티티의 상태 변경 메서드 호출
        order.changeStatus(newStatusCode, reason, currentMember, notificationService, memberRepository);
        
        // 상태별 추가 처리
        if ("COMPLETED".equals(newStatus)) {
            order.setCompletedAt(LocalDateTime.now());
            order.setCompletedBy(currentMember.getUsername());
        } else if ("DELIVERED".equals(newStatus)) {
            order.setDeliveredAt(LocalDateTime.now());
        }
        
        // 저장
        BiddingOrder savedOrder = orderRepository.save(order);
        log.info("발주 상태 변경 완료 - 발주 ID: {}, 상태: {}", savedOrder.getId(), newStatus);
        
        return BiddingOrderDto.fromEntity(savedOrder);
    }
}