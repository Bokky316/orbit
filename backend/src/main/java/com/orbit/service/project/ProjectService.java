package com.orbit.service.project;

import com.orbit.entity.project.Project;
import com.orbit.repository.project.ProjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

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
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    /**
     * 페이징 및 정렬을 적용하여 모든 프로젝트를 조회합니다.
     *
     * @param pageable 페이징 및 정렬 정보
     * @return 페이징된 프로젝트 목록
     */
    @Transactional(readOnly = true)
    public Page<Project> getAllProjects(Pageable pageable) {
        logger.info("Retrieving all projects with pagination: {}", pageable);
        return projectRepository.findAll(pageable);
    }

    /**
     * 프로젝트 ID로 프로젝트를 조회합니다.
     * @param id 프로젝트 ID
     * @return 조회된 프로젝트 (Optional)
     * @throws ProjectNotFoundException 프로젝트를 찾을 수 없을 경우
     */
    @Transactional(readOnly = true)
    public Optional<Project> getProjectById(Long id) {
        logger.info("Retrieving project by id: {}", id);
        return projectRepository.findById(id);
    }

    /**
     * 새로운 프로젝트를 생성합니다.
     * @param project 생성할 프로젝트 정보
     * @return 생성된 프로젝트
     */
    public Project createProject(Project project) {
        logger.info("Creating a new project: {}", project);
        return projectRepository.save(project);
    }

    /**
     * 프로젝트 정보를 업데이트합니다.
     * @param id 업데이트할 프로젝트 ID
     * @param projectDetails 업데이트할 프로젝트 정보
     * @return 업데이트된 프로젝트
     * @throws ProjectNotFoundException 프로젝트를 찾을 수 없을 경우
     */
    public Project updateProject(Long id, Project projectDetails) {
        logger.info("Updating project with id: {}, details: {}", id, projectDetails);
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found with id: " + id));

        project.setProjectName(projectDetails.getProjectName());
        project.setManagerName(projectDetails.getManagerName());
        project.setStartDate(projectDetails.getStartDate());
        project.setEndDate(projectDetails.getEndDate());
        project.setStatus(projectDetails.getStatus());
        project.setDescription(projectDetails.getDescription());

        return projectRepository.save(project);
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
}
