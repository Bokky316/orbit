package com.orbit.controller.procurement;

import com.orbit.dto.procurement.ProjectRequestDTO;
import com.orbit.dto.procurement.ProjectResponseDTO;
import com.orbit.service.project.ProjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * 프로젝트 관련 RESTful API를 처리하는 컨트롤러 클래스
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
     * @return 프로젝트 목록
     */
    @GetMapping
    public ResponseEntity<List<ProjectResponseDTO>> getAllProjects() {
        List<ProjectResponseDTO> projects = projectService.getAllProjects();
        return new ResponseEntity<>(projects, HttpStatus.OK);
    }

    /**
     * 프로젝트 ID로 프로젝트를 조회합니다.
     * @param id 프로젝트 ID
     * @return 조회된 프로젝트 (존재하지 않으면 404 상태 코드 반환)
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponseDTO> getProjectById(@PathVariable Long id) {
        Optional<ProjectResponseDTO> project = projectService.getProjectById(id);
        return project.map(response -> new ResponseEntity<>(response, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /**
     * 새로운 프로젝트를 생성합니다.
     * @param projectRequestDTO 생성할 프로젝트 정보
     * @return 생성된 프로젝트 (201 상태 코드 반환)
     */
    @PostMapping
    public ResponseEntity<ProjectResponseDTO> createProject(@Valid @RequestBody ProjectRequestDTO projectRequestDTO) {
        ProjectResponseDTO createdProject = projectService.createProject(projectRequestDTO);
        return new ResponseEntity<>(createdProject, HttpStatus.CREATED);
    }

    /**
     * 프로젝트 정보를 업데이트합니다.
     * @param id 업데이트할 프로젝트 ID
     * @param projectRequestDTO 업데이트할 프로젝트 정보
     * @return 업데이트된 프로젝트
     */
    @PutMapping("/{id}")
    public ResponseEntity<ProjectResponseDTO> updateProject(@PathVariable Long id, @Valid @RequestBody ProjectRequestDTO projectRequestDTO) {
        ProjectResponseDTO updatedProject = projectService.updateProject(id, projectRequestDTO);
        return new ResponseEntity<>(updatedProject, HttpStatus.OK);
    }

    /**
     * 프로젝트를 삭제합니다.
     * @param id 삭제할 프로젝트 ID
     * @return 삭제 성공 시 204 상태 코드 반환
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
