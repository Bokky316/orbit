package com.orbit.controller.peoject;

import com.orbit.dto.project.ProjectRequestDTO;
import com.orbit.dto.project.ProjectResponseDTO;
import com.orbit.entity.project.Project;
import com.orbit.service.project.ProjectService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 프로젝트 관련 RESTful API를 처리하는 컨트롤러 클래스
 *
 * @author YourName
 * @version 1.0
 * @since 2025-03-05
 */
@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    /**
     * 생성자를 통한 의존성 주입
     * @param projectService 프로젝트 서비스
     */
    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    /**
     * 모든 프로젝트를 조회합니다.
     *
     * @return 프로젝트 목록
     */
    @GetMapping
    public ResponseEntity<List<ProjectResponseDTO>> getAllProjects() {
        List<Project> projects = projectService.getAllProjects();
        List<ProjectResponseDTO> projectResponseDTOs = projects.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return new ResponseEntity<>(projectResponseDTOs, HttpStatus.OK);
    }

    /**
     * 페이징 및 정렬을 적용하여 모든 프로젝트를 조회합니다.
     *
     * @param pageable 페이징 및 정렬 정보
     * @return 페이징된 프로젝트 목록
     */
    @GetMapping("/page")
    public ResponseEntity<Page<ProjectResponseDTO>> getAllProjects(Pageable pageable) {
        Page<ProjectResponseDTO> projectResponseDTOs = projectService.getAllProjects(pageable)
                .map(this::convertToDto);
        return new ResponseEntity<>(projectResponseDTOs, HttpStatus.OK);
    }

    /**
     * 프로젝트 ID로 프로젝트를 조회합니다.
     *
     * @param id 프로젝트 ID
     * @return 조회된 프로젝트 (존재하지 않으면 404 상태 코드 반환)
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponseDTO> getProjectById(@PathVariable Long id) {
        return projectService.getProjectById(id)
                .map(this::convertToDto)
                .map(project -> new ResponseEntity<>(project, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /**
     * 새로운 프로젝트를 생성합니다.
     *
     * @param projectRequestDTO 생성할 프로젝트 정보
     * @return 생성된 프로젝트 (201 상태 코드 반환)
     */
    @PostMapping
    public ResponseEntity<ProjectResponseDTO> createProject(@Valid @RequestBody ProjectRequestDTO projectRequestDTO) {
        Project project = convertToEntity(projectRequestDTO);
        Project createdProject = projectService.createProject(project);
        ProjectResponseDTO projectResponseDTO = convertToDto(createdProject);
        return new ResponseEntity<>(projectResponseDTO, HttpStatus.CREATED);
    }

    /**
     * 프로젝트 정보를 업데이트합니다.
     *
     * @param id 업데이트할 프로젝트 ID
     * @param projectRequestDTO 업데이트할 프로젝트 정보
     * @return 업데이트된 프로젝트
     */
    @PutMapping("/{id}")
    public ResponseEntity<ProjectResponseDTO> updateProject(@PathVariable Long id, @Valid @RequestBody ProjectRequestDTO projectRequestDTO) {
        Project project = convertToEntity(projectRequestDTO);
        Project updatedProject = projectService.updateProject(id, project);
        ProjectResponseDTO projectResponseDTO = convertToDto(updatedProject);
        return new ResponseEntity<>(projectResponseDTO, HttpStatus.OK);
    }

    /**
     * 프로젝트를 삭제합니다.
     *
     * @param id 삭제할 프로젝트 ID
     * @return 삭제 성공 시 204 상태 코드 반환
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    /**
     * Project 엔티티를 ProjectResponseDTO로 변환합니다.
     *
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

    /**
     * ProjectRequestDTO를 Project 엔티티로 변환합니다.
     *
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
}
