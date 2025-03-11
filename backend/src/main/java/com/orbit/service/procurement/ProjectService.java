package com.orbit.service.procurement;

import com.orbit.dto.procurement.*;
import com.orbit.entity.member.Member;
import com.orbit.entity.project.Project;
import com.orbit.entity.state.StatusHistory;
import com.orbit.entity.state.SystemStatus;
import com.orbit.exception.ProjectNotFoundException;
import com.orbit.repository.commonCode.ChildCodeRepository;
import com.orbit.repository.commonCode.ParentCodeRepository;
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
    public List<ProjectDTO> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(this::convertToDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectDTO getProjectById(Long id) {
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
}