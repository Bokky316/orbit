package com.orbit.service.procurement;

import com.orbit.dto.procurement.ProjectAttachmentDTO;
import com.orbit.dto.procurement.ProjectRequestDTO;
import com.orbit.dto.procurement.ProjectResponseDTO;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.entity.member.Member;
import com.orbit.entity.project.Project;
import com.orbit.entity.project.ProjectAttachment;
import com.orbit.exception.ProjectNotFoundException;
import com.orbit.repository.commonCode.ChildCodeRepository;
import com.orbit.repository.commonCode.ParentCodeRepository;
import com.orbit.repository.procurement.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ParentCodeRepository parentCodeRepository;
    private final ChildCodeRepository childCodeRepository;
    private final ProjectAttachmentRepository projectAttachmentRepository;
    private final MemberRepository memberRepository;

    @Value("${uploadPath}")
    private String uploadPath;

    /**
     * 모든 프로젝트 조회
     */
    @Transactional(readOnly = true)
    public List<ProjectDTO> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 단일 프로젝트 조회
     */
    @Transactional(readOnly = true)
    public ProjectDTO getProjectById(Long id) {
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

        // 1. 상태 코드 설정
        setProjectStatusCodes(project, dto.getBasicStatus(), dto.getProcurementStatus());

        // 2. 프로젝트 생성자 설정
        Member creator = memberRepository.findByUsername(currentUserName)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
        project.setRequester(creator);

        // 3. 프로젝트 저장
        Project savedProject = projectRepository.save(project);

        // 4. 첨부파일 처리
        if (dto.getFiles() != null && dto.getFiles().length > 0) {
            processAttachments(savedProject, dto.getFiles(), creator);
        }

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

        // 2. 프로젝트 업데이트
        updateProjectDetails(project, dto);

        // 3. 상태 코드 업데이트
        setProjectStatusCodes(project, dto.getBasicStatus(), dto.getProcurementStatus());

        // 4. 첨부파일 처리
        if (dto.getFiles() != null && dto.getFiles().length > 0) {
            Member updater = memberRepository.findByUsername(dto.getUpdatedBy())
                    .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
            processAttachments(project, dto.getFiles(), updater);
        }

        // 5. 저장 후 DTO 반환
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
     * 첨부파일 추가
     */
    @Transactional
    public ProjectResponseDTO addAttachmentsToProject(Long id, MultipartFile[] files, String username) {
        // 1. 프로젝트 조회
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException("ID " + id + "에 해당하는 프로젝트를 찾을 수 없습니다."));

        // 2. 사용자 조회
        Member uploader = memberRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));

        // 3. 첨부파일 처리
        processAttachments(project, files, uploader);

        // 4. DTO 반환
        return convertToDto(project);
    }

    /**
     * 첨부파일 다운로드
     */
    public Resource downloadAttachment(Long attachmentId) {
        // 1. 첨부파일 조회
        ProjectAttachment attachment = projectAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("ID " + attachmentId + "에 해당하는 첨부파일이 없습니다."));

        // 2. 파일 경로 확인 및 Resource 생성
        Path file = Paths.get(uploadPath).resolve(attachment.getFilePath());
        Resource resource = new FileSystemResource(file);

        if (!resource.exists() || !resource.isReadable()) {
            throw new ResourceNotFoundException("파일을 다운로드할 수 없습니다: " + attachment.getOriginalFilename());
        }

        return resource;
    }

    /**
     * 첨부파일 처리
     */
    private void processAttachments(Project project, MultipartFile[] files, Member uploader) {
        if (files == null || files.length == 0) return;

        try {
            Path baseDir = Paths.get(uploadPath).toAbsolutePath();
            String subDir = "project_" + project.getId();
            Path targetDir = baseDir.resolve(subDir);
            Files.createDirectories(targetDir);

            for (MultipartFile file : files) {
                String fileName = StringUtils.cleanPath(file.getOriginalFilename()).replaceAll("[^a-zA-Z0-9.-]", "_");
                String uniqueFileName = System.currentTimeMillis() + "_" + fileName;
                Path targetPath = targetDir.resolve(uniqueFileName);
                Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
                String relativePath = Paths.get(subDir, uniqueFileName).toString().replace("\\", "/");

                // 파일 확장자 추출
                String fileExtension = null;
                if (fileName.contains(".")) {
                    fileExtension = fileName.substring(fileName.lastIndexOf(".") + 1);
                }

                ProjectAttachment attachment = ProjectAttachment.builder()
                        .originalFilename(fileName)
                        .storedFilename(uniqueFileName)
                        .filePath(relativePath)
                        .fileSize(file.getSize())
                        .fileExtension(fileExtension)
                        .project(project)
                        .uploadedBy(uploader)
                        .uploadedAt(LocalDateTime.now())
                        .build();

                projectAttachmentRepository.save(attachment);
                project.addAttachment(attachment);
            }
        } catch (IOException e) {
            log.error("파일 저장 실패: {}", e.getMessage(), e);
            throw new RuntimeException("파일 처리 중 오류 발생", e);
        }
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
        project.setRequestDepartment(dto.getRequestDepartment());
        project.setBudgetCode(dto.getBudgetCode());
        project.setRemarks(dto.getRemarks());

        // 프로젝트 기간 업데이트
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
                .requestDepartment(dto.getRequestDepartment())
                .budgetCode(dto.getBudgetCode())
                .remarks(dto.getRemarks())
                .attachments(new ArrayList<>()) // 빈 리스트로 초기화 추가
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
        dto.setRequestDepartment(project.getRequestDepartment());
        dto.setBudgetCode(project.getBudgetCode());
        dto.setRemarks(project.getRemarks());

        // 요청자 설정
        if (project.getRequester() != null) {
            dto.setRequesterName(project.getRequester().getUsername());
        }

        // 상태 코드 설정
        setDtoStatusCodes(project, dto);

        // 프로젝트 기간 설정
        ProjectResponseDTO.PeriodInfo periodInfo = new ProjectResponseDTO.PeriodInfo();
        if (project.getProjectPeriod() != null) {
            periodInfo.setStartDate(project.getProjectPeriod().getStartDate());
            periodInfo.setEndDate(project.getProjectPeriod().getEndDate());
        }
        dto.setProjectPeriod(periodInfo);

        // 첨부파일 설정 - 항상 설정
        List<ProjectAttachmentDTO> attachmentDTOs = new ArrayList<>();
        if (project.getAttachments() != null) {
            attachmentDTOs = project.getAttachments().stream()
                    .map(this::convertAttachmentToDto)
                    .collect(Collectors.toList());
        }
        dto.setAttachments(attachmentDTOs);

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

    /**
     * 첨부파일 엔티티 -> DTO 변환
     */
    private ProjectAttachmentDTO convertAttachmentToDto(ProjectAttachment attachment) {
        return ProjectAttachmentDTO.builder()
                .id(attachment.getId())
                .fileName(attachment.getOriginalFilename())
                .fileSize(attachment.getFileSize())
                .fileExtension(attachment.getFileExtension())
                .uploadedBy(attachment.getUploadedBy() != null ? attachment.getUploadedBy().getUsername() : null)
                .uploadedAt(attachment.getUploadedAt())
                .description(attachment.getDescription())
                .build();
    }
}