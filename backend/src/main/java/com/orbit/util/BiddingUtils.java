package com.orbit.util;

import org.springframework.security.core.Authentication;

import com.orbit.constant.BiddingStatus;
import com.orbit.entity.member.Member;
import com.orbit.repository.member.MemberRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.experimental.UtilityClass;

/**
 * 입찰 프로세스의 상태 전이를 위한 유틸리티 클래스
 * - 입찰, 계약, 발주의 가능한 상태 전이를 판단하고 관리
 */
@UtilityClass
public class BiddingUtils {

    /**
     * 현재 인증된 사용자의 Member 정보를 조회
     * @param authentication 현재 인증 정보
     * @param memberRepository 멤버 리포지토리
     * @return 현재 사용자의 Member 엔티티
     */
    public Member getCurrentMember(Authentication authentication, MemberRepository memberRepository) {
        if (authentication == null) {
            throw new SecurityException("인증 정보가 없습니다.");
        }
        
        String username = authentication.getName();
        return memberRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("사용자 정보를 찾을 수 없습니다: " + username));
    }
    
    /**
     * 입찰 공고 상태가 변경 가능한지 확인
     * @param fromStatus 현재 상태
     * @param toStatus 변경하려는 상태
     * @return 변경 가능 여부
     */
    public boolean isBiddingStatusChangeAllowed(String fromStatus, String toStatus) {
        // 같은 상태로의 변경은 허용하지 않음
        if (fromStatus.equals(toStatus)) {
            return false;
        }
        
        // 허용된 상태 전이 확인
        switch (fromStatus) {
            case BiddingStatus.BiddingStatusCode.PENDING:
                // 대기중 → 진행중 또는 취소로만 변경 가능
                return toStatus.equals(BiddingStatus.BiddingStatusCode.ONGOING) || 
                       toStatus.equals(BiddingStatus.BiddingStatusCode.CANCELED);
                
            case BiddingStatus.BiddingStatusCode.ONGOING:
                // 진행중 → 마감 또는 취소로만 변경 가능
                return toStatus.equals(BiddingStatus.BiddingStatusCode.CLOSED) || 
                       toStatus.equals(BiddingStatus.BiddingStatusCode.CANCELED);
                
            case BiddingStatus.BiddingStatusCode.CLOSED:
                // 마감 → 변경 불가
                return false;
                
            case BiddingStatus.BiddingStatusCode.CANCELED:
                // 취소 → 변경 불가
                return false;
                
            default:
                return false;
        }
    }
    
    /**
     * 계약 상태가 변경 가능한지 확인
     * @param fromStatus 현재 상태
     * @param toStatus 변경하려는 상태
     * @return 변경 가능 여부
     */
    public boolean isContractStatusChangeAllowed(String fromStatus, String toStatus) {
        // 같은 상태로의 변경은 허용하지 않음
        if (fromStatus.equals(toStatus)) {
            return false;
        }
        
        // 허용된 상태 전이 확인
        switch (fromStatus) {
            case BiddingStatus.BiddingContractStatusCode.DRAFT:
                // 초안 → 진행중 또는 취소로만 변경 가능
                return toStatus.equals(BiddingStatus.BiddingContractStatusCode.IN_PROGRESS) || 
                       toStatus.equals(BiddingStatus.BiddingContractStatusCode.CANCELED);
                
            case BiddingStatus.BiddingContractStatusCode.IN_PROGRESS:
                // 진행중 → 완료 또는 취소로만 변경 가능
                return toStatus.equals(BiddingStatus.BiddingContractStatusCode.CLOSED) || 
                       toStatus.equals(BiddingStatus.BiddingContractStatusCode.CANCELED);
                
            case BiddingStatus.BiddingContractStatusCode.CLOSED:
                // 완료 → 변경 불가
                return false;
                
            case BiddingStatus.BiddingContractStatusCode.CANCELED:
                // 취소 → 변경 불가
                return false;
                
            default:
                return false;
        }
    }
    
    /**
     * 특정 상태의 입찰 공고가 공급사 초대를 허용하는지 확인
     * @param status 입찰 공고 상태
     * @return 공급사 초대 가능 여부
     */
    public boolean canInviteSupplierInStatus(String status) {
        // 대기중 또는 진행중 상태에서만 공급사 초대 가능
        return BiddingStatus.BiddingStatusCode.PENDING.equals(status) || 
               BiddingStatus.BiddingStatusCode.ONGOING.equals(status);
    }
    
    /**
     * 특정 상태의 입찰 공고가 참여를 허용하는지 확인
     * @param status 입찰 공고 상태
     * @return 참여 가능 여부
     */
    public boolean canParticipateInStatus(String status) {
        // 진행중 상태에서만 참여 가능
        return BiddingStatus.BiddingStatusCode.ONGOING.equals(status);
    }
    
    /**
     * 계약 초안 생성이 가능한 입찰 공고 상태인지 확인
     * @param status 입찰 공고 상태
     * @return 계약 초안 생성 가능 여부
     */
    public boolean canCreateContractDraftInStatus(String status) {
        // 마감 상태에서만 계약 초안 생성 가능
        return BiddingStatus.BiddingStatusCode.CLOSED.equals(status);
    }
}