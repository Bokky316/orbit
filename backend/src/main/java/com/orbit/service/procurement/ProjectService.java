package com.orbit.service.procurement;

import com.orbit.dto.procurement.*;
import com.orbit.entity.member.Member;
import com.orbit.entity.project.Project;
import com.orbit.entity.state.StatusHistory;
import com.orbit.entity.state.SystemStatus;
import com.orbit.exception.ProjectNotFoundException;
import com.orbit.exception.ResourceNotFoundException;
import com.orbit.repository.commonCode.ChildCodeRepository;
import com.orbit.repository.commonCode.ParentCodeRepository;
import com.orbit.repository.member.MemberRepository;
import com.orbit.repository.procurement.ProjectAttachmentRepository;
import com.orbit.repository.procurement.ProjectRepository;

import com.orbit.service.StateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final StateService stateService;

    @Transactional(readOnly = true)
    public List<ProjectResponseDTO> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(this::convertToDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponseDTO getProjectById(Long id) {
        return projectRepository.findById(id)
                .map(this::convertToDto)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found: " + id));
    }

    @Transactional
    public ProjectResponseDTO createProject(ProjectRequestDTO dto, Member creator) {
        Project project = convertToEntity(dto);
        project.setBasicStatus(parseStatus(dto.getBasicStatus()));
        project.setProcurementStatus(parseStatus(dto.getProcurementStatus()));

        Project savedProject = projectRepository.save(project);
        logStatusChange(savedProject, creator);
        return convertToDto(savedProject);
    }

    @Transactional
    public ProjectResponseDTO updateProject(Long id, ProjectRequestDTO dto, Member updater) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found: " + id));

        updateFields(project, dto);
        logStatusChange(project, updater);
        return convertToDto(projectRepository.save(project));
    }

    @Transactional
    public void deleteProject(Long id) {
        projectRepository.deleteById(id);
    }

    // Helper methods
    private void updateFields(Project project, ProjectRequestDTO dto) {
        project.setProjectName(dto.getProjectName());
        project.setBusinessCategory(dto.getBusinessCategory());
        project.setTotalBudget(dto.getTotalBudget());
        project.setClientCompany(dto.getClientCompany());
        project.setContractType(dto.getContractType());

        if (dto.getProjectManager() != null) {
            project.getProjectManager().setName(dto.getProjectManager().getName());
            project.getProjectManager().setContact(dto.getProjectManager().getContact());
            project.getProjectManager().setEmail(dto.getProjectManager().getEmail());
        }

        if (dto.getProjectPeriod() != null) {
            project.getProjectPeriod().setStartDate(dto.getProjectPeriod().getStartDate());
            project.getProjectPeriod().setEndDate(dto.getProjectPeriod().getEndDate());
        }
    }

    private void logStatusChange(Project project, Member member) {
        StatusHistory history = stateService.changeState(
                project.getId(),
                StatusHistory.EntityType.PROJECT,
                project.getBasicStatus(),
                project.getProcurementStatus(),
                member
        );
        project.addStatusHistory(history);
    }

    private SystemStatus parseStatus(String statusCode) {
        String[] parts = statusCode.split("-");
        return new SystemStatus(parts[0], parts[1]);
    }

    private Project convertToEntity(ProjectRequestDTO dto) {
        return Project.builder()
                .projectName(dto.getProjectName())
                .businessCategory(dto.getBusinessCategory())
                .projectManager(new Project.ProjectManager(
                        dto.getProjectManager().getName(),
                        dto.getProjectManager().getContact(),
                        dto.getProjectManager().getEmail()
                ))
                .projectPeriod(new Project.ProjectPeriod(
                        dto.getProjectPeriod().getStartDate(),
                        dto.getProjectPeriod().getEndDate()
                ))
                .totalBudget(dto.getTotalBudget())
                .clientCompany(dto.getClientCompany())
                .contractType(dto.getContractType())
                .build();
    }

    private ProjectResponseDTO convertToDto(Project project) {
        ProjectResponseDTO dto = new ProjectResponseDTO();
        dto.setId(project.getId());
        dto.setProjectIdentifier(project.getProjectIdentifier());
        dto.setProjectName(project.getProjectName());
        dto.setBusinessCategory(project.getBusinessCategory());
        dto.setBasicStatus(project.getBasicStatus().getFullCode());
        dto.setProcurementStatus(project.getProcurementStatus().getFullCode());
        dto.setTotalBudget(project.getTotalBudget());
        dto.setClientCompany(project.getClientCompany());
        dto.setContractType(project.getContractType());


        ProjectResponseDTO.ManagerInfo managerInfo = new ProjectResponseDTO.ManagerInfo();
        managerInfo.setName(project.getProjectManager().getName());
        managerInfo.setContact(project.getProjectManager().getContact());
        managerInfo.setEmail(project.getProjectManager().getEmail());
        dto.setProjectManager(managerInfo);

        ProjectResponseDTO.PeriodInfo periodInfo = new ProjectResponseDTO.PeriodInfo();
        periodInfo.setStartDate(project.getProjectPeriod().getStartDate());
        periodInfo.setEndDate(project.getProjectPeriod().getEndDate());
        dto.setProjectPeriod(periodInfo);

        return dto;
    }

    /**
     * DTO에 상태 코드 설정
     */
    private void setDtoStatusCodes(Project project, ProjectResponseDTO dto) {
        // 기본 상태 코드 설정
        if (project.getBasicStatusParent() != null && project.getBasicStatusChild() != null) {
            dto.setBasicStatus(
                    project.getBasicStatusParent().getEntityType() + "-" +
                            project.getBasicStatusParent().getCodeGroup() + "-" +
                            project.getBasicStatusChild().getCodeValue()
            );
        }
    }

    /**
     * 첨부파일 엔티티 -> DTO 변환
     */
    private ProjectAttachmentDTO convertAttachmentToDto(ProjectAttachment attachment) {
        return ProjectAttachmentDTO.builder()
                .id(attachment.getId())
                .fileName(attachment.getOriginalFilename())
                .fileSize(attachment.getFileSize())
                .fileExtension(attachment.getFileExtension())
                .uploadedBy(attachment.getUploadedBy() != null ? attachment.getUploadedBy().getUsername() : null)
                .uploadedAt(attachment.getUploadedAt())
                .description(attachment.getDescription())
                .build();
    }

    /**
     * 프로젝트 수정 가능 여부 검증
     */
    private void validateProjectModifiable(Project project, String username) {
        // 1. 상태 기반 검증 - 등록, 정정등록 상태에서만 수정 가능
        if (project.getBasicStatusChild() != null) {
            String statusCode = project.getBasicStatusChild().getCodeValue();
            if (!("REGISTERED".equals(statusCode) || "REREGISTERED".equals(statusCode))) {
                throw new IllegalStateException("현재 프로젝트 상태(" + statusCode + ")에서는 수정할 수 없습니다. 등록 또는 정정등록 상태에서만 수정 가능합니다.");
            }
        }

        // 2. 권한 기반 검증 - 프로젝트 담당자 또는 관리자만 수정 가능
        Member currentUser = memberRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("사용자 정보를 찾을 수 없습니다: " + username));

        boolean isAdmin = Member.Role.ADMIN.equals(currentUser.getRole());
        boolean isRequester = project.getRequester() != null && project.getRequester().getId().equals(currentUser.getId());

        if (!(isAdmin || isRequester)) {
            throw new SecurityException("프로젝트 수정 권한이 없습니다. 프로젝트 요청자 또는 관리자만 수정할 수 있습니다.");
        }
    }

    /**
     * 프로젝트 삭제 가능 여부 검증
     */
    private void validateProjectDeletable(Project project, String username) {
        // 1. 상태 기반 검증 - 등록, 정정등록 상태에서만 삭제 가능
        if (project.getBasicStatusChild() != null) {
            String statusCode = project.getBasicStatusChild().getCodeValue();
            if (!("REGISTERED".equals(statusCode) || "REREGISTERED".equals(statusCode))) {
                throw new IllegalStateException("현재 프로젝트 상태(" + statusCode + ")에서는 삭제할 수 없습니다. 등록 또는 정정등록 상태에서만 삭제 가능합니다.");
            }
        }

        // 2. 권한 기반 검증 - 프로젝트 담당자 또는 관리자만 삭제 가능
        Member currentUser = memberRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("사용자 정보를 찾을 수 없습니다: " + username));

        boolean isAdmin = Member.Role.ADMIN.equals(currentUser.getRole());
        boolean isRequester = project.getRequester() != null && project.getRequester().getId().equals(currentUser.getId());

        if (!(isAdmin || isRequester)) {
            throw new SecurityException("프로젝트 삭제 권한이 없습니다. 프로젝트 요청자 또는 관리자만 삭제할 수 있습니다.");
        }

        // 3. 연관관계 기반 검증 - 진행 중인 구매요청이 없어야 삭제 가능
        List<PurchaseRequest> activeRequests = project.getPurchaseRequests().stream()
                .filter(pr -> {
                    if (pr.getStatus() == null) return false;
                    String requestStatus = pr.getStatus().getChildCode();
                    // 구매요청 접수 이후 상태인 경우 진행 중으로 간주
                    return !("REQUESTED".equals(requestStatus));
                })
                .collect(Collectors.toList());

        if (!activeRequests.isEmpty()) {
            throw new IllegalStateException("이 프로젝트와 연결된 진행 중인 구매요청이 " + activeRequests.size() + "개 있어 삭제할 수 없습니다.");
        }
    }

}