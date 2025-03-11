package com.orbit.service.procurement;

import com.orbit.dto.procurement.ProjectAttachmentDTO;
import com.orbit.dto.procurement.ProjectDTO;
import com.orbit.dto.procurement.ProjectDTO;
import com.orbit.entity.approval.Department;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.entity.member.Member;
import com.orbit.entity.project.Project;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.exception.ProjectNotFoundException;
import com.orbit.exception.ResourceNotFoundException;
import com.orbit.repository.approval.DepartmentRepository;
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
    private final DepartmentRepository departmentRepository;

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
    public ProjectDTO createProject(ProjectDTO projectDTO, String requesterUsername) {
        // 1. 요청자 정보 조회
        Member requester = memberRepository.findByUsername(requesterUsername)
                .orElseThrow(() -> new ResourceNotFoundException("사용자 정보를 찾을 수 없습니다: " + requesterUsername));

        // 2. DTO를 엔티티로 변환
        Project project = convertToEntity(projectDTO);

        // 3. 요청자 설정
        project.setRequester(requester);

        // 4. 프로젝트 기간 유효성 검사
        validateProjectPeriod(project.getProjectPeriod());

        // 5. 초기 상태 설정 - 항상 '등록' 상태로 시작
        setInitialProjectStatus(project);

        // 6. 프로젝트 저장
        Project savedProject = projectRepository.save(project);

        // 7. 첨부 파일 처리
        if (projectDTO.getFiles() != null && projectDTO.getFiles().length > 0) {
            processProjectAttachments(savedProject, projectDTO.getFiles(), requester);
        }

        // 8. 저장된 엔티티를 DTO로 변환하여 반환
        return convertToDto(savedProject);
    }

    /**
     * 프로젝트 업데이트
     */
    @Transactional
    public ProjectDTO updateProject(Long id, ProjectDTO dto) {
        // 1. 프로젝트 조회
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException("ID " + id + "에 해당하는 프로젝트를 찾을 수 없습니다."));

        // 기본 상태 업데이트
        if (dto.getBasicStatus() != null) {
            String[] basicStatusParts = dto.getBasicStatus().split("-");
            ParentCode basicStatusParent = parentCodeRepository.findByEntityTypeAndCodeGroup(
                    "PROJECT", "STATUS"
            );
            ChildCode basicStatusChild = childCodeRepository.findByParentCodeAndCodeValue(
                    basicStatusParent, basicStatusParts[2]
            );
            project.setBasicStatusParent(basicStatusParent);
            project.setBasicStatusChild(basicStatusChild);
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
    public ProjectDTO addAttachmentsToProject(Long id, MultipartFile[] files, String username) {
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
    private void updateProjectDetails(Project project, ProjectDTO dto) {
        project.setProjectName(dto.getProjectName());
        project.setBusinessCategory(dto.getBusinessCategory());
        project.setTotalBudget(dto.getTotalBudget());
        project.setRequestDepartment(dto.getRequestDepartment());
        project.setBudgetCode(dto.getBudgetCode());
        project.setRemarks(dto.getRemarks());

        // 프로젝트 기간 업데이트
        Project.ProjectPeriod projectPeriod = project.getProjectPeriod();
        projectPeriod.setStartDate(dto.getProjectPeriod().getStartDate());
        projectPeriod.setEndDate(dto.getProjectPeriod().getEndDate());

        // 프로젝트 저장
        Project savedProject = projectRepository.save(project);
        return convertToDto(savedProject);
    }

    /**
     * 프로젝트 삭제
     */
    @Transactional
    public void deleteProject(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found: " + id));
        projectRepository.delete(project);
    }

    /**
     * DTO를 엔티티로 변환
     */
    private Project convertToEntity(ProjectDTO dto) {
        Project project = Project.builder()
                .projectName(dto.getProjectName())
                .businessCategory(dto.getBusinessCategory())
                .totalBudget(dto.getTotalBudget())
                .requestDepartment(dto.getRequestDepartment())
                .budgetCode(dto.getBudgetCode())
                .remarks(dto.getRemarks())
                .attachments(new ArrayList<>()) // 빈 리스트로 초기화 추가
                .build();

        // 부서 설정 (ID가 있는 경우)
        if (dto.getRequestDepartmentId() != null) {
            Department department = departmentRepository.findById(dto.getRequestDepartmentId())
                    .orElse(null);
            if (department != null) {
                project.setDepartment(department);
            }
        }

        // ProjectPeriod 설정
        Project.ProjectPeriod period = new Project.ProjectPeriod();
        period.setStartDate(dto.getProjectPeriod().getStartDate());
        period.setEndDate(dto.getProjectPeriod().getEndDate());
        project.setProjectPeriod(period);

        return project;
    }

    /**
     * 엔티티를 DTO로 변환
     */
    private ProjectDTO convertToDto(Project project) {
        ProjectDTO dto = new ProjectDTO();

        // 기본 정보 설정
        dto.setId(project.getId());
        dto.setProjectIdentifier(project.getProjectIdentifier());
        dto.setProjectName(project.getProjectName());
        dto.setBusinessCategory(project.getBusinessCategory());
        dto.setTotalBudget(project.getTotalBudget());
        dto.setRequestDepartment(project.getRequestDepartment());
        dto.setBudgetCode(project.getBudgetCode());
        dto.setRemarks(project.getRemarks());

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

        // 프로젝트 기간 설정
        ProjectDTO.PeriodInfo periodInfo = new ProjectDTO.PeriodInfo();
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
    private void setDtoStatusCodes(Project project, ProjectDTO dto) {
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