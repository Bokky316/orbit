package com.orbit.controller.procurement;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriUtils;

import com.orbit.dto.procurement.ProjectDTO;
import com.orbit.service.procurement.ProjectService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    /**
     * 프로젝트 생성 (JSON)
     */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ProjectDTO> createProject(
            @Valid @RequestBody ProjectDTO ProjectDTO) {

        // Spring Security Context에서 인증 정보 가져오기
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserName = authentication.getName();

        // ProjectService에 인증 정보 전달
        ProjectDTO createdProject = projectService.createProject(ProjectDTO, currentUserName);
        return new ResponseEntity<>(createdProject, HttpStatus.CREATED);
    }

    /**
     * 프로젝트 생성 (Multipart) - 구매요청과 동일한 방식으로 수정
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProjectDTO> createProjectWithFiles(
            @RequestParam("projectName") String projectName,
            @RequestParam("businessCategory") String businessCategory,
            @RequestParam(value = "clientCompany", required = false) String clientCompany,
            @RequestParam(value = "contractType", required = false) String contractType,
            @RequestParam(value = "totalBudget", required = false, defaultValue = "0") Long totalBudget,
            @RequestParam(value = "remarks", required = false) String remarks,
            @RequestParam(value = "basicStatus", required = false) String basicStatus,
            @RequestParam(value = "procurementStatus", required = false) String procurementStatus,
            @RequestParam(value = "requestDepartment", required = false) String requestDepartment,
            @RequestParam(value = "projectPeriod.startDate", required = false) String startDate,
            @RequestParam(value = "projectPeriod.endDate", required = false) String endDate,
            @RequestParam(value = "files", required = false) MultipartFile[] files) {

        // ProjectDTO 객체 생성
        ProjectDTO ProjectDTO = new ProjectDTO();
        ProjectDTO.setProjectName(projectName);
        ProjectDTO.setBusinessCategory(businessCategory);
        ProjectDTO.setTotalBudget(totalBudget);
        ProjectDTO.setRemarks(remarks);
        ProjectDTO.setBasicStatus(basicStatus);
        ProjectDTO.setRequestDepartment(requestDepartment);

        // 기간 정보 설정
        ProjectDTO.PeriodInfo periodInfo = new ProjectDTO.PeriodInfo();
        if (startDate != null) {
            periodInfo.setStartDate(LocalDate.parse(startDate));
        }
        if (endDate != null) {
            periodInfo.setEndDate(LocalDate.parse(endDate));
        }
        ProjectDTO.setProjectPeriod(periodInfo);

        // 파일 정보 설정
        ProjectDTO.setFiles(files);

        // Spring Security Context에서 인증 정보 가져오기
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserName = authentication.getName();

        // ProjectService에 인증 정보 전달
        ProjectDTO createdProject = projectService.createProject(ProjectDTO, currentUserName);
        return new ResponseEntity<>(createdProject, HttpStatus.CREATED);
    }

    /**
     * 프로젝트 조회 (ID)
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProjectDTO> getProjectById(@PathVariable Long id) {
        ProjectDTO project = projectService.getProjectById(id);
        return new ResponseEntity<>(project, HttpStatus.OK);
    }

    /**
     * 모든 프로젝트 조회
     */
    @GetMapping
    public ResponseEntity<List<ProjectDTO>> getAllProjects() {
        List<ProjectDTO> projects = projectService.getAllProjects();
        return new ResponseEntity<>(projects, HttpStatus.OK);
    }

    /**
     * 프로젝트 업데이트 (JSON)
     */
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ProjectDTO> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody ProjectDTO ProjectDTO) {

        // 업데이트 요청자 설정
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        ProjectDTO.setUpdatedBy(authentication.getName());

        ProjectDTO updatedProject = projectService.updateProject(id, ProjectDTO);
        return new ResponseEntity<>(updatedProject, HttpStatus.OK);
    }

    /**
     * 프로젝트 업데이트 (Multipart) - 구매요청과 동일한 방식으로 수정
     */
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProjectDTO> updateProjectWithFiles(
            @PathVariable Long id,
            @Valid @RequestPart("ProjectDTO") ProjectDTO ProjectDTO,
            @RequestPart(value = "files", required = false) MultipartFile[] files) {

        // 파일 정보 설정
        ProjectDTO.setFiles(files);

        // 업데이트 요청자 설정
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        ProjectDTO.setUpdatedBy(authentication.getName());

        ProjectDTO updatedProject = projectService.updateProject(id, ProjectDTO);
        return new ResponseEntity<>(updatedProject, HttpStatus.OK);
    }

    /**
     * 프로젝트 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        // Spring Security Context에서 인증 정보 가져오기
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserName = authentication.getName();

        projectService.deleteProject(id, currentUserName);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    /**
     * 첨부파일 추가
     */
    @PostMapping("/{id}/attachments")
    public ResponseEntity<ProjectDTO> addAttachmentsToProject(
            @PathVariable Long id,
            @RequestParam("files") MultipartFile[] files) {

        // 인증 정보 가져오기
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();

        ProjectDTO updatedProject = projectService.addAttachmentsToProject(id, files, currentUsername);
        return new ResponseEntity<>(updatedProject, HttpStatus.OK);
    }

    /**
     * 첨부파일 다운로드
     */
    @GetMapping("/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable Long attachmentId,
            @RequestHeader(value = "User-Agent", required = false) String userAgent) {

        Resource resource = projectService.downloadAttachment(attachmentId);

        String filename = resource.getFilename();
        String encodedFilename = UriUtils.encode(filename, StandardCharsets.UTF_8);

        // 브라우저에 따른 인코딩 처리 (IE, Edge에 대한 특별 처리)
        if (userAgent != null && (userAgent.contains("Trident") || userAgent.contains("Edge"))) {
            encodedFilename = encodedFilename.replaceAll("\\+", "%20");
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + encodedFilename + "\"; " +
                                "filename*=UTF-8''" + encodedFilename)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE)
                .body(resource);
    }
}