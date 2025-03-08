package com.orbit.service;


import com.orbit.entity.member.Member;
import com.orbit.entity.state.StatusCode;
import com.orbit.entity.state.StatusHistory;
import com.orbit.entity.state.StatusTransitionRule;
import com.orbit.entity.state.SystemStatus;
import com.orbit.exception.InvalidStateTransitionException;
import com.orbit.repository.StatusCodeRepository;
import lombok.RequiredArgsConstructor;
import org.apache.catalina.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StateService {

    private final StatusCodeRepository statusCodeRepo;

    /**
     * 상태 전이 유효성 검증
     * @param current 현재 상태
     * @param target 대상 상태
     * @throws InvalidStateTransitionException 유효하지 않은 전이시 발생
     */
    @Transactional(readOnly = true)
    public void validateTransition(SystemStatus current, SystemStatus target) {
        List<StatusTransitionRule> validTransitions = statusCodeRepo
                .findValidTransitions(current.getParentCode(), current.getChildCode());

        boolean isValid = validTransitions.stream()
                .anyMatch(rule ->
                        rule.getToStatus().getParentCode().equals(target.getParentCode()) &&
                                rule.getToStatus().getChildCode().equals(target.getChildCode())
                );

        if (!isValid) {
            throw new InvalidStateTransitionException(
                    current.getFullCode(),
                    target.getFullCode()
            );
        }
    }

    /**
     * 상태 변경 실행
     * @param entityId 대상 엔티티 ID
     * @param entityType 엔티티 타입 (PROJECT, PURCHASE_REQUEST 등)
     * @param current 현재 상태
     * @param newStatus 새 상태
     * @param changedBy 변경 수행자
     * @return 생성된 상태 이력
     */
    @Transactional
    public StatusHistory changeState(
            Long entityId,
            StatusHistory.EntityType entityType,
            SystemStatus current,
            SystemStatus newStatus,
            Object changedBy
    ) {
        validateTransition(current, newStatus);

        return StatusHistory.builder()
                .entityId(entityId)
                .entityType(entityType)
                .fromStatus(current)
                .toStatus(newStatus)
                .changedBy((Member) changedBy)
                .build();
    }

    /**
     * 시스템 타입별 상태 코드 조회
     */
    public List<StatusCode> getStatusCodesBySystemType(StatusCode.SystemType systemType) {
        return statusCodeRepo.findBySystemType(systemType);
    }

    /**
     * 상위 코드 기준 상태 조회
     */
    public List<StatusCode> getStatusCodesByParent(String parentCode) {
        return statusCodeRepo.findByParent(parentCode);
    }

    /**
     * 허용 가능한 다음 상태 목록 조회
     */
    public List<StatusTransitionRule> getAllowedTransitions(SystemStatus currentStatus) {
        return statusCodeRepo.findValidTransitions(
                currentStatus.getParentCode(),
                currentStatus.getChildCode()
        );
    }
}
