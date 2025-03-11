package com.orbit.controller.procurement;

import com.orbit.dto.procurement.ProjectRequestDTO;
import com.orbit.dto.procurement.ProjectResponseDTO;
import com.orbit.entity.member.Member;
import com.orbit.service.procurement.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<List<ProjectResponseDTO>> getAllProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponseDTO> getProjectById(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    @PostMapping
    public ResponseEntity<ProjectResponseDTO> createProject(
            @Valid @RequestBody ProjectRequestDTO dto,
            @AuthenticationPrincipal User user) {
        return new ResponseEntity<>(
                projectService.createProject(dto, convertToMember(user)),
                HttpStatus.CREATED
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectResponseDTO> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody ProjectRequestDTO dto,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(projectService.updateProject(id, dto, convertToMember(user)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    private Member convertToMember(User user) {
        // 실제 구현시 사용자 정보 조회 로직 추가
        return new Member();
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