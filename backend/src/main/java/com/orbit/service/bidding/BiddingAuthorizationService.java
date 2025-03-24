package com.orbit.service.bidding;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.orbit.constant.BiddingStatus;
import com.orbit.entity.approval.Department;
import com.orbit.entity.approval.Position;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.member.Member;
import com.orbit.repository.approval.DepartmentRepository;
import com.orbit.repository.approval.PositionRepository;
import com.orbit.repository.commonCode.ChildCodeRepository;
import com.orbit.repository.commonCode.ParentCodeRepository;
import com.orbit.repository.member.MemberRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 입찰 관련 권한 확인 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BiddingAuthorizationService {
    private final MemberRepository memberRepository;
    private final DepartmentRepository departmentRepository;
    private final ParentCodeRepository parentCodeRepository;
    private final ChildCodeRepository childCodeRepository;
    private final PositionRepository positionRepository;

    /**
     * 입찰 공고 생성/수정 권한 확인
     */
    public boolean canCreateOrUpdateBidding(Member member, ChildCode statusCode) {
        if (member == null || statusCode == null) {
            return false;
        }
        
        int userLevel = member.getPosition().getLevel();
        String status = statusCode.getCodeValue();
        
        // 상태에 따른 권한 확인
        if (BiddingStatus.BiddingStatusCode.PENDING.equals(status)) {
            return userLevel >= BiddingStatus.BiddingStatusPermissions.PENDING.CREATE_MIN_LEVEL;
        } else if (BiddingStatus.BiddingStatusCode.ONGOING.equals(status)) {
            // 진행 중 상태는 수정이 제한됨
            return userLevel >= BiddingStatus.BiddingStatusPermissions.ONGOING.MODIFY_MIN_LEVEL;
        } else if (BiddingStatus.BiddingStatusCode.CLOSED.equals(status)) {
            // 마감된 상태는 조회만 가능
            return false;
        } else if (BiddingStatus.BiddingStatusCode.CANCELED.equals(status)) {
            // 취소된 상태는 조회만 가능
            return false;
        }
        
        return false;
    }
    
    /**
     * 직급에 따른 입찰 공고 상태 변경 권한 확인
     */
    public boolean canChangeBiddingStatus(Member member, String fromStatus, String toStatus) {
        if (member == null) {
            return false;
        }
        
        int userLevel = member.getPosition().getLevel();
        
        // 관리자는 항상 가능
        if (Member.Role.ADMIN.equals(member.getRole())) {
            return true;
        }
        
        // 상태 전환에 따른 권한 확인
        if (BiddingStatus.BiddingStatusCode.PENDING.equals(fromStatus)) {
            if (BiddingStatus.BiddingStatusCode.ONGOING.equals(toStatus)) {
                // 대기중 -> 진행중 변경 권한
                return userLevel >= BiddingStatus.BiddingStatusPermissions.PENDING.START_MIN_LEVEL;
            } else if (BiddingStatus.BiddingStatusCode.CANCELED.equals(toStatus)) {
                // 대기중 -> 취소 변경 권한
                return userLevel >= BiddingStatus.BiddingStatusPermissions.PENDING.CANCEL_MIN_LEVEL;
            }
        } else if (BiddingStatus.BiddingStatusCode.ONGOING.equals(fromStatus)) {
            if (BiddingStatus.BiddingStatusCode.CLOSED.equals(toStatus)) {
                // 진행중 -> 마감 변경 권한
                return userLevel >= BiddingStatus.BiddingStatusPermissions.ONGOING.CLOSE_MIN_LEVEL;
            } else if (BiddingStatus.BiddingStatusCode.CANCELED.equals(toStatus)) {
                // 진행중 -> 취소 변경 권한
                return userLevel >= BiddingStatus.BiddingStatusPermissions.ONGOING.CLOSE_MIN_LEVEL;
            }
        }
        
        // 기본적으로 상태 변경은 부장 이상만 가능하도록 제한
        return userLevel >= BiddingStatus.DIRECTOR_LEVEL;
    }
    
    /**
     * 직급에 따른 공급사 초대 권한 확인
     */
    public boolean canInviteSupplier(Member member, String status) {
        if (member == null) {
            return false;
        }
        
        int userLevel = member.getPosition().getLevel();
        
        if (BiddingStatus.BiddingStatusCode.PENDING.equals(status)) {
            return userLevel >= BiddingStatus.BiddingStatusPermissions.PENDING.INVITE_SUPPLIER_MIN_LEVEL;
        } else if (BiddingStatus.BiddingStatusCode.ONGOING.equals(status)) {
            return userLevel >= BiddingStatus.BiddingStatusPermissions.ONGOING.INVITE_SUPPLIER_MIN_LEVEL;
        }
        
        return false;
    }
    
    /**
     * 직급에 따른 낙찰자 선정 권한 확인
     */
    public boolean canSelectWinner(Member member, String status) {
        if (member == null || !BiddingStatus.BiddingStatusCode.CLOSED.equals(status)) {
            return false;
        }
        
        int userLevel = member.getPosition().getLevel();
        return userLevel >= BiddingStatus.BiddingStatusPermissions.CLOSED.SELECT_WINNER_MIN_LEVEL;
    }
    
    /**
     * 직급에 따른 계약 생성 권한 확인
     */
    public boolean canCreateContract(Member member, String status) {
        if (member == null || !BiddingStatus.BiddingStatusCode.CLOSED.equals(status)) {
            return false;
        }
        
        int userLevel = member.getPosition().getLevel();
        return userLevel >= BiddingStatus.BiddingStatusPermissions.CLOSED.CONTRACT_CREATE_MIN_LEVEL;
    }
    
    /**
     * 직급에 따른 입찰 평가 권한 확인
     */
    public boolean canEvaluateBidding(Member member, String status) {
        if (member == null || !BiddingStatus.BiddingStatusCode.CLOSED.equals(status)) {
            return false;
        }
        
        int userLevel = member.getPosition().getLevel();
        return userLevel >= BiddingStatus.BiddingStatusPermissions.CLOSED.EVALUATE_MIN_LEVEL;
    }
    
    /**
     * 계약 상태 변경 권한 확인
     */
    public boolean canChangeContractStatus(Member member) {
        if (member == null) {
            return false;
        }
        
        int userLevel = member.getPosition().getLevel();
        return userLevel >= BiddingStatus.BiddingContractStatusPermissions.CHANGE_STATUS_MIN_LEVEL;
    }
    
    /**
     * 직급에 따른 발주 생성 권한 확인
     */
    public boolean canCreateOrder(Member member) {
        if (member == null) {
            return false;
        }
        
        int userLevel = member.getPosition().getLevel();
        return userLevel >= BiddingStatus.MANAGER_LEVEL; // 과장 이상
    }
    
    /**
     * 직급에 따른 발주 승인 권한 확인
     */
    public boolean canApproveOrder(Member member) {
        if (member == null) {
            return false;
        }
        
        int userLevel = member.getPosition().getLevel();
        return userLevel >= BiddingStatus.DIRECTOR_LEVEL; // 부장 이상
    }
    
    /**
     * 입찰 참여 알림 수신 대상 목록 조회
     */
    @Transactional(readOnly = true)
    public List<Member> getBiddingParticipationNotificationRecipients() {
        // 대리 이상 직급만 알림 수신
        return memberRepository.findByPositionLevelGreaterThanEqual(BiddingStatus.ASSISTANT_MANAGER_LEVEL);
    }
    
    /**
     * 동일 부서 내 특정 직급 이상의 사용자 목록 조회
     */
    @Transactional(readOnly = true)
    public List<Member> getDepartmentMembersWithLevel(Department department, int minLevel) {
        // 직급 이상의 직급 목록 조회
        List<Position> eligiblePositions = positionRepository.findByLevelGreaterThanEqual(minLevel);
        List<Long> eligiblePositionIds = eligiblePositions.stream()
                .map(Position::getId)
                .collect(Collectors.toList());
        
        // 해당 부서에 속한 모든 멤버 조회
        List<Member> allDepartmentMembers = memberRepository.findByDepartmentId(department.getId());
        
        // 조건에 맞는 멤버만 필터링
        return allDepartmentMembers.stream()
                .filter(member -> member.getPosition() != null && 
                                 eligiblePositionIds.contains(member.getPosition().getId()))
                .collect(Collectors.toList());
    }
    
    /**
     * 구매부서 사용자 중 특정 직급 이상의 사용자 목록 조회
     */
    @Transactional(readOnly = true)
    public List<Member> getProcurementMembersWithLevel(int minLevel) {
        // 구매 관련 부서 조회
        List<Department> procurementDepartments = new ArrayList<>();
        
        // 구매부 이름으로 검색
        departmentRepository.findByName("구매부").ifPresent(procurementDepartments::add);
        
        // 구매 키워드가 들어간 부서 검색
        List<Department> departments = departmentRepository.searchDepartmentsByKeyword("구매");
        procurementDepartments.addAll(departments);
        
        // 직급 이상의 직급 목록 조회
        List<Position> eligiblePositions = positionRepository.findByLevelGreaterThanEqual(minLevel);
        List<Long> eligiblePositionIds = eligiblePositions.stream()
                .map(Position::getId)
                .collect(Collectors.toList());
        
        // 각 부서별로 적합한 직급의 사용자 목록 수집
        List<Member> result = new ArrayList<>();
        for (Department dept : procurementDepartments) {
            List<Member> deptMembers = memberRepository.findByDepartmentId(dept.getId());
            
            // 적합한 직급 필터링
            List<Member> eligibleMembers = deptMembers.stream()
                    .filter(member -> member.getPosition() != null && 
                                     eligiblePositionIds.contains(member.getPosition().getId()))
                    .collect(Collectors.toList());
            
            result.addAll(eligibleMembers);
        }
        
        return result;
    }
}