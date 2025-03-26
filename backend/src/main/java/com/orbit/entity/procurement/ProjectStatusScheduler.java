package com.orbit.entity.procurement;

import java.time.LocalDate;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.repository.commonCode.ChildCodeRepository;
import com.orbit.repository.commonCode.ParentCodeRepository;
import com.orbit.repository.procurement.ProjectRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProjectStatusScheduler {

    private final ProjectRepository projectRepository;
    private final ParentCodeRepository parentCodeRepository;
    private final ChildCodeRepository childCodeRepository;

    // 매일 자정에 실행
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void updateProjectStatuses() {
        LocalDate today = LocalDate.now();

        log.info("프로젝트 상태 자동 업데이트 스케줄러 실행: {}", today);

        // 1. 시작일이 오늘인 프로젝트를 '진행중' 상태로 변경 (등록 상태인 프로젝트만)
        updateProjectsToInProgress(today);

        // 2. 종료일이 어제인 프로젝트를 '완료' 상태로 변경 (진행중 상태인 프로젝트만)
        updateProjectsToCompleted(today.minusDays(1));
    }

    private void updateProjectsToInProgress(LocalDate today) {
        ParentCode basicStatusParent = getParentCode("PROJECT", "BASIC_STATUS");
        ChildCode registeredStatus = getChildCode(basicStatusParent, "REGISTERED");
        ChildCode reregisteredStatus = getChildCode(basicStatusParent, "REREGISTERED");
        ChildCode inProgressStatus = getChildCode(basicStatusParent, "IN_PROGRESS");

        // 등록 또는 정정등록 상태이면서 시작일이 오늘인 프로젝트만 진행중으로 변경
        List<Project> projectsToStart = projectRepository.findByProjectPeriodStartDateAndBasicStatusChildIn(
                today, List.of(registeredStatus, reregisteredStatus));

        for (Project project : projectsToStart) {
            log.info("프로젝트 상태 변경 (등록/정정등록 -> 진행중): ID={}, 이름={}, 기존 상태={}",
                    project.getId(), project.getProjectName(), project.getBasicStatusChild().getCodeValue());
            project.setBasicStatusChild(inProgressStatus);
        }

        projectRepository.saveAll(projectsToStart);
        log.info("{} 개의 프로젝트가 '진행중' 상태로 변경되었습니다.", projectsToStart.size());
    }

    private void updateProjectsToCompleted(LocalDate endDate) {
        ParentCode basicStatusParent = getParentCode("PROJECT", "BASIC_STATUS");
        ChildCode inProgressStatus = getChildCode(basicStatusParent, "IN_PROGRESS");
        ChildCode completedStatus = getChildCode(basicStatusParent, "COMPLETED");

        // 진행중 상태이면서 종료일이 어제인 프로젝트만 완료로 변경
        List<Project> projectsToComplete = projectRepository.findByProjectPeriodEndDateAndBasicStatusChild(
                endDate, inProgressStatus);

        for (Project project : projectsToComplete) {
            log.info("프로젝트 상태 변경 (진행중 -> 완료): ID={}, 이름={}, 종료일={}",
                    project.getId(), project.getProjectName(), endDate);
            project.setBasicStatusChild(completedStatus);
        }

        projectRepository.saveAll(projectsToComplete);
        log.info("{} 개의 프로젝트가 '완료' 상태로 변경되었습니다.", projectsToComplete.size());
    }

    private ParentCode getParentCode(String entityType, String codeGroup) {
        return parentCodeRepository.findByEntityTypeAndCodeGroup(entityType, codeGroup)
                .orElseThrow(() -> new RuntimeException(
                        "ParentCode를 찾을 수 없습니다: " + entityType + "-" + codeGroup));
    }

    private ChildCode getChildCode(ParentCode parentCode, String codeValue) {
        return childCodeRepository.findByParentCodeAndCodeValue(parentCode, codeValue)
                .orElseThrow(() -> new RuntimeException(
                        "ChildCode를 찾을 수 없습니다: " + parentCode.getCodeName() + "-" + codeValue));
    }
}