package com.orbit.event.listener;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import com.orbit.constant.BiddingStatus;
import com.orbit.constant.BiddingStatus.NotificationPriority;
import com.orbit.constant.BiddingStatus.NotificationType;
import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.BiddingContract;
import com.orbit.entity.bidding.BiddingParticipation;
import com.orbit.entity.member.Member;
import com.orbit.entity.notification.NotificationRequest;
import com.orbit.event.dto.BiddingStatusEventDto;
import com.orbit.event.event.BiddingStatusChangeEvent;
import com.orbit.event.event.ContractStatusChangeEvent;
import com.orbit.event.event.ParticipationEvent;
import com.orbit.repository.bidding.BiddingRepository;
import com.orbit.repository.member.MemberRepository;
import com.orbit.service.NotificationService;
import com.orbit.service.NotificationWebSocketService;
import com.orbit.service.bidding.BiddingParticipationService;
import com.orbit.service.bidding.BiddingWebSocketService;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 입찰 프로세스 관련 이벤트 리스너
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BiddingEventListener {
    private final BiddingRepository biddingRepository;
    private final MemberRepository memberRepository;
    private final BiddingWebSocketService webSocketService;
    private final NotificationWebSocketService notificationWebSocketService;
    private final BiddingParticipationService participationService;
    private final NotificationService notificationService;

    /**
     * 입찰 상태 변경 이벤트 처리
     */
    @Async
    @EventListener
    public void handleBiddingStatusChange(BiddingStatusChangeEvent event) {
        log.info("입찰 상태 변경 이벤트 수신 - 입찰 ID: {}, 변경: {} -> {}", 
                event.getBiddingId(), event.getFromStatus(), event.getToStatus());
        
        // DTO 생성
        BiddingStatusEventDto eventDTO = BiddingStatusEventDto.builder()
                .biddingId(event.getBiddingId())
                .fromStatus(event.getFromStatus())
                .toStatus(event.getToStatus())
                .changedBy(event.getChangedBy())
                .changedAt(event.getChangedAt())
                .build();

        // WebSocket으로 클라이언트에 전파
        webSocketService.sendStatusUpdateEvent(eventDTO);
        
        // 참여자들에게 상태 변경 알림 발송
        try {
            Bidding bidding = biddingRepository.findById(event.getBiddingId())
                    .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + event.getBiddingId()));
            
            participationService.sendBiddingStatusChangeNotification(bidding, event.getFromStatus());
            
            // 상태 변경에 따른 알림 처리
            sendStatusSpecificNotifications(bidding, event.getFromStatus(), event.getToStatus());
        } catch (Exception e) {
            log.error("입찰 상태 변경 알림 발송 중 오류 발생", e);
        }
    }
    
    /**
     * 계약 상태 변경 이벤트 처리
     */
    @Async
    @EventListener
    public void handleContractStatusChange(ContractStatusChangeEvent event) {
        log.info("계약 상태 변경 이벤트 수신 - 계약 ID: {}, 변경: {} -> {}", 
                event.getContractId(), event.getFromStatus(), event.getToStatus());
        
        // 계약 상태에 따른 알림 처리
        switch (event.getToStatus()) {
            case BiddingStatus.BiddingContractStatusCode.IN_PROGRESS:
                // 계약 진행 시작 알림
                sendContractInProgressNotifications(event);
                break;
                
            case BiddingStatus.BiddingContractStatusCode.CLOSED:
                // 계약 완료 알림
                sendContractCompletedNotifications(event);
                break;
                
            case BiddingStatus.BiddingContractStatusCode.CANCELED:
                // 계약 취소 알림
                sendContractCanceledNotifications(event);
                break;
        }
    }

    /**
     * 입찰 참여 이벤트 처리
     */
    @Async
    @EventListener
    public void handleParticipationEvent(ParticipationEvent event) {
        log.info("입찰 참여 이벤트 수신 - 참여 ID: {}, 이벤트 유형: {}", 
                event.getParticipationId(), event.getEventType());
        
        // 참여 정보 조회
        BiddingParticipation participation = event.getParticipation();
        Bidding bidding = participation.getBidding();
        
        // 참여 유형별 알림 처리
        switch (event.getEventType()) {
            case NEW:
                // 새로운 참여 알림
                sendNewParticipationNotifications(bidding, participation);
                break;
                
            case CONFIRMED:
                // 참여 확정 알림
                sendConfirmedParticipationNotifications(bidding, participation);
                break;
                
            case UPDATED:
                // 참여 정보 수정 알림
                sendUpdatedParticipationNotifications(bidding, participation);
                break;
                
            case WITHDRAWN:
                // 참여 철회 알림
                sendWithdrawnParticipationNotifications(bidding, participation);
                break;
        }
    }

    /**
     * 상태 변경 유형에 따른 알림 처리
     */
    private void sendStatusSpecificNotifications(Bidding bidding, String fromStatus, String toStatus) {
        switch (toStatus) {
            case BiddingStatus.BiddingStatusCode.ONGOING:
                if (BiddingStatus.BiddingStatusCode.PENDING.equals(fromStatus)) {
                    // 대기 -> 진행: 초대된 공급사들에게 알림
                    sendOngoingStatusNotifications(bidding);
                }
                break;
                
            case BiddingStatus.BiddingStatusCode.CLOSED:
                if (BiddingStatus.BiddingStatusCode.ONGOING.equals(fromStatus)) {
                    // 진행 -> 마감: 참여 공급사 및 관리자에게 알림
                    sendClosedStatusNotifications(bidding);
                }
                break;
                
            case BiddingStatus.BiddingStatusCode.CANCELED:
                // 취소 알림
                sendCanceledStatusNotifications(bidding);
                break;
        }
    }
    
    /**
     * 진행중 상태 알림
     */
    private void sendOngoingStatusNotifications(Bidding bidding) {
        // 초대된 공급사 ID 목록 추출
        List<Long> supplierIds = bidding.getSuppliers().stream()
                .map(supplier -> supplier.getSupplier().getId())
                .collect(Collectors.toList());
        
        // 공급사들에게 알림 발송
        notificationWebSocketService.sendNotificationToSuppliers(
                NotificationType.BIDDING_STARTED,
                "입찰 공고 '" + bidding.getTitle() + "'가 시작되었습니다. 참여를 검토해주세요.",
                supplierIds,
                NotificationPriority.HIGH
        );
        
        // 관리자에게 알림
        notificationWebSocketService.sendAdminNotification(
                NotificationType.BIDDING_STARTED,
                "입찰 공고 '" + bidding.getTitle() + "'가 시작되었습니다.",
                NotificationPriority.NORMAL
        );
    }
    
    /**
     * 마감 상태 알림
     */
    private void sendClosedStatusNotifications(Bidding bidding) {
        // 참여 공급사 ID 목록 추출
        List<Long> participantIds = bidding.getParticipations().stream()
                .map(BiddingParticipation::getSupplierId)
                .collect(Collectors.toList());
        
        // 참여 공급사들에게 알림 발송
        notificationWebSocketService.sendNotificationToSuppliers(
                NotificationType.BIDDING_CLOSED,
                "입찰 공고 '" + bidding.getTitle() + "'가 마감되었습니다. 결과를 기다려주세요.",
                participantIds,
                NotificationPriority.HIGH
        );
        
        // 구매 부서 대리급 이상에게 알림
        notificationWebSocketService.sendNotificationToDepartmentLevel(
                NotificationType.BIDDING_CLOSED,
                "입찰 공고 '" + bidding.getTitle() + "'가 마감되었습니다. 평가를 진행해주세요.",
                BiddingStatus.ASSISTANT_MANAGER_LEVEL,
                NotificationPriority.HIGH
        );
    }
    
    /**
     * 취소 상태 알림
     */
    private void sendCanceledStatusNotifications(Bidding bidding) {
        // 참여 공급사 ID 목록 추출
        List<Long> participantIds = bidding.getParticipations().stream()
                .map(BiddingParticipation::getSupplierId)
                .collect(Collectors.toList());
        
        // 초대된 공급사 ID 목록 추출
        List<Long> invitedIds = bidding.getSuppliers().stream()
                .map(supplier -> supplier.getSupplier().getId())
                .collect(Collectors.toList());
        
        // 모든 관련 공급사(참여 + 초대) 목록 생성
        List<Long> allSupplierIds = new java.util.ArrayList<>(participantIds);
        invitedIds.forEach(id -> {
            if (!allSupplierIds.contains(id)) {
                allSupplierIds.add(id);
            }
        });
        
        // 관련 공급사들에게 알림 발송
        notificationWebSocketService.sendNotificationToSuppliers(
                NotificationType.BIDDING_CANCELED,
                "입찰 공고 '" + bidding.getTitle() + "'가 취소되었습니다.",
                allSupplierIds,
                NotificationPriority.HIGH
        );
        
        // 관리자에게 알림
        notificationWebSocketService.sendAdminNotification(
                NotificationType.BIDDING_CANCELED,
                "입찰 공고 '" + bidding.getTitle() + "'가 취소되었습니다.",
                NotificationPriority.NORMAL
        );
    }
    
    /**
     * 계약 진행 시작 알림 발송
     */
    private void sendContractInProgressNotifications(ContractStatusChangeEvent event) {
        BiddingContract contract = event.getContract();
        
        // 계약 담당자에게 알림
        String creatorUsername = contract.getCreatedBy();
        if (creatorUsername != null && !creatorUsername.isEmpty()) {
            Member creator = memberRepository.findByUsername(creatorUsername).orElse(null);
            if (creator != null) {
                notificationWebSocketService.sendNotificationToUser(
                        NotificationType.CONTRACT_STARTED,
                        "계약 진행 시작",
                        "계약 '" + contract.getTitle() + "'의 진행이 시작되었습니다.",
                        creator.getId(),
                        NotificationPriority.NORMAL
                );
            }
        }
        
        // 공급사에게 알림
        if (contract.getSupplier() != null) {
            notificationWebSocketService.sendNotificationToUser(
                    NotificationType.CONTRACT_STARTED,
                    "계약 진행 시작",
                    "계약 '" + contract.getTitle() + "'의 진행이 시작되었습니다. 계약서를 검토하고 서명해주세요.",
                    contract.getSupplier().getId(),
                    NotificationPriority.HIGH
            );
        }
    }

    /**
     * 계약 완료 알림 발송
     */
    private void sendContractCompletedNotifications(ContractStatusChangeEvent event) {
        BiddingContract contract = event.getContract();
        
        // 구매 부서 대리급 이상에게 알림
        notificationWebSocketService.sendNotificationToDepartmentLevel(
                NotificationType.CONTRACT_COMPLETED,
                "계약 '" + contract.getTitle() + "'이 완료되었습니다. 발주를 생성할 수 있습니다.",
                BiddingStatus.ASSISTANT_MANAGER_LEVEL,
                NotificationPriority.NORMAL
        );
        
        // 공급사에게 알림
        if (contract.getSupplier() != null) {
            notificationWebSocketService.sendNotificationToUser(
                    NotificationType.CONTRACT_COMPLETED,
                    "계약 체결 완료",
                    "계약 '" + contract.getTitle() + "'이 완료되었습니다. 발주를 기다려주세요.",
                    contract.getSupplier().getId(),
                    NotificationPriority.HIGH
            );
        }
    }

    /**
     * 계약 취소 알림 발송
     */
    private void sendContractCanceledNotifications(ContractStatusChangeEvent event) {
        BiddingContract contract = event.getContract();
        
        // 구매 부서 대리급 이상에게 알림
        notificationWebSocketService.sendNotificationToDepartmentLevel(
                NotificationType.CONTRACT_CANCELED,
                "계약 '" + contract.getTitle() + "'이 취소되었습니다. 사유: " + event.getReason(),
                BiddingStatus.ASSISTANT_MANAGER_LEVEL,
                NotificationPriority.NORMAL
        );
        
        // 공급사에게 알림
        if (contract.getSupplier() != null) {
            notificationWebSocketService.sendNotificationToUser(
                    NotificationType.CONTRACT_CANCELED,
                    "계약 취소",
                    "계약 '" + contract.getTitle() + "'이 취소되었습니다. 사유: " + event.getReason(),
                    contract.getSupplier().getId(),
                    NotificationPriority.HIGH
            );
        }
    }

    /**
     * 새로운 참여 알림 발송
     */
    private void sendNewParticipationNotifications(Bidding bidding, BiddingParticipation participation) {
        // 입찰 생성자에게 알림
        String creatorUsername = bidding.getCreatedBy();
        if (creatorUsername != null && !creatorUsername.isEmpty()) {
            Member creator = memberRepository.findByUsername(creatorUsername).orElse(null);
            if (creator != null) {
                notificationWebSocketService.sendNotificationToUser(
                        NotificationType.SUPPLIER_PARTICIPATION,
                        "새로운 입찰 참여",
                        "입찰 공고 '" + bidding.getTitle() + "'에 공급사 '" + participation.getCompanyName() + "'가 참여했습니다.",
                        creator.getId(),
                        NotificationPriority.NORMAL
                );
            }
        }
        
        // 구매 부서 과장급 이상에게 알림
        notificationWebSocketService.sendNotificationToDepartmentLevel(
                NotificationType.SUPPLIER_PARTICIPATION,
                "입찰 공고 '" + bidding.getTitle() + "'에 새로운 참여가 있습니다.",
                BiddingStatus.MANAGER_LEVEL,
                NotificationPriority.NORMAL
        );
    }

    /**
     * 참여 확정 알림 발송
     */
    private void sendConfirmedParticipationNotifications(Bidding bidding, BiddingParticipation participation) {
        // 입찰 생성자에게 알림
        String creatorUsername = bidding.getCreatedBy();
        if (creatorUsername != null && !creatorUsername.isEmpty()) {
            Member creator = memberRepository.findByUsername(creatorUsername).orElse(null);
            if (creator != null) {
                notificationWebSocketService.sendNotificationToUser(
                        NotificationType.BIDDING_PARTICIPATION_CONFIRM,
                        "입찰 참여 확정",
                        "입찰 공고 '" + bidding.getTitle() + "'에 공급사 '" + participation.getCompanyName() + "'가 참여를 확정했습니다.",
                        creator.getId(),
                        NotificationPriority.NORMAL
                );
            }
        }
    }

    /**
     * 참여 정보 수정 알림 발송
     */
    private void sendUpdatedParticipationNotifications(Bidding bidding, BiddingParticipation participation) {
        // 입찰 생성자에게 알림
        String creatorUsername = bidding.getCreatedBy();
        if (creatorUsername != null && !creatorUsername.isEmpty()) {
            Member creator = memberRepository.findByUsername(creatorUsername).orElse(null);
            if (creator != null) {
                notificationWebSocketService.sendNotificationToUser(
                        NotificationType.SUPPLIER_PARTICIPATION,
                        "입찰 참여 정보 수정",
                        "입찰 공고 '" + bidding.getTitle() + "'에 공급사 '" + participation.getCompanyName() + "'가 참여 정보를 수정했습니다.",
                        creator.getId(),
                        NotificationPriority.NORMAL
                );
            }
        }
    }

    /**
     * 참여 철회 알림 발송
     */
    private void sendWithdrawnParticipationNotifications(Bidding bidding, BiddingParticipation participation) {
        // 입찰 생성자에게 알림
        String creatorUsername = bidding.getCreatedBy();
        if (creatorUsername != null && !creatorUsername.isEmpty()) {
            Member creator = memberRepository.findByUsername(creatorUsername).orElse(null);
            if (creator != null) {
                notificationWebSocketService.sendNotificationToUser(
                        NotificationType.SUPPLIER_REJECTED,
                        "입찰 참여 철회",
                        "입찰 공고 '" + bidding.getTitle() + "'에 공급사 '" + participation.getCompanyName() + "'가 참여를 철회했습니다.",
                        creator.getId(),
                        NotificationPriority.NORMAL
                );
            }
        }
    }
}