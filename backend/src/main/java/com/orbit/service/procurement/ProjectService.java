package com.orbit.service.procurement;

import com.orbit.dto.procurement.ProjectRequestDTO;
import com.orbit.dto.procurement.ProjectResponseDTO;
import com.orbit.entity.member.Member;
import com.orbit.entity.project.Project;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.exception.ProjectNotFoundException;
import com.orbit.repository.commonCode.ChildCodeRepository;
import com.orbit.repository.commonCode.ParentCodeRepository;
import com.orbit.repository.procurement.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ParentCodeRepository parentCodeRepository;
    private final ChildCodeRepository childCodeRepository;

    /**
     * 모든 프로젝트 조회
     */
    @Transactional(readOnly = true)
    public List<ProjectResponseDTO> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 단일 프로젝트 조회
     */
    @Transactional(readOnly = true)
    public ProjectResponseDTO getProjectById(Long id) {
        return projectRepository.findById(id)
                .map(this::convertToDto)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found: " + id));
    }

    /**
     * 프로젝트 생성
     */
    @Transactional
    public ProjectResponseDTO createProject(ProjectRequestDTO dto, Member creator) {
        // DTO를 엔티티로 변환
        Project project = convertToEntity(dto);

        // 기본 상태 설정
        if (dto.getBasicStatus() != null) {
            String[] basicStatusParts = dto.getBasicStatus().split("-");
            ParentCode basicStatusParent = parentCodeRepository.findByEntityTypeAndCodeGroup(
                    "PROJECT", "STATUS"
            );
            ChildCode basicStatusChild = childCodeRepository.findByParentCodeAndCodeValue(
                    basicStatusParent, basicStatusParts[2]
            );
            project.setBasicStatusParent(basicStatusParent);
            project.setBasicStatusChild(basicStatusChild);
        }

        // 조달 상태 설정
        if (dto.getProcurementStatus() != null) {
            String[] procurementStatusParts = dto.getProcurementStatus().split("-");
            ParentCode procurementStatusParent = parentCodeRepository.findByEntityTypeAndCodeGroup(
                    "PROJECT", "PROCUREMENT_STATUS"
            );
            ChildCode procurementStatusChild = childCodeRepository.findByParentCodeAndCodeValue(
                    procurementStatusParent, procurementStatusParts[2]
            );
            project.setProcurementStatusParent(procurementStatusParent);
            project.setProcurementStatusChild(procurementStatusChild);
        }

        // 프로젝트 저장
        Project savedProject = projectRepository.save(project);
        return convertToDto(savedProject);
    }

    /**
     * 프로젝트 업데이트
     */
    @Transactional
    public ProjectResponseDTO updateProject(Long id, ProjectRequestDTO dto) {
        // 기존 프로젝트 조회
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found: " + id));

        // 기본 상태 업데이트
        if (dto.getBasicStatus() != null) {
            String[] basicStatusParts = dto.getBasicStatus().split("-");
            ParentCode basicStatusParent = parentCodeRepository.findByEntityTypeAndCodeGroup(
                    "PROJECT", "STATUS"
            );
            ChildCode basicStatusChild = childCodeRepository.findByParentCodeAndCodeValue(
                    basicStatusParent, basicStatusParts[2]
            );
            project.setBasicStatusParent(basicStatusParent);
            project.setBasicStatusChild(basicStatusChild);
        }

        // 조달 상태 업데이트
        if (dto.getProcurementStatus() != null) {
            String[] procurementStatusParts = dto.getProcurementStatus().split("-");
            ParentCode procurementStatusParent = parentCodeRepository.findByEntityTypeAndCodeGroup(
                    "PROJECT", "PROCUREMENT_STATUS"
            );
            ChildCode procurementStatusChild = childCodeRepository.findByParentCodeAndCodeValue(
                    procurementStatusParent, procurementStatusParts[2]
            );
            project.setProcurementStatusParent(procurementStatusParent);
            project.setProcurementStatusChild(procurementStatusChild);
        }

        // 기타 필드 업데이트
        project.setProjectName(dto.getProjectName());
        project.setBusinessCategory(dto.getBusinessCategory());
        project.setTotalBudget(dto.getTotalBudget());
        project.setClientCompany(dto.getClientCompany());
        project.setContractType(dto.getContractType());

        // 프로젝트 기간 업데이트
        Project.ProjectPeriod projectPeriod = project.getProjectPeriod();
        projectPeriod.setStartDate(dto.getProjectPeriod().getStartDate());
        projectPeriod.setEndDate(dto.getProjectPeriod().getEndDate());

        // 프로젝트 저장
        Project savedProject = projectRepository.save(project);
        return convertToDto(savedProject);
    }

    /**
     * 프로젝트 삭제
     */
    @Transactional
    public void deleteProject(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found: " + id));
        projectRepository.delete(project);
    }

    /**
     * DTO를 엔티티로 변환
     */
    private Project convertToEntity(ProjectRequestDTO dto) {
        return Project.builder()
                .projectName(dto.getProjectName())
                .businessCategory(dto.getBusinessCategory())
                .totalBudget(dto.getTotalBudget())
                .clientCompany(dto.getClientCompany())
                .contractType(dto.getContractType())
                .projectPeriod(new Project.ProjectPeriod(
                        dto.getProjectPeriod().getStartDate(),
                        dto.getProjectPeriod().getEndDate()
                ))
                .build();
    }

    /**
     * 엔티티를 DTO로 변환
     */
    private ProjectResponseDTO convertToDto(Project project) {
        ProjectResponseDTO dto = new ProjectResponseDTO();

        // 기본 정보 설정
        dto.setId(project.getId());
        dto.setProjectIdentifier(project.getProjectIdentifier());
        dto.setProjectName(project.getProjectName());
        dto.setBusinessCategory(project.getBusinessCategory());
        dto.setTotalBudget(project.getTotalBudget());
        dto.setClientCompany(project.getClientCompany());
        dto.setContractType(project.getContractType());

        // 기본 상태 코드 설정
        if (project.getBasicStatusParent() != null && project.getBasicStatusChild() != null) {
            dto.setBasicStatus(
                    project.getBasicStatusParent().getEntityType() + "-" +
                            project.getBasicStatusParent().getCodeGroup() + "-" +
                            project.getBasicStatusChild().getCodeValue()
            );
        }

        // 조달 상태 코드 설정
        if (project.getProcurementStatusParent() != null && project.getProcurementStatusChild() != null) {
            dto.setProcurementStatus(
                    project.getProcurementStatusParent().getEntityType() + "-" +
                            project.getProcurementStatusParent().getCodeGroup() + "-" +
                            project.getProcurementStatusChild().getCodeValue()
            );
        }

        // 프로젝트 기간 설정
        ProjectResponseDTO.PeriodInfo periodInfo = new ProjectResponseDTO.PeriodInfo();
        periodInfo.setStartDate(project.getProjectPeriod().getStartDate());
        periodInfo.setEndDate(project.getProjectPeriod().getEndDate());
        dto.setProjectPeriod(periodInfo);

        return dto;
    }
}