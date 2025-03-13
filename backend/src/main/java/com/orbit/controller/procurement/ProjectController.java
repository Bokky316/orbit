package com.orbit.controller.procurement;

import com.orbit.dto.procurement.ProjectRequestDTO;
import com.orbit.dto.procurement.ProjectResponseDTO;
import com.orbit.service.procurement.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    /**
     * 프로젝트 생성 (JSON)
     */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ProjectResponseDTO> createProject(
            @Valid @RequestBody ProjectRequestDTO projectRequestDTO) {

        // Spring Security Context에서 인증 정보 가져오기
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserName = authentication.getName();

        // ProjectService에 인증 정보 전달
        ProjectResponseDTO createdProject = projectService.createProject(projectRequestDTO, currentUserName);
        return new ResponseEntity<>(createdProject, HttpStatus.CREATED);
    }

    /**
     * 프로젝트 생성 (Multipart) - 구매요청과 동일한 방식으로 수정
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProjectResponseDTO> createProjectWithFiles(
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

        // ProjectRequestDTO 객체 생성
        ProjectRequestDTO projectRequestDTO = new ProjectRequestDTO();
        projectRequestDTO.setProjectName(projectName);
        projectRequestDTO.setBusinessCategory(businessCategory);
        projectRequestDTO.setClientCompany(clientCompany);
        projectRequestDTO.setContractType(contractType);
        projectRequestDTO.setTotalBudget(totalBudget);
        projectRequestDTO.setRemarks(remarks);
        projectRequestDTO.setBasicStatus(basicStatus);
        projectRequestDTO.setProcurementStatus(procurementStatus);
        projectRequestDTO.setRequestDepartment(requestDepartment);

        // 기간 정보 설정
        ProjectRequestDTO.PeriodInfo periodInfo = new ProjectRequestDTO.PeriodInfo();
        if (startDate != null) {
            periodInfo.setStartDate(LocalDate.parse(startDate));
        }
        if (endDate != null) {
            periodInfo.setEndDate(LocalDate.parse(endDate));
        }
        projectRequestDTO.setProjectPeriod(periodInfo);

        // 파일 정보 설정
        projectRequestDTO.setFiles(files);

        // Spring Security Context에서 인증 정보 가져오기
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserName = authentication.getName();

        // ProjectService에 인증 정보 전달
        ProjectResponseDTO createdProject = projectService.createProject(projectRequestDTO, currentUserName);
        return new ResponseEntity<>(createdProject, HttpStatus.CREATED);
    }

    /**
     * 프로젝트 조회 (ID)
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponseDTO> getProjectById(@PathVariable Long id) {
        ProjectResponseDTO project = projectService.getProjectById(id);
        return new ResponseEntity<>(project, HttpStatus.OK);
    }

    /**
     * 모든 프로젝트 조회
     */
    @GetMapping
    public ResponseEntity<List<ProjectResponseDTO>> getAllProjects() {
        List<ProjectResponseDTO> projects = projectService.getAllProjects();
        return new ResponseEntity<>(projects, HttpStatus.OK);
    }

    /**
     * 프로젝트 업데이트 (JSON)
     */
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ProjectResponseDTO> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody ProjectRequestDTO projectRequestDTO) {

        // 업데이트 요청자 설정
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        projectRequestDTO.setUpdatedBy(authentication.getName());

        ProjectResponseDTO updatedProject = projectService.updateProject(id, projectRequestDTO);
        return new ResponseEntity<>(updatedProject, HttpStatus.OK);
    }

    /**
     * 프로젝트 업데이트 (Multipart) - 구매요청과 동일한 방식으로 수정
     */
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProjectResponseDTO> updateProjectWithFiles(
            @PathVariable Long id,
            @Valid @RequestPart("projectRequestDTO") ProjectRequestDTO projectRequestDTO,
            @RequestPart(value = "files", required = false) MultipartFile[] files) {

        // 파일 정보 설정
        projectRequestDTO.setFiles(files);

        // 업데이트 요청자 설정
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        projectRequestDTO.setUpdatedBy(authentication.getName());

        ProjectResponseDTO updatedProject = projectService.updateProject(id, projectRequestDTO);
        return new ResponseEntity<>(updatedProject, HttpStatus.OK);
    }

    /**
     * 프로젝트 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    /**
     * 첨부파일 추가
     */
    @PostMapping("/{id}/attachments")
    public ResponseEntity<ProjectResponseDTO> addAttachmentsToProject(
            @PathVariable Long id,
            @RequestParam("files") MultipartFile[] files) {

        // 인증 정보 가져오기
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();

        ProjectResponseDTO updatedProject = projectService.addAttachmentsToProject(id, files, currentUsername);
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