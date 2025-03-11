package com.orbit.service.procurement;

import com.orbit.dto.procurement.ProjectRequestDTO;
import com.orbit.dto.procurement.ProjectResponseDTO;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.entity.member.Member;
import com.orbit.entity.project.Project;
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
                .orElseThrow(() -> new ProjectNotFoundException("ID " + id + "에 해당하는 프로젝트를 찾을 수 없습니다."));
    }

    /**
     * 프로젝트 생성
     */
    @Transactional
    public ProjectResponseDTO createProject(ProjectRequestDTO dto, String currentUserName) {
        Project project = convertToEntity(dto);

        // 1. 상태 코드 설정 (메서드 분리)
        setProjectStatusCodes(project, dto.getBasicStatus(), dto.getProcurementStatus());

        // 2. 프로젝트 생성자 설정 (예시)
        // Member creator = memberRepository.findByUsername(currentUserName)
        //        .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
        // project.setCreator(creator);

        // 3. 프로젝트 저장
        Project savedProject = projectRepository.save(project);
        return convertToDto(savedProject);
    }

    /**
     * 프로젝트 업데이트
     */
    @Transactional
    public ProjectResponseDTO updateProject(Long id, ProjectRequestDTO dto) {
        // 1. 프로젝트 조회
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException("ID " + id + "에 해당하는 프로젝트를 찾을 수 없습니다."));

        // 2. 프로젝트 업데이트 (메서드 분리)
        updateProjectDetails(project, dto);

        // 3. 상태 코드 업데이트 (메서드 분리)
        setProjectStatusCodes(project, dto.getBasicStatus(), dto.getProcurementStatus());

        // 4. 저장 후 DTO 반환
        Project updatedProject = projectRepository.save(project);
        return convertToDto(updatedProject);
    }

    /**
     * 프로젝트 삭제
     */
    @Transactional
    public void deleteProject(Long id) {
        // 1. 프로젝트 조회 (존재 확인)
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException("ID " + id + "에 해당하는 프로젝트를 찾을 수 없습니다."));

        // 2. 삭제
        projectRepository.delete(project);
    }

    /**
     * 프로젝트 상태 코드 설정 (재사용 가능)
     */
    private void setProjectStatusCodes(Project project, String basicStatus, String procurementStatus) {
        // 기본 상태 설정
        if (basicStatus != null) {
            setCodeForProject(project, "PROJECT", "STATUS", basicStatus, true);
        }

        // 조달 상태 설정
        if (procurementStatus != null) {
            setCodeForProject(project, "PROJECT", "PROCUREMENT", procurementStatus, false);
        }
    }

    /**
     * 프로젝트 코드 설정 (재사용 가능)
     */
    private void setCodeForProject(Project project, String entityType, String codeGroup, String code, boolean isBasicStatus) {
        String[] parts = code.split("-");

        // 1. ParentCode 조회
        ParentCode parentCode = parentCodeRepository.findByEntityTypeAndCodeGroup(entityType, codeGroup)
                .orElseThrow(() -> new IllegalArgumentException(
                        "ParentCode(" + entityType + ", " + codeGroup + ")를 찾을 수 없습니다."));

        // 2. ChildCode 조회
        ChildCode childCode = childCodeRepository.findByParentCodeAndCodeValue(parentCode, parts[2])
                .orElseThrow(() -> new IllegalArgumentException(
                        "ChildCode(" + parts[2] + ")를 찾을 수 없습니다."));

        // 3. 프로젝트에 코드 설정
        if (isBasicStatus) {
            project.setBasicStatusParent(parentCode);
            project.setBasicStatusChild(childCode);
        } else {
            project.setProcurementStatusParent(parentCode);
            project.setProcurementStatusChild(childCode);
        }
    }

    /**
     * 프로젝트 업데이트 (세부 정보)
     */
    private void updateProjectDetails(Project project, ProjectRequestDTO dto) {
        project.setProjectName(dto.getProjectName());
        project.setBusinessCategory(dto.getBusinessCategory());
        project.setTotalBudget(dto.getTotalBudget());
        project.setClientCompany(dto.getClientCompany());
        project.setContractType(dto.getContractType());

        // 프로젝트 기간 업데이트 (Project 내부에 정의된 클래스 활용)
        Project.ProjectPeriod projectPeriod = project.getProjectPeriod();
        if (projectPeriod == null) {
            projectPeriod = new Project.ProjectPeriod();
            project.setProjectPeriod(projectPeriod);
        }
        projectPeriod.setStartDate(dto.getProjectPeriod().getStartDate());
        projectPeriod.setEndDate(dto.getProjectPeriod().getEndDate());
    }

    /**
     * DTO -> 엔티티 변환
     */
    private Project convertToEntity(ProjectRequestDTO dto) {
        Project project = Project.builder()
                .projectName(dto.getProjectName())
                .businessCategory(dto.getBusinessCategory())
                .totalBudget(dto.getTotalBudget())
                .clientCompany(dto.getClientCompany())
                .contractType(dto.getContractType())
                .build();

        // ProjectPeriod 설정
        Project.ProjectPeriod period = new Project.ProjectPeriod();
        period.setStartDate(dto.getProjectPeriod().getStartDate());
        period.setEndDate(dto.getProjectPeriod().getEndDate());
        project.setProjectPeriod(period);

        return project;
    }

    /**
     * 엔티티 -> DTO 변환
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

        // 상태 코드 설정 (메서드 분리)
        setDtoStatusCodes(project, dto);

        // 프로젝트 기간 설정 (ProjectResponseDTO 내부에 정의된 클래스 활용)
        ProjectResponseDTO.PeriodInfo periodInfo = new ProjectResponseDTO.PeriodInfo();
        if (project.getProjectPeriod() != null) {
            periodInfo.setStartDate(project.getProjectPeriod().getStartDate());
            periodInfo.setEndDate(project.getProjectPeriod().getEndDate());
        }
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

        // 조달 상태 코드 설정
        if (project.getProcurementStatusParent() != null && project.getProcurementStatusChild() != null) {
            dto.setProcurementStatus(
                    project.getProcurementStatusParent().getEntityType() + "-" +
                            project.getProcurementStatusParent().getCodeGroup() + "-" +
                            project.getProcurementStatusChild().getCodeValue()
            );
        }
    }
}
