package com.orbit.service.procurement;

import com.orbit.dto.procurement.ProjectRequestDTO;
import com.orbit.dto.procurement.ProjectResponseDTO;
import com.orbit.entity.procurement.Project;
import com.orbit.exception.ProjectNotFoundException;
import com.orbit.repository.procurement.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * ProjectService에 대한 단위 테스트 클래스
 */
@ExtendWith(MockitoExtension.class)
public class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private ProjectService projectService;

    private Project project1;
    private Project project2;
    private ProjectRequestDTO projectRequestDTO;

    /**
     * 각 테스트 메서드 실행 전에 호출되어 테스트 환경을 설정합니다.
     */
    @BeforeEach
    void setUp() {
        // 테스트에 사용될 객체 생성
        project1 = Project.builder()
                .id(1L)
                .projectId("PRJ-001")
                .projectName("Test Project 1")
                .managerName("John Doe")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(30))
                .status(Project.ProjectStatus.IN_PROGRESS)
                .description("Test Description 1")
                .build();

        project2 = Project.builder()
                .id(2L)
                .projectId("PRJ-002")
                .projectName("Test Project 2")
                .managerName("Jane Smith")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(60))
                .status(Project.ProjectStatus.COMPLETED)
                .description("Test Description 2")
                .build();

        projectRequestDTO = new ProjectRequestDTO();
        projectRequestDTO.setProjectId("PRJ-003");
        projectRequestDTO.setProjectName("Test Project 3");
        projectRequestDTO.setManagerName("Alice Johnson");
        projectRequestDTO.setStartDate(LocalDate.now());
        projectRequestDTO.setEndDate(LocalDate.now().plusDays(90));
        projectRequestDTO.setStatus("IN_PROGRESS");
        projectRequestDTO.setDescription("Test Description 3");
    }

    /**
     * 모든 프로젝트 정보를 조회하는 메서드에 대한 테스트
     */
    @Test
    void getAllProjects_shouldReturnAllProjects() {
        // Given
        when(projectRepository.findAll()).thenReturn(Arrays.asList(project1, project2));

        // When
        List<ProjectResponseDTO> projects = projectService.getAllProjects();

        // Then
        assertEquals(2, projects.size());
        assertEquals(project1.getProjectName(), projects.get(0).getProjectName());
        assertEquals(project2.getProjectName(), projects.get(1).getProjectName());
    }

    /**
     * 프로젝트 ID로 프로젝트 정보를 조회하는 메서드에 대한 테스트 (프로젝트 정보가 존재하는 경우)
     */
    @Test
    void getProjectById_shouldReturnProject_whenProjectExists() {
        // Given
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project1));

        // When
        Optional<ProjectResponseDTO> project = projectService.getProjectById(1L);

        // Then
        assertTrue(project.isPresent());
        assertEquals(project1.getProjectName(), project.get().getProjectName());
    }

    /**
     * 프로젝트 ID로 프로젝트 정보를 조회하는 메서드에 대한 테스트 (프로젝트 정보가 존재하지 않는 경우)
     */
    @Test
    void getProjectById_shouldReturnEmpty_whenProjectDoesNotExist() {
        // Given
        when(projectRepository.findById(3L)).thenReturn(Optional.empty());

        // When
        Optional<ProjectResponseDTO> project = projectService.getProjectById(3L);

        // Then
        assertFalse(project.isPresent());
    }

    /**
     * 새로운 프로젝트 정보를 생성하는 메서드에 대한 테스트
     */
    @Test
    void createProject_shouldCreateNewProject() {
        // Given
        Project project3 = Project.builder()
                .id(3L)
                .projectId("PRJ-003")
                .projectName("Test Project 3")
                .managerName("Alice Johnson")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(90))
                .status(Project.ProjectStatus.IN_PROGRESS)
                .description("Test Description 3")
                .build();
        when(projectRepository.save(any(Project.class))).thenReturn(project3);

        // When
        ProjectResponseDTO createdProject = projectService.createProject(projectRequestDTO);

        // Then
        assertEquals(project3.getProjectName(), createdProject.getProjectName());
    }

    /**
     * 프로젝트 정보를 업데이트하는 메서드에 대한 테스트 (프로젝트 정보가 존재하는 경우)
     */
    @Test
    void updateProject_shouldUpdateProject_whenProjectExists() {
        // Given
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project1));
        when(projectRepository.save(any(Project.class))).thenReturn(project1);

        // When
        ProjectResponseDTO updatedProject = projectService.updateProject(1L, projectRequestDTO);

        // Then
        assertEquals(projectRequestDTO.getProjectName(), updatedProject.getProjectName());
    }

    /**
     * 프로젝트 정보를 업데이트하는 메서드에 대한 테스트 (프로젝트 정보가 존재하지 않는 경우)
     */
    @Test
    void updateProject_shouldThrowException_whenProjectDoesNotExist() {
        // Given
        when(projectRepository.findById(4L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(ProjectNotFoundException.class, () -> projectService.updateProject(4L, projectRequestDTO));
    }

    /**
     * 프로젝트 정보를 삭제하는 메서드에 대한 테스트 (프로젝트 정보가 존재하는 경우)
     */
    @Test
    void deleteProject_shouldDeleteProject_whenProjectExists() {
        // Given
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project1));

        // When
        projectService.deleteProject(1L);

        // Then
        verify(projectRepository).delete(project1);
    }

    /**
     * 프로젝트 정보를 삭제하는 메서드에 대한 테스트 (프로젝트 정보가 존재하지 않는 경우)
     */
    @Test
    void deleteProject_shouldThrowException_whenProjectDoesNotExist() {
        // Given
        when(projectRepository.findById(4L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(ProjectNotFoundException.class, () -> projectService.deleteProject(4L));
    }
}
