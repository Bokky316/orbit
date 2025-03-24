package com.orbit.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.orbit.constant.BiddingStatus;
import com.orbit.entity.approval.Department;
import com.orbit.entity.approval.Position;
import com.orbit.entity.member.Member;
import com.orbit.entity.notification.NotificationRequest;
import com.orbit.repository.approval.DepartmentRepository;
import com.orbit.repository.approval.PositionRepository;
import com.orbit.repository.member.MemberRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * WebSocket을 사용한 실시간 알림 전송 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationWebSocketService {
    private final NotificationService notificationService;
    private final MemberRepository memberRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;

    /**
     * 관리자에게 알림 전송 (기본 우선순위)
     */
    public void sendAdminNotification(String notificationType, String content) {
        sendAdminNotification(notificationType, content, BiddingStatus.NotificationPriority.NORMAL);
    }

    /**
     * 관리자에게 알림 전송 (우선순위 지정)
     */
    public void sendAdminNotification(String notificationType, String content, String priority) {
        log.info("관리자 알림 전송 - 유형: {}, 내용: {}, 우선순위: {}", notificationType, content, priority);
        
        // 모든 멤버를 조회하고 ADMIN 역할을 가진 멤버만 필터링
        List<Member> allMembers = memberRepository.findAll();
        List<Member> admins = allMembers.stream()
                .filter(member -> member.getRole() == Member.Role.ADMIN)
                .collect(Collectors.toList());
        
        log.debug("알림 대상 관리자 수: {}", admins.size());
        
        for (Member admin : admins) {
            NotificationRequest request = new NotificationRequest();
            request.setType(notificationType);
            request.setTitle("관리자 알림");
            request.setContent(content);
            request.setRecipientId(admin.getId());
            request.setPriority(priority);
            
            try {
                notificationService.sendNotification(request);
            } catch (Exception e) {
                log.error("관리자 알림 전송 실패 - 수신자: {}, 오류: {}", admin.getUsername(), e.getMessage(), e);
            }
        }
    }

    /**
     * 모든 부서의 특정 직급 이상 사용자에게 알림 전송 (기본 우선순위)
     */
    public void sendNotificationToDepartmentLevel(String notificationType, String content, int minLevel) {
        sendNotificationToDepartmentLevel(notificationType, content, minLevel, BiddingStatus.NotificationPriority.NORMAL);
    }

    /**
     * 모든 부서의 특정 직급 이상 사용자에게 알림 전송 (우선순위 지정)
     */
    public void sendNotificationToDepartmentLevel(String notificationType, String content, int minLevel, String priority) {
        log.info("직급별 알림 전송 - 유형: {}, 내용: {}, 최소직급: {}, 우선순위: {}", 
                notificationType, content, minLevel, priority);
        
        // 모든 부서 조회
        List<Department> departments = departmentRepository.findAll();
        log.debug("알림 대상 부서 수: {}", departments.size());
        
        // 직급 레벨 이상의 직급 목록 조회
        List<Position> eligiblePositions = positionRepository.findByLevelGreaterThanEqual(minLevel);
        List<Long> eligiblePositionIds = eligiblePositions.stream()
                .map(Position::getId)
                .collect(Collectors.toList());
        
        for (Department department : departments) {
            // 각 부서별로 모든 멤버 조회
            List<Member> allDepartmentMembers = memberRepository.findByDepartmentId(department.getId());
            
            // 조건에 맞는 멤버만 필터링
            List<Member> users = allDepartmentMembers.stream()
                    .filter(member -> member.getPosition() != null && 
                                     eligiblePositionIds.contains(member.getPosition().getId()))
                    .collect(Collectors.toList());
            
            log.debug("알림 대상 사용자 수 (부서: {}, 직급: {}): {}", department.getName(), minLevel, users.size());
            
            for (Member user : users) {
                NotificationRequest request = new NotificationRequest();
                request.setType(notificationType);
                request.setTitle(department.getName() + " 부서 알림");
                request.setContent(content);
                request.setRecipientId(user.getId());
                request.setPriority(priority);
                
                try {
                    notificationService.sendNotification(request);
                } catch (Exception e) {
                    log.error("부서 알림 전송 실패 - 부서: {}, 수신자: {}, 오류: {}", 
                            department.getName(), user.getUsername(), e.getMessage(), e);
                }
            }
        }
    }
    
    /**
     * 특정 부서의 특정 직급 이상 사용자에게 알림 전송 (기본 우선순위)
     */
    public void sendNotificationToDepartment(String notificationType, String content, Long departmentId, int minLevel) {
        sendNotificationToDepartment(notificationType, content, departmentId, minLevel, BiddingStatus.NotificationPriority.NORMAL);
    }

    /**
     * 특정 부서의 특정 직급 이상 사용자에게 알림 전송 (우선순위 지정)
     */
    public void sendNotificationToDepartment(String notificationType, String content, Long departmentId, int minLevel, String priority) {
        log.info("특정 부서 알림 전송 - 유형: {}, 내용: {}, 부서ID: {}, 최소직급: {}, 우선순위: {}", 
                notificationType, content, departmentId, minLevel, priority);
        
        // 부서 조회
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new IllegalArgumentException("부서를 찾을 수 없습니다: " + departmentId));
        
        // 직급 레벨 이상의 직급 목록 조회
        List<Position> eligiblePositions = positionRepository.findByLevelGreaterThanEqual(minLevel);
        List<Long> eligiblePositionIds = eligiblePositions.stream()
                .map(Position::getId)
                .collect(Collectors.toList());
                
        // 해당 부서에 속한 모든 멤버 조회
        List<Member> allDepartmentMembers = memberRepository.findByDepartmentId(departmentId);
        
        // 조건에 맞는 멤버만 필터링
        List<Member> users = allDepartmentMembers.stream()
                .filter(member -> member.getPosition() != null && 
                                 eligiblePositionIds.contains(member.getPosition().getId()))
                .collect(Collectors.toList());
        
        log.debug("알림 대상 사용자 수: {}", users.size());
        
        for (Member user : users) {
            NotificationRequest request = new NotificationRequest();
            request.setType(notificationType);
            request.setTitle(department.getName() + " 부서 알림");
            request.setContent(content);
            request.setRecipientId(user.getId());
            request.setPriority(priority);
            
            try {
                notificationService.sendNotification(request);
            } catch (Exception e) {
                log.error("부서 알림 전송 실패 - 부서: {}, 수신자: {}, 오류: {}", 
                        department.getName(), user.getUsername(), e.getMessage(), e);
            }
        }
    }

    /**
     * 공급사에게 알림 전송 (기본 우선순위)
     */
    public void sendNotificationToSuppliers(String notificationType, String content, List<Long> supplierIds) {
        sendNotificationToSuppliers(notificationType, content, supplierIds, BiddingStatus.NotificationPriority.NORMAL);
    }

    /**
     * 공급사에게 알림 전송 (우선순위 지정)
     */
    public void sendNotificationToSuppliers(String notificationType, String content, List<Long> supplierIds, String priority) {
        log.info("공급사 알림 전송 - 유형: {}, 내용: {}, 공급사 수: {}, 우선순위: {}", 
                notificationType, content, supplierIds.size(), priority);
        
        // 공급사 목록 조회
        List<Member> suppliers = memberRepository.findAllById(supplierIds);
        log.debug("조회된 공급사 수: {}", suppliers.size());
        
        // 찾지 못한 공급사 ID 로깅
        if (suppliers.size() < supplierIds.size()) {
            List<Long> foundIds = suppliers.stream().map(Member::getId).collect(Collectors.toList());
            List<Long> notFoundIds = supplierIds.stream()
                    .filter(id -> !foundIds.contains(id))
                    .collect(Collectors.toList());
            log.warn("일부 공급사를 찾을 수 없습니다: {}", notFoundIds);
        }
        
        for (Member supplier : suppliers) {
            NotificationRequest request = new NotificationRequest();
            request.setType(notificationType);
            request.setTitle("공급사 알림");
            request.setContent(content);
            request.setRecipientId(supplier.getId());
            request.setPriority(priority);
            
            try {
                notificationService.sendNotification(request);
            } catch (Exception e) {
                log.error("공급사 알림 전송 실패 - 공급사: {}, 오류: {}", 
                        supplier.getCompanyName(), e.getMessage(), e);
            }
        }
    }
    
    /**
     * 특정 사용자에게 알림 전송 (기본 우선순위)
     */
    public void sendNotificationToUser(String notificationType, String title, String content, Long userId) {
        sendNotificationToUser(notificationType, title, content, userId, BiddingStatus.NotificationPriority.NORMAL);
    }
    
    /**
     * 특정 사용자에게 알림 전송 (우선순위 지정)
     */
    public void sendNotificationToUser(String notificationType, String title, String content, Long userId, String priority) {
        log.info("사용자 알림 전송 - 유형: {}, 제목: {}, 내용: {}, 사용자ID: {}, 우선순위: {}", 
                notificationType, title, content, userId, priority);
        
        NotificationRequest request = new NotificationRequest();
        request.setType(notificationType);
        request.setTitle(title);
        request.setContent(content);
        request.setRecipientId(userId);
        request.setPriority(priority);
        
        try {
            notificationService.sendNotification(request);
        } catch (Exception e) {
            log.error("사용자 알림 전송 실패 - 사용자ID: {}, 오류: {}", userId, e.getMessage(), e);
        }
    }
    
    /**
     * 특정 부서의 특정 역할을 가진 사용자에게 알림 전송
     */
    public void sendNotificationToDepartmentRole(String notificationType, String content, 
                                               Long departmentId, Member.Role role, String priority) {
        log.info("부서별 역할 알림 전송 - 유형: {}, 내용: {}, 부서ID: {}, 역할: {}, 우선순위: {}", 
                notificationType, content, departmentId, role, priority);
        
        // 부서 조회
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new IllegalArgumentException("부서를 찾을 수 없습니다: " + departmentId));
        
        // 해당 부서에 속한 모든 멤버 조회
        List<Member> allDepartmentMembers = memberRepository.findByDepartmentId(departmentId);
        
        // 조건에 맞는 멤버만 필터링
        List<Member> users = allDepartmentMembers.stream()
                .filter(member -> member.getRole() == role)
                .collect(Collectors.toList());
        
        log.debug("알림 대상 사용자 수: {}", users.size());
        
        for (Member user : users) {
            NotificationRequest request = new NotificationRequest();
            request.setType(notificationType);
            request.setTitle(department.getName() + " " + role.name() + " 알림");
            request.setContent(content);
            request.setRecipientId(user.getId());
            request.setPriority(priority);
            
            try {
                notificationService.sendNotification(request);
            } catch (Exception e) {
                log.error("부서별 역할 알림 전송 실패 - 부서: {}, 역할: {}, 수신자: {}, 오류: {}", 
                        department.getName(), role, user.getUsername(), e.getMessage(), e);
            }
        }
    }
}