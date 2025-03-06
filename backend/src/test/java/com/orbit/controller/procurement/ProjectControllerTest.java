package com.orbit.controller.procurement;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orbit.dto.procurement.ProjectRequestDTO;
import com.orbit.dto.procurement.ProjectResponseDTO;
import com.orbit.service.procurement.ProjectService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * ProjectController에 대한 통합 테스트 클래스
 *
 * @SpringBootTest: Spring Boot 기반 애플리케이션 컨텍스트를 로드하여 통합 테스트를 수행합니다.
 * @AutoConfigureMockMvc: MockMvc를 자동으로 구성하여 Controller를 테스트할 수 있도록 합니다.
 */
@SpringBootTest
@AutoConfigureMockMvc
public class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private ObjectMapper objectMapper;

    @Configuration
    static class TestConfig {
        @Bean
        public ProjectService projectService() {
            return mock(ProjectService.class);
        }

        @Bean
        public ObjectMapper objectMapper() {
            return new ObjectMapper();
        }
    }

    /**
     * 모든 프로젝트 정보를 조회하는 API에 대한 테스트
     */
    @Test
    void getAllProjects_shouldReturnAllProjects() throws Exception {
        // Given
        ProjectService mockProjectService = mock(ProjectService.class);
        ProjectResponseDTO project1 = new ProjectResponseDTO();
        project1.setId(1L);
        project1.setProjectName("Test Project 1");

        ProjectResponseDTO project2 = new ProjectResponseDTO();
        project2.setId(2L);
        project2.setProjectName("Test Project 2");

        List<ProjectResponseDTO> projects = Arrays.asList(project1, project2);
        when(mockProjectService.getAllProjects()).thenReturn(projects);

        // When & Then
        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].projectName").value("Test Project 1"))
                .andExpect(jsonPath("$[1].projectName").value("Test Project 2"));
    }

    /**
     * 프로젝트 ID로 프로젝트 정보를 조회하는 API에 대한 테스트 (프로젝트 정보가 존재하는 경우)
     */
    @Test
    void getProjectById_shouldReturnProject_whenProjectExists() throws Exception {
        // Given
        ProjectService mockProjectService = mock(ProjectService.class);
        ProjectResponseDTO project = new ProjectResponseDTO();
        project.setId(1L);
        project.setProjectName("Test Project");
        when(mockProjectService.getProjectById(1L)).thenReturn(Optional.of(project));

        // When & Then
        mockMvc.perform(get("/api/projects/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.projectName").value("Test Project"));
    }

    /**
     * 프로젝트 ID로 프로젝트 정보를 조회하는 API에 대한 테스트 (프로젝트 정보가 존재하지 않는 경우)
     */
    @Test
    void getProjectById_shouldReturnNotFound_whenProjectDoesNotExist() throws Exception {
        // Given
        ProjectService mockProjectService = mock(ProjectService.class);
        when(mockProjectService.getProjectById(3L)).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/api/projects/3"))
                .andExpect(status().isNotFound());
    }

    /**
     * 새로운 프로젝트 정보를 생성하는 API에 대한 테스트
     */
    @Test
    void createProject_shouldCreateNewProject() throws Exception {
        // Given
        ProjectService mockProjectService = mock(ProjectService.class);
        ProjectRequestDTO projectRequestDTO = new ProjectRequestDTO();
        projectRequestDTO.setProjectName("Test Project");
        projectRequestDTO.setProjectId("PRJ-001");
        projectRequestDTO.setManagerName("Test Manager");
        projectRequestDTO.setStartDate(LocalDate.now());
        projectRequestDTO.setEndDate(LocalDate.now().plusDays(7));
        projectRequestDTO.setStatus("진행중");
        projectRequestDTO.setDescription("Test Description");

        ProjectResponseDTO createdProject = new ProjectResponseDTO();
        createdProject.setId(1L);
        createdProject.setProjectName("Test Project");
        createdProject.setProjectId("PRJ-001");
        createdProject.setManagerName("Test Manager");
        createdProject.setStartDate(LocalDate.now());
        createdProject.setEndDate(LocalDate.now().plusDays(7));
        createdProject.setStatus("진행중");
        createdProject.setDescription("Test Description");

        when(mockProjectService.createProject(any(ProjectRequestDTO.class))).thenReturn(createdProject);

        // When & Then
        mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(projectRequestDTO)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.projectName").value("Test Project"));
    }

    /**
     * 프로젝트 정보를 업데이트하는 API에 대한 테스트
     */
    @Test
    void updateProject_shouldUpdateProject_whenProjectExists() throws Exception {
        // Given
        ProjectService mockProjectService = mock(ProjectService.class);
        ProjectRequestDTO projectRequestDTO = new ProjectRequestDTO();
        projectRequestDTO.setProjectName("Updated Project");
        projectRequestDTO.setProjectId("PRJ-001");
        projectRequestDTO.setManagerName("Updated Manager");
        projectRequestDTO.setStartDate(LocalDate.now());
        projectRequestDTO.setEndDate(LocalDate.now().plusDays(7));
        projectRequestDTO.setStatus("완료");
        projectRequestDTO.setDescription("Updated Description");

        ProjectResponseDTO updatedProject = new ProjectResponseDTO();
        updatedProject.setId(1L);
        updatedProject.setProjectName("Updated Project");
        updatedProject.setProjectId("PRJ-001");
        updatedProject.setManagerName("Updated Manager");
        updatedProject.setStartDate(LocalDate.now());
        updatedProject.setEndDate(LocalDate.now().plusDays(7));
        updatedProject.setStatus("완료");
        updatedProject.setDescription("Updated Description");

        when(mockProjectService.updateProject(any(Long.class), any(ProjectRequestDTO.class))).thenReturn(updatedProject);

        // When & Then
        mockMvc.perform(put("/api/projects/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(projectRequestDTO)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.projectName").value("Updated Project"));
    }

    /**
     * 프로젝트 정보를 삭제하는 API에 대한 테스트
     */
    @Test
    void deleteProject_shouldDeleteProject_whenProjectExists() throws Exception {
        // When & Then
        ProjectService mockProjectService = mock(ProjectService.class);
        mockMvc.perform(delete("/api/projects/1"))
                .andExpect(status().isNoContent());
    }
}
