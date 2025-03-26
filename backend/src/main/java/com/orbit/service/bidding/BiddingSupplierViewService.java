package com.orbit.service.bidding;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.orbit.constant.BiddingStatus;
import com.orbit.dto.bidding.BiddingDto;
import com.orbit.dto.bidding.BiddingParticipationDto;
import com.orbit.dto.bidding.BiddingSupplierDto;
import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.BiddingParticipation;
import com.orbit.entity.bidding.BiddingSupplier;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.entity.member.Member;
import com.orbit.entity.notification.NotificationRequest;
import com.orbit.repository.bidding.BiddingParticipationRepository;
import com.orbit.repository.bidding.BiddingRepository;
import com.orbit.repository.bidding.BiddingSupplierRepository;
import com.orbit.repository.commonCode.ChildCodeRepository;
import com.orbit.repository.commonCode.ParentCodeRepository;
import com.orbit.repository.member.MemberRepository;
import com.orbit.repository.supplier.SupplierRegistrationRepository;
import com.orbit.service.NotificationService;
import com.orbit.util.PriceCalculator;
import com.orbit.util.PriceCalculator.PriceResult;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 공급업체(Supplier) 관점에서의 입찰 정보 조회 및 참여를 위한 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BiddingSupplierViewService {
    private final BiddingRepository biddingRepository;
    private final MemberRepository memberRepository;
    private final BiddingParticipationRepository participationRepository;
    private final BiddingSupplierRepository supplierRepository;
    private final ParentCodeRepository parentCodeRepository;
    private final ChildCodeRepository childCodeRepository;
    private final SupplierRegistrationRepository supplierRegistrationRepository;
    private final NotificationService notificationService;

    /**
     * 초대 상태 조회
     */
    @Transactional(readOnly = true)
    public BiddingSupplierDto getInvitationStatus(Long biddingId, Long supplierId) {
        Member supplier = memberRepository.findById(supplierId)
                .orElseThrow(() -> new EntityNotFoundException("공급사를 찾을 수 없습니다. ID: " + supplierId));
                
        BiddingSupplier invitation = supplierRepository.findByBiddingIdAndSupplierId(biddingId, supplierId)
                .orElseThrow(() -> new EntityNotFoundException("초대 정보를 찾을 수 없습니다."));
                
        return BiddingSupplierDto.fromEntityWithBusinessNo(invitation, supplierRegistrationRepository);
    }

    /**
     * 특정 공급업체가 초대받은 모든 입찰 공고 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingDto> getInvitedBiddings(Long supplierId) {
        List<Bidding> biddings = biddingRepository.findBiddingsInvitedSupplier(supplierId);
        return biddings.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 특정 공급업체가 초대받은 활성 상태의 입찰 공고 목록 조회 
     * (PENDING, ONGOING 상태인 입찰만)
     */
    @Transactional(readOnly = true)
    public List<BiddingDto> getActiveInvitedBiddings(Long supplierId) {
        ParentCode statusParent = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING", "STATUS")
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 상태 코드 그룹입니다: BIDDING_STATUS"));
        
        ChildCode pendingStatus = childCodeRepository.findByParentCodeAndCodeValue(statusParent, "PENDING")
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 상태 코드입니다: PENDING"));
        
        ChildCode ongoingStatus = childCodeRepository.findByParentCodeAndCodeValue(statusParent, "ONGOING")
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 상태 코드입니다: ONGOING"));
        
        List<Bidding> biddings = biddingRepository.findBiddingsInvitedSupplierByStatuses(
                supplierId, List.of(pendingStatus, ongoingStatus));
        
        return biddings.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 특정 공급업체가 참여한 입찰 공고 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingDto> getParticipatedBiddings(Long supplierId) {
        List<Bidding> biddings = biddingRepository.findBiddingsParticipatedBySupplier(supplierId);
        return biddings.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 특정 공급업체가 낙찰받은 입찰 공고 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingDto> getWonBiddings(Long supplierId) {
        List<Bidding> biddings = biddingRepository.findBiddingsWonBySupplier(supplierId);
        return biddings.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 입찰 공고 상세 정보 조회
     */
    @Transactional(readOnly = true)
    public BiddingDto getBiddingDetail(Long biddingId) {
        Bidding bidding = biddingRepository.findById(biddingId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));
        
        return convertToDto(bidding);
    }

    /**
     * 공급업체의 입찰 참여 세부 정보 조회
     */
    @Transactional(readOnly = true)
    public BiddingParticipationDto getParticipationDetail(Long biddingId, Long supplierId) {
        BiddingParticipation participation = participationRepository.findByBiddingIdAndSupplierId(biddingId, supplierId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 참여 정보를 찾을 수 없습니다."));
        
        return BiddingParticipationDto.fromEntity(participation);
    }
    
    /**
     * 공급사 초대 수락/거부 처리
     */
    @Transactional
    public BiddingSupplierDto respondToInvitation(Long biddingId, Long supplierId, boolean accept, String comment) {
        log.info("공급사 초대 응답 처리 - 입찰 ID: {}, 공급사 ID: {}, 수락여부: {}", biddingId, supplierId, accept);
        
        Bidding bidding = biddingRepository.findById(biddingId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));
        
        BiddingSupplier invitation = supplierRepository.findByBiddingIdAndSupplierId(biddingId, supplierId)
                .orElseThrow(() -> new EntityNotFoundException("초대 정보를 찾을 수 없습니다."));
        
        // 이미 응답한 경우 체크
        if (invitation.getResponseDate() != null) {
            throw new IllegalStateException("이미 응답한 초대입니다.");
        }
        
        // 현재 시간 설정
        LocalDateTime now = LocalDateTime.now();
        invitation.setResponseDate(now);
        //invitation.setAccepted(accept);
        // invitation.setComment(comment);
        
        // 저장
        invitation = supplierRepository.save(invitation);
        
        // 알림 발송 - 구매자에게
        String creatorUsername = bidding.getCreatedBy();
        if (creatorUsername != null && !creatorUsername.isEmpty()) {
            Member buyer = memberRepository.findByUsername(creatorUsername).orElse(null);
            if (buyer != null) {
                String title = accept ? "입찰 참여 수락" : "입찰 참여 거부";
                String content = String.format(
                    "입찰 공고 '%s'에 대한 공급사 '%s'의 참여 요청을 %s하였습니다.",
                    bidding.getTitle(),
                    invitation.getCompanyName(),
                    accept ? "수락" : "거부"
                );
                
                NotificationRequest notification = NotificationRequest.builder()
                    .type(BiddingStatus.NotificationType.SUPPLIER_PARTICIPATION)
                    .referenceId(bidding.getId())
                    .title(title)
                    .content(content)
                    .recipientId(buyer.getId())
                    .priority("NORMAL")
                    .build();
                
                notificationService.sendNotification(notification);
            }
        }
        
        // 수락한 경우 자동으로 참여 정보 생성 (정가제안 방식인 경우)
        if (accept && bidding.getMethodChild() != null && 
            "FIXED_PRICE".equals(bidding.getMethodChild().getCodeValue())) {
            
            // 이미 참여한 경우 확인
            if (!participationRepository.existsByBiddingIdAndSupplierId(biddingId, supplierId)) {
                createFixedPriceParticipation(bidding, supplierId);
            }
        }
        
        return BiddingSupplierDto.fromEntityWithBusinessNo(invitation, supplierRegistrationRepository);
    }
    
    /**
     * 입찰 참여 (가격제안 방식)
     */
    @Transactional
    public BiddingParticipationDto participateWithPriceSuggestion(
            Long biddingId, 
            Long supplierId, 
            BigDecimal unitPrice, 
            Integer quantity,
            String comment) {
        
        log.info("입찰 참여 처리 (가격제안) - 입찰 ID: {}, 공급사 ID: {}, 단가: {}", biddingId, supplierId, unitPrice);
        
        // 입찰 공고 조회
        Bidding bidding = biddingRepository.findById(biddingId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));
        
        // 입찰 방식 확인
        if (bidding.getMethodChild() == null || 
            !"PRICE_SUGGESTION".equals(bidding.getMethodChild().getCodeValue())) {
            throw new IllegalStateException("가격제안 방식의 입찰만 참여할 수 있습니다.");
        }
        
        // 상태 확인
        if (bidding.getStatusChild() == null || 
            !"ONGOING".equals(bidding.getStatusChild().getCodeValue())) {
            throw new IllegalStateException("진행 중인 입찰만 참여할 수 있습니다.");
        }
        
        // 공급사 확인
        Member supplier = memberRepository.findById(supplierId)
                .orElseThrow(() -> new EntityNotFoundException("공급사를 찾을 수 없습니다. ID: " + supplierId));
                
        // 이미 참여했는지 확인
        if (participationRepository.existsByBiddingIdAndSupplierId(biddingId, supplierId)) {
            throw new IllegalStateException("이미 참여한 입찰입니다.");
        }
        
        // 마감일 확인
        if (LocalDateTime.now().isAfter(bidding.getBiddingPeriod().getEndDate().atStartOfDay())) {
            throw new IllegalStateException("입찰이 마감되었습니다.");
        }
        
        // 참여 정보 생성
        BiddingParticipation participation = new BiddingParticipation();
        participation.setBidding(bidding);
        participation.setSupplierId(supplierId);
        participation.setCompanyName(supplier.getCompanyName());
        participation.setUnitPrice(unitPrice);
        participation.setQuantity(quantity != null ? quantity : bidding.getQuantity());
        // BiddingParticipation 엔티티에 setComment 메서드가 없으므로, proposalText 필드를 사용
        participation.setProposalText(comment);
        participation.setSubmittedAt(LocalDateTime.now());
        
        // 가격 계산
        if (unitPrice != null && participation.getQuantity() != null) {
            PriceResult result = PriceCalculator.calculateAll(unitPrice, participation.getQuantity());
            participation.setSupplyPrice(result.getSupplyPrice());
            participation.setVat(result.getVat());
            participation.setTotalAmount(result.getTotalAmount());
        }
        
        // 저장
        participation = participationRepository.save(participation);
        
        // 구매자에게 알림
        String creatorUsername = bidding.getCreatedBy();
        if (creatorUsername != null && !creatorUsername.isEmpty()) {
            Member buyer = memberRepository.findByUsername(creatorUsername).orElse(null);
            if (buyer != null) {
                NotificationRequest notification = NotificationRequest.builder()
                    .type(BiddingStatus.NotificationType.SUPPLIER_PARTICIPATION)
                    .referenceId(bidding.getId())
                    .title("새로운 입찰 참여")
                    .content(String.format("입찰 공고 '%s'에 공급사 '%s'가 참여했습니다.", 
                        bidding.getTitle(), supplier.getCompanyName()))
                    .recipientId(buyer.getId())
                    .priority("NORMAL")
                    .build();
                
                notificationService.sendNotification(notification);
            }
        }
        
        return BiddingParticipationDto.fromEntity(participation);
    }
    
    /**
     * 입찰 참여 수정
     */
    @Transactional
    public BiddingParticipationDto updateParticipation(
            Long participationId, 
            BigDecimal unitPrice, 
            Integer quantity,
            String comment) {
        
        log.info("입찰 참여 수정 - 참여 ID: {}, 단가: {}", participationId, unitPrice);
        
        // 참여 정보 조회
        BiddingParticipation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new EntityNotFoundException("참여 정보를 찾을 수 없습니다. ID: " + participationId));
        
        // 입찰 공고 상태 확인
        Bidding bidding = participation.getBidding();
        if (!"ONGOING".equals(bidding.getStatusChild().getCodeValue())) {
            throw new IllegalStateException("진행 중인 입찰만 수정할 수 있습니다.");
        }
        
        // 마감일 확인
        if (LocalDateTime.now().isAfter(bidding.getBiddingPeriod().getEndDate().atStartOfDay())) {
            throw new IllegalStateException("입찰이 마감되었습니다.");
        }
        
        // 수정
        if (unitPrice != null) {
            participation.setUnitPrice(unitPrice);
        }
        
        if (quantity != null) {
            participation.setQuantity(quantity);
        }
        
        if (comment != null) {
            // BiddingParticipation 엔티티에 setComment 메서드가 없으므로, proposalText 필드를 사용
            participation.setProposalText(comment);
        }
        
        // 가격 재계산
        if (participation.getUnitPrice() != null && participation.getQuantity() != null) {
            PriceResult result = PriceCalculator.calculateAll(
                participation.getUnitPrice(), participation.getQuantity());
            participation.setSupplyPrice(result.getSupplyPrice());
            participation.setVat(result.getVat());
            participation.setTotalAmount(result.getTotalAmount());
        }
        
        // 수정 시간 업데이트
        // participation.setUpdatedAt(LocalDateTime.now()); // BaseEntity에서 자동 처리됨
        
        // 저장
        participation = participationRepository.save(participation);
        
        // 구매자에게 알림
        String creatorUsername = bidding.getCreatedBy();
        if (creatorUsername != null && !creatorUsername.isEmpty()) {
            Member buyer = memberRepository.findByUsername(creatorUsername).orElse(null);
            if (buyer != null) {
                NotificationRequest notification = NotificationRequest.builder()
                    .type(BiddingStatus.NotificationType.SUPPLIER_PARTICIPATION)
                    .referenceId(bidding.getId())
                    .title("입찰 참여 정보 수정")
                    .content(String.format("입찰 공고 '%s'에 대한 공급사 '%s'의 참여 정보가 수정되었습니다.", 
                        bidding.getTitle(), participation.getCompanyName()))
                    .recipientId(buyer.getId())
                    .priority("NORMAL")
                    .build();
                
                notificationService.sendNotification(notification);
            }
        }
        
        return BiddingParticipationDto.fromEntity(participation);
    }
    
    /**
     * 입찰 참여 철회
     */
    @Transactional
    public void withdrawParticipation(Long participationId, String reason) {
        log.info("입찰 참여 철회 - 참여 ID: {}, 사유: {}", participationId, reason);
        
        // 참여 정보 조회
        BiddingParticipation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new EntityNotFoundException("참여 정보를 찾을 수 없습니다. ID: " + participationId));
        
        // 입찰 공고 상태 확인
        Bidding bidding = participation.getBidding();
        if (!"ONGOING".equals(bidding.getStatusChild().getCodeValue())) {
            throw new IllegalStateException("진행 중인 입찰만 철회할 수 있습니다.");
        }
        
        // 마감일 확인
        if (LocalDateTime.now().isAfter(bidding.getBiddingPeriod().getEndDate().atStartOfDay())) {
            throw new IllegalStateException("입찰이 마감되었습니다.");
        }
        
        // 구매자에게 알림
        String creatorUsername = bidding.getCreatedBy();
        if (creatorUsername != null && !creatorUsername.isEmpty()) {
            Member buyer = memberRepository.findByUsername(creatorUsername).orElse(null);
            if (buyer != null) {
                NotificationRequest notification = NotificationRequest.builder()
                    .type(BiddingStatus.NotificationType.SUPPLIER_REJECTED)
                    .referenceId(bidding.getId())
                    .title("입찰 참여 철회")
                    .content(String.format("입찰 공고 '%s'에 대한 공급사 '%s'의 참여가 철회되었습니다. 사유: %s", 
                        bidding.getTitle(), participation.getCompanyName(), reason))
                    .recipientId(buyer.getId())
                    .priority("NORMAL")
                    .build();
                
                notificationService.sendNotification(notification);
            }
        }
        
        // 참여 정보 삭제
        participationRepository.delete(participation);
    }
    
    /**
     * 공급업체의 대시보드 요약 데이터 조회
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getSupplierDashboardSummary(Long supplierId) {
        Map<String, Object> summary = new HashMap<>();
        
        // 초대된 입찰 수
        long invitedCount = supplierRepository.countBySupplierId(supplierId);
        
        // 참여한 입찰 수
        long participatedCount = participationRepository.countBySupplierId(supplierId);
        
        // 진행 중인 입찰 수
        ParentCode statusParent = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING", "STATUS")
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 상태 코드 그룹입니다: BIDDING_STATUS"));
        
        ChildCode ongoingStatus = childCodeRepository.findByParentCodeAndCodeValue(statusParent, "ONGOING")
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 상태 코드입니다: ONGOING"));
        
        long ongoingCount = biddingRepository.countBiddingsInvitedSupplierByStatus(supplierId, ongoingStatus);
        
        // 낙찰된 입찰 수
        long wonCount = biddingRepository.countBiddingsWonBySupplier(supplierId);
        
        // 요약 정보 설정
        summary.put("invitedCount", invitedCount);
        summary.put("participatedCount", participatedCount);
        summary.put("ongoingCount", ongoingCount);
        summary.put("wonCount", wonCount);
        
        return summary;
    }
    
//최근 입찰 참여 내역 
    @Transactional(readOnly = true)
public List<BiddingDto> getRecentParticipatedBiddings(Long supplierId, int limit) {
    List<Bidding> recent = biddingRepository.findRecentParticipatedBySupplier(supplierId, limit);
    return recent.stream()
        .map(this::convertToDto)
        .collect(Collectors.toList());
}

//성과 지표
@Transactional(readOnly = true)
public Map<String, Object> getPerformanceMetrics(Long supplierId) {
    Map<String, Object> metrics = new HashMap<>();

    long totalParticipated = participationRepository.countBySupplierId(supplierId);
    long wonCount = biddingRepository.countBiddingsWonBySupplier(supplierId);

    double winRate = totalParticipated > 0 ? (double) wonCount / totalParticipated : 0.0;

    BigDecimal totalBidValue = participationRepository.sumTotalAmountBySupplierId(supplierId);
    Double avgScore = participationRepository.averageEvaluationScoreBySupplierId(supplierId);

    metrics.put("winRate", winRate);
    metrics.put("totalBidValue", totalBidValue != null ? totalBidValue : BigDecimal.ZERO);
    metrics.put("averageBidScore", avgScore != null ? avgScore : 0.0);

    return metrics;
}

@Transactional(readOnly = true)
public List<BiddingDto> getRecentBiddings(Long supplierId) {
    List<Bidding> recent = biddingRepository.findRecentBiddingsBySupplier(supplierId, PageRequest.of(0, 5));
    return recent.stream().map(this::convertToDto).collect(Collectors.toList());
}

@Transactional(readOnly = true)
public Map<String, Object> getSupplierPerformanceMetrics(Long supplierId) {
    Map<String, Object> metrics = new HashMap<>();
    
    long totalParticipated = participationRepository.countBySupplierId(supplierId);
    long totalWon = biddingRepository.countBiddingsWonBySupplier(supplierId);
    BigDecimal totalBidValue = participationRepository.sumTotalAmountBySupplierId(supplierId);
    double averageScore = participationRepository.averageEvaluationScoreBySupplierId(supplierId);

    metrics.put("winRate", totalParticipated > 0 ? (double) totalWon / totalParticipated : 0.0);
    metrics.put("totalBidValue", totalBidValue != null ? totalBidValue : BigDecimal.ZERO);
    metrics.put("averageBidScore", averageScore);

    return metrics;
}



    // ===== 내부 메서드 =====
    
    /**
     * Bidding 엔티티를 BiddingDto로 변환
     */
    private BiddingDto convertToDto(Bidding bidding) {
        BiddingDto dto = new BiddingDto();
        
        // 기본 정보 설정
        dto.setId(bidding.getId());
        dto.setBidNumber(bidding.getBidNumber());
        dto.setTitle(bidding.getTitle());
        dto.setDescription(bidding.getDescription());
        dto.setConditions(bidding.getConditions());
        dto.setInternalNote(bidding.getInternalNote());
        dto.setQuantity(bidding.getQuantity());
        dto.setUnitPrice(bidding.getUnitPrice());
        dto.setSupplyPrice(bidding.getSupplyPrice());
        dto.setVat(bidding.getVat());
        dto.setTotalAmount(bidding.getTotalAmount());
        
        // 입찰 기간 정보 설정
        if (bidding.getBiddingPeriod() != null) {
            BiddingDto.BiddingPeriodDto periodDto = new BiddingDto.BiddingPeriodDto(
                bidding.getBiddingPeriod().getStartDate(),
                bidding.getBiddingPeriod().getEndDate()
            );
            dto.setBiddingPeriod(periodDto);
        }
        
        // 상태 코드 설정
        if (bidding.getStatusChild() != null) {
            dto.setStatus(bidding.getStatusChild().getCodeValue());
            dto.setStatusName(bidding.getStatusChild().getCodeName());
        }
        
        // 입찰 방식 코드 설정
        if (bidding.getMethodChild() != null) {
            dto.setMethod(bidding.getMethodChild().getCodeValue());
            dto.setMethodName(bidding.getMethodChild().getCodeName());
        }
        
        // 구매 요청 정보 설정
        if (bidding.getPurchaseRequest() != null) {
            dto.setPurchaseRequestId(bidding.getPurchaseRequest().getId());
            dto.setPurchaseRequestName(bidding.getPurchaseRequest().getRequestName());
        }
        
        // 첨부파일 목록 설정
        dto.setAttachmentPaths(bidding.getAttachmentPaths());
        
        // 생성 및 수정 정보 설정
        dto.setRegTime(bidding.getRegTime());
        dto.setUpdateTime(bidding.getUpdateTime());
        dto.setCreatedBy(bidding.getCreatedBy());
        dto.setModifiedBy(bidding.getModifiedBy());
        
        return dto;
    }
    
    /**
     * 정가제안 방식 입찰에 대한 참여 정보 자동 생성
     */
    private BiddingParticipation createFixedPriceParticipation(Bidding bidding, Long supplierId) {
        log.info("정가제안 방식 입찰 자동 참여 - 입찰 ID: {}, 공급사 ID: {}", bidding.getId(), supplierId);
        
        // 공급사 정보 조회
        Member supplier = memberRepository.findById(supplierId)
                .orElseThrow(() -> new EntityNotFoundException("공급사를 찾을 수 없습니다. ID: " + supplierId));
        
        // 참여 정보 생성
        BiddingParticipation participation = new BiddingParticipation();
        participation.setBidding(bidding);
        participation.setSupplierId(supplierId);
        participation.setCompanyName(supplier.getCompanyName());
        participation.setUnitPrice(bidding.getUnitPrice()); // 정가제안은 입찰 공고의 단가 사용
        participation.setQuantity(bidding.getQuantity());
        participation.setProposalText("정가제안 방식 입찰 자동 참여");
        participation.setSubmittedAt(LocalDateTime.now());
        
        // BiddingParticipation 엔티티에 setConfirmed가 아닌 confirmParticipation 메서드 사용
        participation.confirmParticipation();
        
        // 가격 계산
        if (participation.getUnitPrice() != null && participation.getQuantity() != null) {
            PriceResult result = PriceCalculator.calculateAll(
                participation.getUnitPrice(), participation.getQuantity());
            participation.setSupplyPrice(result.getSupplyPrice());
            participation.setVat(result.getVat());
            participation.setTotalAmount(result.getTotalAmount());
        }
        
        // 저장
        return participationRepository.save(participation);
    }
}