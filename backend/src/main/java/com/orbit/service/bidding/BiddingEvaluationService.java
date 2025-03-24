package com.orbit.service.bidding;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.orbit.dto.bidding.BiddingDto;
import com.orbit.constant.BiddingStatus;
import com.orbit.constant.BiddingStatus.NotificationType;
import com.orbit.dto.bidding.BiddingContractDto;
import com.orbit.dto.bidding.BiddingEvaluationDto;
import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.BiddingContract;
import com.orbit.entity.bidding.BiddingEvaluation;
import com.orbit.entity.bidding.BiddingParticipation;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.entity.member.Member;
import com.orbit.entity.notification.NotificationRequest;
import com.orbit.repository.bidding.BiddingEvaluationRepository;
import com.orbit.repository.bidding.BiddingParticipationRepository;
import com.orbit.repository.bidding.BiddingRepository;
import com.orbit.repository.commonCode.ChildCodeRepository;
import com.orbit.repository.commonCode.ParentCodeRepository;
import com.orbit.repository.member.MemberRepository;
import com.orbit.service.NotificationService;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class BiddingEvaluationService {
    private final BiddingRepository biddingRepository;
    private final BiddingParticipationRepository participationRepository;
    private final BiddingEvaluationRepository evaluationRepository;
    private final MemberRepository memberRepository;
    private final NotificationService notificationService;
    private final BiddingContractService contractService;
    private final ParentCodeRepository parentCodeRepository;
    private final ChildCodeRepository childCodeRepository;

    /**
     * 입찰 공고 마감
     */
    @Transactional
    public BiddingDto closeBidding(Long biddingId, Member currentMember) {
        log.info("입찰 공고 마감 처리 - ID: {}, 처리자: {}", biddingId, currentMember.getUsername());
        
        Bidding bidding = biddingRepository.findById(biddingId)
            .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));

        // 권한 체크
        checkClosePermission(currentMember, bidding);
        
        // 상태 검증 (대기중 또는 진행중인 상태만 마감 가능)
        String currentStatus = bidding.getStatusChild().getCodeValue();
        if (!currentStatus.equals(BiddingStatus.BiddingStatusCode.PENDING) && 
            !currentStatus.equals(BiddingStatus.BiddingStatusCode.ONGOING)) {
            throw new IllegalStateException("대기중 또는 진행중인 입찰만 마감할 수 있습니다. 현재 상태: " + currentStatus);
        }

        // 상태를 마감으로 변경
        bidding.setStatusChild(getClosedStatus());
        bidding.setClosedAt(LocalDateTime.now());
        bidding.setClosedBy(currentMember.getUsername());
        
        // 입찰 저장
        bidding = biddingRepository.save(bidding);

        // 모든 참여 공급사에게 마감 알림
        sendClosingNotifications(bidding);
        
        return BiddingDto.fromEntity(bidding);
    }

    /**
     * 입찰 참여에 대한 평가 생성
     */
    @Transactional
    public BiddingEvaluationDto createEvaluation(Long biddingId, Long participationId, Long evaluatorId) {
        log.info("입찰 참여 평가 생성 - 입찰 ID: {}, 참여 ID: {}, 평가자 ID: {}", biddingId, participationId, evaluatorId);
        
        // 입찰 공고 검증
        Bidding bidding = biddingRepository.findById(biddingId)
            .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));
        
        // 입찰 상태 검증 (마감 상태인지)
        if (!bidding.getStatusChild().getCodeValue().equals(BiddingStatus.BiddingStatusCode.CLOSED)) {
            throw new IllegalStateException("마감된 입찰만 평가할 수 있습니다.");
        }
        
        // 참여 정보 검증
        BiddingParticipation participation = participationRepository.findById(participationId)
            .orElseThrow(() -> new EntityNotFoundException("입찰 참여 정보를 찾을 수 없습니다. ID: " + participationId));
        
        // 평가자 정보 검증
        Member evaluator = memberRepository.findById(evaluatorId)
            .orElseThrow(() -> new EntityNotFoundException("평가자 정보를 찾을 수 없습니다. ID: " + evaluatorId));
        
        // 중복 평가 검증
        List<BiddingEvaluation> existingEvaluations = evaluationRepository
            .findByBiddingParticipationId(participationId);
        
        for (BiddingEvaluation existing : existingEvaluations) {
            if (existing.getEvaluatorId().equals(evaluatorId)) {
                throw new IllegalStateException("이미 평가한 참여 정보입니다.");
            }
        }
        
        // 공급사 정보 조회
        Member supplier = memberRepository.findById(participation.getSupplierId())
            .orElseThrow(() -> new EntityNotFoundException("공급사 정보를 찾을 수 없습니다. ID: " + participation.getSupplierId()));
        
        // 평가 정보 생성
        BiddingEvaluation evaluation = BiddingEvaluation.builder()
            .participation(participation)
            .biddingParticipationId(participationId)
            .biddingId(biddingId)
            .evaluatorId(evaluatorId)
            .evaluatorName(evaluator.getName())
            .supplierName(supplier.getName())
            .priceScore(0)        // 초기값 설정
            .qualityScore(0)      // 초기값 설정
            .deliveryScore(0)     // 초기값 설정
            .reliabilityScore(0)  // 초기값 설정
            .serviceScore(0)      // 초기값 설정
            .additionalScore(0)   // 초기값 설정
            .comment("")
            .isSelectedBidder(false)
            .selectedForOrder(false)
            .build();
        
        // 저장
        evaluation = evaluationRepository.save(evaluation);
        
        return BiddingEvaluationDto.fromEntity(evaluation);
    }

    /**
     * 평가 점수 업데이트
     */
    @Transactional
    public BiddingEvaluationDto updateEvaluation(Long evaluationId, BiddingEvaluationDto evaluationDto) {
        log.info("평가 점수 업데이트 - ID: {}", evaluationId);
        
        // 평가 정보 조회
        BiddingEvaluation evaluation = evaluationRepository.findById(evaluationId)
            .orElseThrow(() -> new EntityNotFoundException("평가 정보를 찾을 수 없습니다. ID: " + evaluationId));
        
        // 입찰 ID를 final 변수로 선언
        final Long biddingId = evaluation.getBiddingId();
        
        // 입찰 상태 검증
        Bidding bidding = biddingRepository.findById(biddingId)
            .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));
        
        if (!bidding.getStatusChild().getCodeValue().equals(BiddingStatus.BiddingStatusCode.CLOSED)) {
            throw new IllegalStateException("마감된 입찰만 평가할 수 있습니다.");
        }
        
        // 낙찰자로 선정된 경우 점수 수정 불가
        if (evaluation.getIsSelectedBidder()) {
            throw new IllegalStateException("이미 낙찰자로 선정된 평가는 수정할 수 없습니다.");
        }
        
        // 점수 업데이트
        evaluation.setPriceScore(evaluationDto.getPriceScore());
        evaluation.setQualityScore(evaluationDto.getQualityScore());
        evaluation.setDeliveryScore(evaluationDto.getDeliveryScore());
        evaluation.setReliabilityScore(evaluationDto.getReliabilityScore());
        evaluation.setServiceScore(evaluationDto.getServiceScore());
        evaluation.setAdditionalScore(evaluationDto.getAdditionalScore());
        evaluation.setComment(evaluationDto.getComment());
        
        // 저장 (총점은 엔티티 내에서 자동 계산됨)
        evaluation = evaluationRepository.save(evaluation);
        
        return BiddingEvaluationDto.fromEntity(evaluation);
    }

    /**
     * 낙찰자 선정
     */
    @Transactional
    public BiddingEvaluationDto selectWinner(Long biddingId, Member currentMember) {
        log.info("낙찰자 선정 처리 - 입찰 ID: {}, 처리자: {}", biddingId, currentMember.getUsername());
        
        // 입찰 공고 조회
        Bidding bidding = biddingRepository.findById(biddingId)
            .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));
        
        // 권한 체크
        checkSelectWinnerPermission(currentMember, bidding);
        
        // 입찰 상태 검증 (마감 상태인지)
        if (!bidding.getStatusChild().getCodeValue().equals(BiddingStatus.BiddingStatusCode.CLOSED)) {
            throw new IllegalStateException("마감된 입찰만 낙찰자를 선정할 수 있습니다.");
        }
        
        // 이미 낙찰자가 선정되었는지 확인
        List<BiddingEvaluation> selectedBidders = evaluationRepository.findByBiddingIdAndIsSelectedBidderTrue(biddingId);
        if (!selectedBidders.isEmpty()) {
            throw new IllegalStateException("이미 낙찰자가 선정되었습니다.");
        }

        // 평가된 모든 참여 정보 조회
        List<BiddingEvaluation> evaluations = evaluationRepository.findTopByBiddingIdOrderByTotalScoreDesc(biddingId);
        
        if (evaluations.isEmpty()) {
            throw new IllegalStateException("평가된 공급사가 없습니다.");
        }

        // 최고 점수 공급사 선정
        final BiddingEvaluation winnerEvaluation = evaluations.get(0);
        
        // 낙찰자로 선정
        winnerEvaluation.selectAsBidder(notificationService, memberRepository);
        
        // 낙찰자 평가 정보 저장
        BiddingEvaluation savedEvaluation = evaluationRepository.save(winnerEvaluation);
        
        // 계약 초안 생성
        BiddingContractDto contractDto = createContractDraft(bidding, savedEvaluation, currentMember);
        
        // 다른 참여 공급사들에게 결과 알림
        sendWinnerNotifications(bidding, savedEvaluation);
        
        return BiddingEvaluationDto.fromEntity(savedEvaluation);
    }


    /**
     * 낙찰자 선정 취소
     */
    @Transactional
    public BiddingEvaluationDto cancelSelectedBidder(Long evaluationId) {
        log.info("낙찰자 선정 취소 - 평가 ID: {}", evaluationId);
        
        // 평가 정보 조회
        BiddingEvaluation evaluation = evaluationRepository.findById(evaluationId)
            .orElseThrow(() -> new EntityNotFoundException("평가 정보를 찾을 수 없습니다. ID: " + evaluationId));
        
        // 낙찰자로 선정되었는지 확인
        if (!evaluation.getIsSelectedBidder()) {
            throw new IllegalStateException("낙찰자로 선정되지 않은 평가입니다.");
        }
        
        // 낙찰자 선정 취소
        evaluation.cancelSelectedBidder();
        
        // 저장
        evaluation = evaluationRepository.save(evaluation);
        
        // 관련 계약 찾기 및 취소 처리
        cancelRelatedContract(evaluation.getBiddingId(), evaluation.getParticipation().getSupplierId());
        
        // 취소 알림
        sendCancelSelectionNotifications(evaluation);
        
        return BiddingEvaluationDto.fromEntity(evaluation);
    }
    

    /**
     * 모든 평가 목록 조회
     */
    public List<BiddingEvaluationDto> getAllEvaluations() {
        List<BiddingEvaluation> evaluations = evaluationRepository.findAll();
        return evaluations.stream()
            .map(BiddingEvaluationDto::fromEntity)
            .collect(Collectors.toList());
    }

    /**
     * 특정 입찰 공고의 평가 목록 조회
     */
    public List<BiddingEvaluationDto> getEvaluationsByBiddingId(Long biddingId) {
        List<BiddingEvaluation> evaluations = evaluationRepository.findByBiddingId(biddingId);
        return evaluations.stream()
                .map(BiddingEvaluationDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 특정 참여에 대한 평가 목록 조회
     */
    public List<BiddingEvaluationDto> getEvaluationsByParticipationId(Long participationId) {
        List<BiddingEvaluation> evaluations = evaluationRepository.findByBiddingParticipationId(participationId);
        return evaluations.stream()
                .map(BiddingEvaluationDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 특정 평가자의 평가 목록 조회
     */
    public List<BiddingEvaluationDto> getEvaluationsByEvaluatorId(Long evaluatorId) {
        List<BiddingEvaluation> evaluations = evaluationRepository.findByEvaluatorId(evaluatorId);
        return evaluations.stream()
                .map(BiddingEvaluationDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 평가 상세 조회
     */
    public BiddingEvaluationDto getEvaluationById(Long id) {
        BiddingEvaluation evaluation = evaluationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("평가 정보를 찾을 수 없습니다. ID: " + id));
        return BiddingEvaluationDto.fromEntity(evaluation);
    }

    /**
     * 점수별 평가 목록 조회 (내림차순)
     */
    public List<BiddingEvaluationDto> getTopEvaluationsByBiddingId(Long biddingId) {
        List<BiddingEvaluation> evaluations = evaluationRepository.findTopByBiddingIdOrderByTotalScoreDesc(biddingId);
        return evaluations.stream()
                .map(BiddingEvaluationDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 낙찰된 평가 목록 조회
     */
    public List<BiddingEvaluationDto> getSelectedBiddersByBiddingId(Long biddingId) {
        List<BiddingEvaluation> evaluations = evaluationRepository.findByBiddingIdAndIsSelectedBidderTrue(biddingId);
        return evaluations.stream()
                .map(BiddingEvaluationDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 특정 공급사의 평가 목록 조회
     */
    public List<BiddingEvaluationDto> getEvaluationsBySupplier(Long supplierId) {
        List<BiddingEvaluation> evaluations = evaluationRepository.findEvaluationsBySupplier(supplierId);
        return evaluations.stream()
                .map(BiddingEvaluationDto::fromEntity)
                .collect(Collectors.toList());
    }

    // ============= 내부 메서드 =============

    /**
     * 계약 초안 생성
     */
    private BiddingContractDto createContractDraft(Bidding bidding, BiddingEvaluation winnerEvaluation, Member currentMember) {
        log.info("계약 초안 생성 - 입찰 ID: {}, 평가 ID: {}", bidding.getId(), winnerEvaluation.getId());
        
        BiddingParticipation participation = winnerEvaluation.getParticipation();
        
        if (participation == null) {
            // 참여 정보가 누락된 경우 다시 조회
            participation = participationRepository.findById(winnerEvaluation.getBiddingParticipationId())
                .orElseThrow(() -> new EntityNotFoundException(
                    "입찰 참여 정보를 찾을 수 없습니다. ID: " + winnerEvaluation.getBiddingParticipationId()));
        }
        
        // 계약 초안 생성
        return contractService.createContractDraft(bidding.getId(), participation.getId(), currentMember);
    }

    /**
     * 관련 계약 취소
     */
    private void cancelRelatedContract(Long biddingId, Long supplierId) {
        log.info("관련 계약 취소 - 입찰 ID: {}, 공급사 ID: {}", biddingId, supplierId);
        
        // TODO: contractService에 입찰 ID와 공급사 ID로 계약 조회 기능이 있다면 활용
        // 예: List<BiddingContract> contracts = contractService.getContractsByBiddingIdAndSupplierId(biddingId, supplierId);
        
        // 구현 예시 (실제 메서드 구현에 맞게 수정 필요)
        // if (!contracts.isEmpty()) {
        //     // 첫 번째 계약만 취소 처리
        //     BiddingContract contract = contracts.get(0);
        //     contractService.cancelContract(contract.getId(), "낙찰자 선정 취소로 인한 계약 취소", currentMember);
        // }
    }

    /**
     * 입찰 마감 알림 발송
     */
    private void sendClosingNotifications(Bidding bidding) {
        List<BiddingParticipation> participations = 
            participationRepository.findByBiddingId(bidding.getId());

        // 모든 참여 공급사에게 마감 알림
        participations.forEach(participation -> {
            final Long supplierId = participation.getSupplierId();
            notificationService.sendNotification(
                NotificationRequest.builder()
                    .type(NotificationType.BIDDING_CLOSED)
                    .referenceId(bidding.getId())
                    .title("입찰 공고 마감")
                    .content("'" + bidding.getTitle() + "' 입찰 공고가 마감되었습니다.")
                    .recipientId(supplierId)
                    .priority("NORMAL")
                    .build()
            );
        });
    }

    /**
     * 낙찰자 및 다른 참여자들에게 알림 발송
     */
    private void sendWinnerNotifications(Bidding bidding, BiddingEvaluation winnerEvaluation) {
        List<BiddingParticipation> participations = 
            participationRepository.findByBiddingId(bidding.getId());

        participations.forEach(participation -> {
            boolean isWinner = participation.getId().equals(winnerEvaluation.getBiddingParticipationId());
            
            notificationService.sendNotification(
                NotificationRequest.builder()
                    .type(isWinner ? 
                        NotificationType.BIDDING_WINNER_SELECTED : 
                        NotificationType.BIDDING_RESULT)
                    .referenceId(bidding.getId())
                    .title(isWinner ? "낙찰 선정" : "입찰 결과")
                    .content(isWinner ? 
                        "귀사가 '" + bidding.getTitle() + "' 입찰에서 낙찰되었습니다." :
                        "'" + bidding.getTitle() + "' 입찰 결과, 다른 공급사가 낙찰되었습니다.")
                    .recipientId(participation.getSupplierId())
                    .priority(isWinner ? "HIGH" : "NORMAL")
                    .build()
            );
        });
    }

    /**
     * 낙찰자 선정 취소 알림 발송
     */
    private void sendCancelSelectionNotifications(BiddingEvaluation evaluation) {
        // 입찰 정보 조회
        Bidding bidding = biddingRepository.findById(evaluation.getBiddingId())
            .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + evaluation.getBiddingId()));
            
        // 참여 정보 확인
        BiddingParticipation participation = evaluation.getParticipation();
        if (participation == null) {
            participation = participationRepository.findById(evaluation.getBiddingParticipationId())
                .orElseThrow(() -> new EntityNotFoundException("입찰 참여 정보를 찾을 수 없습니다."));
        }
        
        // 공급사에게 낙찰 취소 알림
        notificationService.sendNotification(
            NotificationRequest.builder()
                .type("BIDDING_SELECTION_CANCELED") // 적절한 타입으로 변경
                .referenceId(bidding.getId())
                .title("낙찰 선정 취소")
                .content("'" + bidding.getTitle() + "' 입찰에서 귀사의 낙찰 선정이 취소되었습니다.")
                .recipientId(participation.getSupplierId())
                .priority("HIGH")
                .build()
        );
    }

    /**
     * 마감 상태 코드 조회
     */
    private ChildCode getClosedStatus() {
        ParentCode statusParent = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING", "STATUS")
            .orElseThrow(() -> new IllegalStateException("상태 코드 그룹을 찾을 수 없습니다."));

        return childCodeRepository.findByParentCodeAndCodeValue(statusParent, "CLOSED")
            .orElseThrow(() -> new IllegalStateException("마감 상태 코드를 찾을 수 없습니다."));
    }

    /**
     * 입찰 마감 권한 확인
     */
    private void checkClosePermission(Member member, Bidding bidding) {
        // 입찰 작성자 또는 관리자만 마감 가능
        if (!bidding.getCreatedBy().equals(member.getUsername()) && 
            member.getPosition().getLevel() < BiddingStatus.BiddingStatusPermissions.ONGOING.CLOSE_MIN_LEVEL) {
            throw new IllegalStateException("입찰 공고를 마감할 권한이 없습니다.");
        }
    }

    /**
     * 낙찰자 선정 권한 확인
     */
    private void checkSelectWinnerPermission(Member member, Bidding bidding) {
        // 입찰 작성자 또는 충분한 권한을 가진 사용자만 낙찰자 선정 가능
        if (!bidding.getCreatedBy().equals(member.getUsername()) && 
            member.getPosition().getLevel() < BiddingStatus.BiddingStatusPermissions.CLOSED.SELECT_WINNER_MIN_LEVEL) {
            throw new IllegalStateException("낙찰자를 선정할 권한이 없습니다.");
        }
    }
}