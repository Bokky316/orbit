package com.orbit.service.project;

import com.orbit.dto.procurement.ProjectRequestDTO;
import com.orbit.dto.procurement.ProjectResponseDTO;
import com.orbit.entity.procurement.Project;
import com.orbit.exception.ProjectNotFoundException;
import com.orbit.repository.procurement.ProjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 프로젝트 관련 비즈니스 로직을 처리하는 서비스 클래스
 */
@Service
@Transactional
public class ProjectService {

    private static final Logger logger = LoggerFactory.getLogger(ProjectService.class);

    private final ProjectRepository projectRepository;

    /**
     * 생성자를 통한 의존성 주입
     * @param projectRepository 프로젝트 리포지토리
     */
    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    /**
     * 모든 프로젝트를 조회합니다.
     * @return 프로젝트 목록
     */
    @Transactional(readOnly = true)
    public List<ProjectResponseDTO> getAllProjects() {
        List<Project> projects = projectRepository.findAll();
        return projects.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 프로젝트 ID로 프로젝트를 조회합니다.
     * @param id 프로젝트 ID
     * @return 조회된 프로젝트 (Optional)
     * @throws ProjectNotFoundException 프로젝트를 찾을 수 없을 경우
     */
    @Transactional(readOnly = true)
    public Optional<ProjectResponseDTO> getProjectById(Long id) {
        logger.info("Retrieving project by id: {}", id);
        return projectRepository.findById(id)
                .map(this::convertToDto);
    }

    /**
     * 새로운 프로젝트를 생성합니다.
     * @param projectRequestDTO 생성할 프로젝트 정보
     * @return 생성된 프로젝트
     */
    public ProjectResponseDTO createProject(ProjectRequestDTO projectRequestDTO) {
        Project project = convertToEntity(projectRequestDTO);
        logger.info("Creating a new project: {}", project);
        Project savedProject = projectRepository.save(project);
        return convertToDto(savedProject);
    }

    /**
     * 프로젝트 정보를 업데이트합니다.
     * @param id 업데이트할 프로젝트 ID
     * @param projectRequestDTO 업데이트할 프로젝트 정보
     * @return 업데이트된 프로젝트
     * @throws ProjectNotFoundException 프로젝트를 찾을 수 없을 경우
     */
    public ProjectResponseDTO updateProject(Long id, ProjectRequestDTO projectRequestDTO) {
        logger.info("Updating project with id: {}, details: {}", id, projectRequestDTO);
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found with id: " + id));

        project.setProjectName(projectRequestDTO.getProjectName());
        project.setManagerName(projectRequestDTO.getManagerName());
        project.setStartDate(projectRequestDTO.getStartDate());
        project.setEndDate(projectRequestDTO.getEndDate());
        project.setStatus(Project.ProjectStatus.valueOf(projectRequestDTO.getStatus()));
        project.setDescription(projectRequestDTO.getDescription());

        Project updatedProject = projectRepository.save(project);
        return convertToDto(updatedProject);
    }

    /**
     * 프로젝트를 삭제합니다.
     * @param id 삭제할 프로젝트 ID
     * @throws ProjectNotFoundException 프로젝트를 찾을 수 없을 경우
     */
    public void deleteProject(Long id) {
        logger.info("Deleting project with id: {}", id);
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found with id: " + id));
        projectRepository.delete(project);
    }

    /**
     * ProjectRequestDTO를 Project 엔티티로 변환합니다.
     * @param projectRequestDTO 변환할 ProjectRequestDTO
     * @return 변환된 Project 엔티티
     */
    private Project convertToEntity(ProjectRequestDTO projectRequestDTO) {
        Project project = new Project();
        project.setProjectId(projectRequestDTO.getProjectId());
        project.setProjectName(projectRequestDTO.getProjectName());
        project.setManagerName(projectRequestDTO.getManagerName());
        project.setStartDate(projectRequestDTO.getStartDate());
        project.setEndDate(projectRequestDTO.getEndDate());
        project.setStatus(Project.ProjectStatus.valueOf(projectRequestDTO.getStatus()));
        project.setDescription(projectRequestDTO.getDescription());
        return project;
    }

    /**
     * Project 엔티티를 ProjectResponseDTO로 변환합니다.
     * @param project 변환할 Project 엔티티
     * @return 변환된 ProjectResponseDTO
     */
    private ProjectResponseDTO convertToDto(Project project) {
        ProjectResponseDTO projectResponseDTO = new ProjectResponseDTO();
        projectResponseDTO.setId(project.getId());
        projectResponseDTO.setProjectId(project.getProjectId());
        projectResponseDTO.setProjectName(project.getProjectName());
        projectResponseDTO.setManagerName(project.getManagerName());
        projectResponseDTO.setStartDate(project.getStartDate());
        projectResponseDTO.setEndDate(project.getEndDate());
        projectResponseDTO.setStatus(project.getStatus().toString());
        projectResponseDTO.setDescription(project.getDescription());
        return projectResponseDTO;
    }
}
