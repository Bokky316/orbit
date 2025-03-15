package com.orbit.service.bidding;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.orbit.dto.bidding.BiddingDto;
import com.orbit.dto.bidding.BiddingParticipationDto;
import com.orbit.dto.bidding.BiddingSupplierDto;
import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.BiddingParticipation;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.repository.bidding.BiddingParticipationRepository;
import com.orbit.repository.bidding.BiddingRepository;
import com.orbit.repository.bidding.BiddingSupplierRepository;
import com.orbit.repository.commonCode.ChildCodeRepository;
import com.orbit.repository.commonCode.ParentCodeRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 공급업체(Supplier) 관점에서의 입찰 정보 조회를 위한 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BiddingSupplierViewService {
    private final BiddingRepository biddingRepository;
    private final BiddingParticipationRepository participationRepository;
    private final BiddingSupplierRepository supplierRepository;
    private final ParentCodeRepository parentCodeRepository;
    private final ChildCodeRepository childCodeRepository;

    /**
     * 특정 공급업체가 초대받은 모든 입찰 공고 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingDto> getInvitedBiddings(Long supplierId) {
        List<Bidding> biddings = biddingRepository.findBiddingsInvitedSupplier(supplierId);
        return biddings.stream()
                .map(BiddingDto::fromEntity)
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
                .map(BiddingDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 특정 공급업체가 참여한 입찰 공고 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingDto> getParticipatedBiddings(Long supplierId) {
        List<Bidding> biddings = biddingRepository.findBiddingsParticipatedBySupplier(supplierId);
        return biddings.stream()
                .map(BiddingDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 특정 공급업체가 낙찰받은 입찰 공고 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingDto> getWonBiddings(Long supplierId) {
        List<Bidding> biddings = biddingRepository.findBiddingsWonBySupplier(supplierId);
        return biddings.stream()
                .map(BiddingDto::fromEntity)
                .collect(Collectors.toList());
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
     * 공급업체의 초대 상태 확인
     */
    @Transactional(readOnly = true)
    public BiddingSupplierDto getInvitationStatus(Long biddingId, Long supplierId) {
        return supplierRepository.findByBiddingIdAndSupplierId(biddingId, supplierId)
                .map(BiddingSupplierDto::fromEntity)
                .orElseThrow(() -> new EntityNotFoundException("입찰 초대 정보를 찾을 수 없습니다."));
    }

    /**
     * 공급업체의 대시보드 요약 데이터 조회
     */
    // @Transactional(readOnly = true)
    // public Map<String, Object> getSupplierDashboardSummary(Long supplierId) {
    //     Map<String, Object> summary = new HashMap<>();
        
    //     // 초대된 입찰 수
    //     long invitedCount = supplierRepository.countBySupplierId(supplierId);
        
    //     // 참여한 입찰 수
    //     long participatedCount = participationRepository.countBySupplierId(supplierId);
        
    //     // 진행 중인 입찰 수
    //     ParentCode statusParent = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING", "STATUS")
    //             .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 상태 코드 그룹입니다: BIDDING_STATUS"));
        
    //     ChildCode ongoingStatus = childCodeRepository.findByParentCodeAndCodeValue(statusParent, "ONGOING")
    //             .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 상태 코드입니다: ONGOING"));
        
    //     long ongoingCount = biddingRepository.countBiddingsInvitedSupplierByStatus(supplierId, ongoingStatus);
        
    //     // 낙찰된 입찰 수
    //     long wonCount = biddingRepository.countBiddingsWonBySupplier(supplierId);
        
    //     // 최근 초대 받은 입찰 목록 (최대 5개)
    //     List<BiddingDto> recentInvitations = biddingRepository.findRecentBiddingsInvitedSupplier(supplierId, 5)
    //             .stream()
    //             .map(BiddingDto::fromEntity)
    //             .collect(Collectors.toList());
        
    //     // 마감 임박한 입찰 목록 (7일 이내, 최대 5개)
    //     LocalDateTime now = LocalDateTime.now();
    //     LocalDateTime weekLater = now.plusDays(7);
    //     List<BiddingDto> upcomingDeadlines = biddingRepository.findBiddingsInvitedSupplierWithDeadlineBetween(
    //             supplierId, now, weekLater, 5)
    //             .stream()
    //             .map(BiddingDto::fromEntity)
    //             .collect(Collectors.toList());
        
    //     // 요약 정보 설정
    //     summary.put("invitedCount", invitedCount);
    //     summary.put("participatedCount", participatedCount);
    //     summary.put("ongoingCount", ongoingCount);
    //     summary.put("wonCount", wonCount);
    //     summary.put("recentInvitations", recentInvitations);
    //     summary.put("upcomingDeadlines", upcomingDeadlines);
        
    //     return summary;
    // }
}