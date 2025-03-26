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

    private boolean isValidRecipient(Member member) {
        return member != null && member.getId() != null;
    }

    public void sendAdminNotification(String notificationType, String content) {
        sendAdminNotification(notificationType, content, BiddingStatus.NotificationPriority.NORMAL);
    }

    public void sendAdminNotification(String notificationType, String content, String priority) {
        log.info("관리자 알림 전송 - 유형: {}, 내용: {}, 우선순위: {}", notificationType, content, priority);

        List<Member> admins = memberRepository.findAll().stream()
                .filter(member -> member.getRole() == Member.Role.ADMIN)
                .filter(this::isValidRecipient)
                .collect(Collectors.toList());

        log.debug("알림 대상 관리자 수: {}", admins.size());

        for (Member admin : admins) {
            NotificationRequest request = NotificationRequest.builder()
                    .type(notificationType)
                    .title("관리자 알림")
                    .content(content)
                    .recipientId(admin.getId())
                    .priority(priority)
                    .build();

            try {
                notificationService.sendNotification(request);
            } catch (Exception e) {
                log.error("관리자 알림 전송 실패 - 수신자: {}, 오류: {}", admin.getUsername(), e.getMessage(), e);
            }
        }
    }

    public void sendNotificationToDepartmentLevel(String notificationType, String content, int minLevel) {
        sendNotificationToDepartmentLevel(notificationType, content, minLevel, BiddingStatus.NotificationPriority.NORMAL);
    }

    public void sendNotificationToDepartmentLevel(String notificationType, String content, int minLevel, String priority) {
        log.info("직급별 알림 전송 - 유형: {}, 내용: {}, 최소직급: {}, 우선순위: {}", 
                notificationType, content, minLevel, priority);

        List<Department> departments = departmentRepository.findAll();
        List<Long> eligiblePositionIds = positionRepository.findByLevelGreaterThanEqual(minLevel).stream()
                .map(Position::getId)
                .collect(Collectors.toList());

        for (Department department : departments) {
            List<Member> users = memberRepository.findByDepartmentId(department.getId()).stream()
                    .filter(member -> member.getPosition() != null && eligiblePositionIds.contains(member.getPosition().getId()))
                    .filter(this::isValidRecipient)
                    .collect(Collectors.toList());

            for (Member user : users) {
                NotificationRequest request = NotificationRequest.builder()
                        .type(notificationType)
                        .title(department.getName() + " 부서 알림")
                        .content(content)
                        .recipientId(user.getId())
                        .priority(priority)
                        .build();

                try {
                    notificationService.sendNotification(request);
                } catch (Exception e) {
                    log.error("부서 알림 전송 실패 - 부서: {}, 수신자: {}, 오류: {}", 
                            department.getName(), user.getUsername(), e.getMessage(), e);
                }
            }
        }
    }

    public void sendNotificationToDepartment(String notificationType, String content, Long departmentId, int minLevel) {
        sendNotificationToDepartment(notificationType, content, departmentId, minLevel, BiddingStatus.NotificationPriority.NORMAL);
    }

    public void sendNotificationToDepartment(String notificationType, String content, Long departmentId, int minLevel, String priority) {
        log.info("특정 부서 알림 전송 - 유형: {}, 내용: {}, 부서ID: {}, 최소직급: {}, 우선순위: {}", 
                notificationType, content, departmentId, minLevel, priority);

        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new IllegalArgumentException("부서를 찾을 수 없습니다: " + departmentId));

        List<Long> eligiblePositionIds = positionRepository.findByLevelGreaterThanEqual(minLevel).stream()
                .map(Position::getId)
                .collect(Collectors.toList());

        List<Member> users = memberRepository.findByDepartmentId(departmentId).stream()
                .filter(member -> member.getPosition() != null && eligiblePositionIds.contains(member.getPosition().getId()))
                .filter(this::isValidRecipient)
                .collect(Collectors.toList());

        for (Member user : users) {
            NotificationRequest request = NotificationRequest.builder()
                    .type(notificationType)
                    .title(department.getName() + " 부서 알림")
                    .content(content)
                    .recipientId(user.getId())
                    .priority(priority)
                    .build();

            try {
                notificationService.sendNotification(request);
            } catch (Exception e) {
                log.error("부서 알림 전송 실패 - 부서: {}, 수신자: {}, 오류: {}", 
                        department.getName(), user.getUsername(), e.getMessage(), e);
            }
        }
    }

    public void sendNotificationToSuppliers(String notificationType, String content, List<Long> supplierIds) {
        sendNotificationToSuppliers(notificationType, content, supplierIds, BiddingStatus.NotificationPriority.NORMAL);
    }

    public void sendNotificationToSuppliers(String notificationType, String content, List<Long> supplierIds, String priority) {
        log.info("공급사 알림 전송 - 유형: {}, 내용: {}, 공급사 수: {}, 우선순위: {}", 
                notificationType, content, supplierIds.size(), priority);

        List<Member> suppliers = memberRepository.findAllById(supplierIds).stream()
                .filter(this::isValidRecipient)
                .collect(Collectors.toList());

        for (Member supplier : suppliers) {
            NotificationRequest request = NotificationRequest.builder()
                    .type(notificationType)
                    .title("공급사 알림")
                    .content(content)
                    .recipientId(supplier.getId())
                    .priority(priority)
                    .build();

            try {
                notificationService.sendNotification(request);
            } catch (Exception e) {
                log.error("공급사 알림 전송 실패 - 공급사: {}, 오류: {}", 
                        supplier.getCompanyName(), e.getMessage(), e);
            }
        }
    }

    public void sendNotificationToUser(String notificationType, String title, String content, Long userId) {
        sendNotificationToUser(notificationType, title, content, userId, BiddingStatus.NotificationPriority.NORMAL);
    }

    public void sendNotificationToUser(String notificationType, String title, String content, Long userId, String priority) {
        log.info("사용자 알림 전송 - 유형: {}, 제목: {}, 내용: {}, 사용자ID: {}, 우선순위: {}", 
                notificationType, title, content, userId, priority);

        if (userId == null) {
            log.warn("알림 수신자 ID가 null입니다. 전송 생략됨.");
            return;
        }

        NotificationRequest request = NotificationRequest.builder()
                .type(notificationType)
                .title(title)
                .content(content)
                .recipientId(userId)
                .priority(priority)
                .build();

        try {
            notificationService.sendNotification(request);
        } catch (Exception e) {
            log.error("사용자 알림 전송 실패 - 사용자ID: {}, 오류: {}", userId, e.getMessage(), e);
        }
    }

    public void sendNotificationToDepartmentRole(String notificationType, String content, 
                                               Long departmentId, Member.Role role, String priority) {
        log.info("부서별 역할 알림 전송 - 유형: {}, 내용: {}, 부서ID: {}, 역할: {}, 우선순위: {}", 
                notificationType, content, departmentId, role, priority);

        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new IllegalArgumentException("부서를 찾을 수 없습니다: " + departmentId));

        List<Member> users = memberRepository.findByDepartmentId(departmentId).stream()
                .filter(member -> member.getRole() == role)
                .filter(this::isValidRecipient)
                .collect(Collectors.toList());

        for (Member user : users) {
            NotificationRequest request = NotificationRequest.builder()
                    .type(notificationType)
                    .title(department.getName() + " " + role.name() + " 알림")
                    .content(content)
                    .recipientId(user.getId())
                    .priority(priority)
                    .build();

            try {
                notificationService.sendNotification(request);
            } catch (Exception e) {
                log.error("부서별 역할 알림 전송 실패 - 부서: {}, 역할: {}, 수신자: {}, 오류: {}", 
                        department.getName(), role, user.getUsername(), e.getMessage(), e);
            }
        }
    }
}