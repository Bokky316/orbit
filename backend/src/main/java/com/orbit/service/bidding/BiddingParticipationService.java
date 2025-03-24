package com.orbit.service.bidding;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.orbit.constant.BiddingStatus;
import com.orbit.dto.bidding.BiddingParticipationDto;
import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.BiddingParticipation;
import com.orbit.entity.member.Member;
import com.orbit.entity.notification.NotificationRequest;
import com.orbit.repository.bidding.BiddingParticipationRepository;
import com.orbit.repository.bidding.BiddingRepository;
import com.orbit.repository.member.MemberRepository;
import com.orbit.service.NotificationService;
import com.orbit.util.PriceCalculator;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class BiddingParticipationService {
    private final BiddingParticipationRepository participationRepository;
    private final BiddingRepository biddingRepository;
    private final MemberRepository memberRepository;
    private final NotificationService notificationService;
    private final BiddingAuthorizationService biddingAuthorizationService;

    /**
     * 입찰 참여 가능성 검증
     */
    private void validateBiddingParticipation(BiddingParticipationDto participationDto) {
        // 입찰 공고 조회
        Bidding bidding = biddingRepository.findById(participationDto.getBiddingId())
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + participationDto.getBiddingId()));
        
        // 상태 코드 확인
        if (!"ONGOING".equals(bidding.getStatusChild().getCodeValue())) {
            throw new IllegalStateException("현재 참여 가능한 상태가 아닙니다. 현재 상태: " + bidding.getStatusChild().getCodeName());
        }
        
        // 마감일 확인
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endDate = bidding.getBiddingPeriod().getEndDate().atStartOfDay();
        if (now.isAfter(endDate)) {
            throw new IllegalStateException("입찰 마감일이 지났습니다.");
        }
        
        // 중복 참여 확인
        if (participationRepository.existsByBiddingIdAndSupplierId(
                participationDto.getBiddingId(), participationDto.getSupplierId())) {
            throw new IllegalStateException("이미 참여한 입찰입니다.");
        }
    }

    /**
     * 입찰 참여 금액 계산
     */
    private void calculateParticipationPrices(BiddingParticipation participation, Bidding bidding) {
        BigDecimal unitPrice = participation.getUnitPrice();
        Integer quantity = bidding.getQuantity() != null ? bidding.getQuantity() : 1;
        
        if (unitPrice != null) {
            PriceCalculator.PriceResult result = PriceCalculator.calculateAll(unitPrice, quantity);
            
            participation.setSupplyPrice(result.getSupplyPrice());
            participation.setVat(result.getVat());
            participation.setTotalAmount(result.getTotalAmount());
        }
    }

    /**
     * 입찰 참여
     */
    @Transactional
    public BiddingParticipationDto participateInBidding(BiddingParticipationDto participationDto) {
        // 참여 가능성 검증
        validateBiddingParticipation(participationDto);
        
        // 입찰 공고 조회
        Bidding bidding = biddingRepository.findById(participationDto.getBiddingId())
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + participationDto.getBiddingId()));
        
        // 공급사 정보 조회
        Member supplier = memberRepository.findById(participationDto.getSupplierId())
                .orElseThrow(() -> new EntityNotFoundException("공급사를 찾을 수 없습니다. ID: " + participationDto.getSupplierId()));
        
        // DTO를 엔터티로 변환
        BiddingParticipation participation = participationDto.toEntity();
        participation.setBidding(bidding);
        participation.setCompanyName(supplier.getCompanyName());
        
        // 가격 계산
        calculateParticipationPrices(participation, bidding);
        
        // 참여 저장
        participation = participationRepository.save(participation);
        
        // 알림 발송 (입찰 공고 생성자에게)
        sendParticipationNotification(bidding, supplier);
        
        return BiddingParticipationDto.fromEntity(participation);
    }

    /**
     * 입찰 참여 알림 발송
     */
    private void sendParticipationNotification(Bidding bidding, Member supplier) {
        try {
            // 알림 수신 대상 조회
            List<Member> notificationRecipients = 
                biddingAuthorizationService.getBiddingParticipationNotificationRecipients();
    
            // 각 수신자에게 알림 발송
            for (Member recipient : notificationRecipients) {
                NotificationRequest request = NotificationRequest.builder()
                        .type(BiddingStatus.NotificationType.SUPPLIER_PARTICIPATION)
                        .referenceId(bidding.getId())
                        .title("새로운 입찰 참여")
                        .content(supplier.getCompanyName() + " 공급사가 입찰 공고 '" + bidding.getTitle() + "'에 참여했습니다.")
                        .recipientId(recipient.getId())
                        .priority("NORMAL")
                        .build();
                
                notificationService.sendNotification(request);
            }
        } catch (Exception e) {
            log.error("입찰 참여 알림 발송 실패", e);
        }
    }

    /**
     * 공급사별 입찰 참여 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingParticipationDto> getSupplierParticipations(Long supplierId) {
        List<BiddingParticipation> participations = participationRepository.findBySupplierId(supplierId);
        
        return participations.stream()
                .map(BiddingParticipationDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 입찰 공고별 참여 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingParticipationDto> getBiddingParticipations(Long biddingId) {
        List<BiddingParticipation> participations = participationRepository.findByBiddingId(biddingId);
        
        return participations.stream()
                .map(BiddingParticipationDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 참여 의사 확인
     */
    @Transactional
    public BiddingParticipationDto confirmParticipation(Long participationId) {
        BiddingParticipation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 참여 정보를 찾을 수 없습니다. ID: " + participationId));
        
        participation.confirmParticipation();
        participation = participationRepository.save(participation);
        
        // 입찰 공고 생성자에게 알림 발송
        sendParticipationConfirmationNotification(participation);
        
        return BiddingParticipationDto.fromEntity(participation);
    }

    /**
     * 참여 의사 확인 알림 발송
     */
    private void sendParticipationConfirmationNotification(BiddingParticipation participation) {
        try {
            Bidding bidding = participation.getBidding();
            Member creator = memberRepository.findByUsername(bidding.getCreatedBy())
                    .orElse(null);
            
            if (creator != null) {
                NotificationRequest request = NotificationRequest.builder()
                        .type(BiddingStatus.NotificationType.BIDDING_PARTICIPATION_CONFIRM)
                        .referenceId(bidding.getId())
                        .title("입찰 참여 의사 확인")
                        .content(participation.getCompanyName() + " 공급사가 입찰 공고 '" + bidding.getTitle() + "'에 대한 참여를 확정했습니다.")
                        .recipientId(creator.getId())
                        .priority("NORMAL")
                        .build();
                
                notificationService.sendNotification(request);
            }
        } catch (Exception e) {
            log.error("참여 의사 확인 알림 발송 실패", e);
        }
    }

    /**
 * 입찰 상태 변경에 따른 알림 발송
 */
public void sendBiddingStatusChangeNotification(Bidding bidding, String previousStatus) {
    try {
        String currentStatus = bidding.getStatusChild().getCodeValue();
        String notificationType;
        String title;
        String content;

        switch (currentStatus) {
            case "ONGOING":
                notificationType = BiddingStatus.NotificationType.BIDDING_STARTED;
                title = "입찰 공고 진행 시작";
                content = "입찰 공고 '" + bidding.getTitle() + "'이 진행 상태로 변경되었습니다.";
                break;
            case "CLOSED":
                notificationType = BiddingStatus.NotificationType.BIDDING_CLOSED;
                title = "입찰 공고 마감";
                content = "입찰 공고 '" + bidding.getTitle() + "'이 마감되었습니다.";
                break;
            case "CANCELED":
                notificationType = BiddingStatus.NotificationType.BIDDING_CANCELED;
                title = "입찰 공고 취소";
                content = "입찰 공고 '" + bidding.getTitle() + "'이 취소되었습니다.";
                break;
            default:
                return;
        }

        // 참여 공급사들에게 알림
        List<BiddingParticipation> participants = participationRepository.findByBiddingId(bidding.getId());
        
        for (BiddingParticipation participant : participants) {
            NotificationRequest request = NotificationRequest.builder()
                    .type(notificationType)
                    .referenceId(bidding.getId())
                    .title(title)
                    .content(content)
                    .recipientId(participant.getSupplierId())
                    .priority("NORMAL")
                    .build();
            
            notificationService.sendNotification(request);
        }
    } catch (Exception e) {
        log.error("입찰 상태 변경 알림 발송 실패", e);
    }
}
}