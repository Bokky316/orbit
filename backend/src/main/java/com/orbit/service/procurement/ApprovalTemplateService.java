package com.orbit.service.procurement;

import com.orbit.dto.approval.ApprovalTemplateDTO;
import com.orbit.dto.approval.ApprovalTemplateStepDTO;
import com.orbit.dto.approval.DepartmentDTO;
import com.orbit.entity.approval.ApprovalTemplate;
import com.orbit.entity.approval.ApprovalTemplateStep;
import com.orbit.entity.approval.Department;
import com.orbit.exception.ResourceNotFoundException;
import com.orbit.repository.approval.ApprovalTemplateRepository;
import com.orbit.repository.approval.ApprovalTemplateStepRepository;
import com.orbit.repository.approval.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ApprovalTemplateService {

    private final ApprovalTemplateRepository templateRepository;
    private final ApprovalTemplateStepRepository stepRepository;
    private final DepartmentRepository departmentRepository;

    /**
     * 모든 결재 템플릿 조회
     */
    @Transactional(readOnly = true)
    public List<ApprovalTemplateDTO> getAllTemplates() {
        return templateRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * 활성화된 결재 템플릿만 조회
     */
    @Transactional(readOnly = true)
    public List<ApprovalTemplateDTO> getActiveTemplates() {
        return templateRepository.findByActiveTrue().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * 템플릿 ID로 단일 템플릿 조회
     */
    @Transactional(readOnly = true)
    public ApprovalTemplateDTO getTemplateById(Long id) {
        ApprovalTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("템플릿을 찾을 수 없습니다. ID: " + id));
        return convertToDTO(template);
    }

    /**
     * 결재 템플릿 생성
     */
    public ApprovalTemplateDTO createTemplate(ApprovalTemplateDTO dto) {
        // 1. 템플릿 기본 정보 저장
        ApprovalTemplate template = ApprovalTemplate.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .active(dto.isActive())
                .build();

        ApprovalTemplate savedTemplate = templateRepository.save(template);

        // 2. 템플릿 단계 저장
        List<ApprovalTemplateStep> steps = new ArrayList<>();
        if (dto.getSteps() != null && !dto.getSteps().isEmpty()) {
            for (ApprovalTemplateStepDTO stepDTO : dto.getSteps()) {
                // DepartmentDTO에서 ID만 추출하여 실제 부서 엔티티 조회
                Long departmentId = stepDTO.getDepartment().getId();
                Department department = departmentRepository.findById(departmentId)
                        .orElseThrow(() -> new ResourceNotFoundException("부서를 찾을 수 없습니다. ID: " + departmentId));

                ApprovalTemplateStep step = ApprovalTemplateStep.builder()
                        .template(savedTemplate)
                        .step(stepDTO.getStep())
                        .department(department)
                        .minLevel(stepDTO.getMinLevel())
                        .maxLevel(stepDTO.getMaxLevel())
                        .description(stepDTO.getDescription())
                        .build();

                steps.add(step);
            }
            stepRepository.saveAll(steps);
        }

        // 저장된 템플릿 조회하여 반환
        return getTemplateById(savedTemplate.getId());
    }

    /**
     * 결재 템플릿 수정
     */
    public ApprovalTemplateDTO updateTemplate(Long id, ApprovalTemplateDTO dto) {
        // 1. 기존 템플릿 조회
        ApprovalTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("템플릿을 찾을 수 없습니다. ID: " + id));

        // 2. 템플릿 기본 정보 수정
        template.setName(dto.getName());
        template.setDescription(dto.getDescription());
        template.setActive(dto.isActive());

        templateRepository.save(template);

        // 3. 기존 단계 삭제
        stepRepository.deleteByTemplateId(id);

        // 4. 새 단계 저장
        List<ApprovalTemplateStep> steps = new ArrayList<>();
        if (dto.getSteps() != null && !dto.getSteps().isEmpty()) {
            for (ApprovalTemplateStepDTO stepDTO : dto.getSteps()) {
                // DepartmentDTO에서 ID만 추출하여 실제 부서 엔티티 조회
                Long departmentId = stepDTO.getDepartment().getId();
                Department department = departmentRepository.findById(departmentId)
                        .orElseThrow(() -> new ResourceNotFoundException("부서를 찾을 수 없습니다. ID: " + departmentId));

                ApprovalTemplateStep step = ApprovalTemplateStep.builder()
                        .template(template)
                        .step(stepDTO.getStep())
                        .department(department)
                        .minLevel(stepDTO.getMinLevel())
                        .maxLevel(stepDTO.getMaxLevel())
                        .description(stepDTO.getDescription())
                        .build();

                steps.add(step);
            }
            stepRepository.saveAll(steps);
        }

        // 수정된 템플릿 조회하여 반환
        return getTemplateById(id);
    }

    /**
     * 결재 템플릿 삭제
     */
    public void deleteTemplate(Long id) {
        // 템플릿 존재 여부 확인
        if (!templateRepository.existsById(id)) {
            throw new ResourceNotFoundException("템플릿을 찾을 수 없습니다. ID: " + id);
        }

        // 단계 먼저 삭제
        stepRepository.deleteByTemplateId(id);

        // 템플릿 삭제
        templateRepository.deleteById(id);
    }

    /**
     * 결재 템플릿 활성화/비활성화 토글
     */
    public ApprovalTemplateDTO toggleTemplateActive(Long id) {
        ApprovalTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("템플릿을 찾을 수 없습니다. ID: " + id));

        // 상태 반전
        template.setActive(!template.isActive());
        templateRepository.save(template);

        return convertToDTO(template);
    }

    /**
     * 엔티티를 DTO로 변환 - 수정된 부분
     */
    private ApprovalTemplateDTO convertToDTO(ApprovalTemplate template) {
        // 단계 정보 변환
        List<ApprovalTemplateStepDTO> steps = template.getSteps().stream()
                .map(step -> {
                    // Department 엔티티를 DepartmentDTO로 변환
                    Department dept = step.getDepartment();
                    DepartmentDTO deptDTO = DepartmentDTO.builder()
                            .id(dept.getId())
                            .name(dept.getName())
                            .code(dept.getCode())
                            .description(dept.getDescription())
                            .teamLeaderLevel(dept.getTeamLeaderLevel())
                            .middleManagerLevel(dept.getMiddleManagerLevel())
                            .upperManagerLevel(dept.getUpperManagerLevel())
                            .executiveLevel(dept.getExecutiveLevel())
                            .build();

                    // ApprovalTemplateStepDTO 생성 시 DepartmentDTO 사용
                    return ApprovalTemplateStepDTO.builder()
                            .step(step.getStep())
                            .department(deptDTO)  // Department 엔티티 대신 DepartmentDTO 사용
                            .minLevel(step.getMinLevel())
                            .maxLevel(step.getMaxLevel())
                            .description(step.getDescription())
                            .build();
                })
                .sorted((s1, s2) -> s1.getStep() - s2.getStep())
                .collect(Collectors.toList());

        return ApprovalTemplateDTO.builder()
                .id(template.getId())
                .name(template.getName())
                .description(template.getDescription())
                .active(template.isActive())
                .steps(steps)
                .build();
    }
}