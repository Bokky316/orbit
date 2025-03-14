package com.orbit.service.procurement;

import com.orbit.dto.approval.DepartmentDTO;
import com.orbit.entity.approval.Department;
import com.orbit.exception.DuplicateResourceException;
import com.orbit.exception.ResourceNotFoundException;
import com.orbit.repository.approval.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    /**
     * 모든 부서 정보 조회
     */
    @Transactional(readOnly = true)
    public List<DepartmentDTO> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * 부서 ID로 단일 부서 조회
     */
    @Transactional(readOnly = true)
    public DepartmentDTO getDepartmentById(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("부서를 찾을 수 없습니다. ID: " + id));
        return convertToDTO(department);
    }

    /**
     * 키워드로 부서 검색
     */
    @Transactional(readOnly = true)
    public List<DepartmentDTO> searchDepartments(String keyword) {
        return departmentRepository.searchDepartmentsByKeyword(keyword).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * 부서 생성
     */
    public DepartmentDTO createDepartment(DepartmentDTO dto) {
        // 부서 코드 중복 검사
        if (departmentRepository.existsByCode(dto.getCode())) {
            throw new DuplicateResourceException("이미 존재하는 부서 코드입니다: " + dto.getCode());
        }

        Department department = Department.builder()
                .name(dto.getName())
                .code(dto.getCode())
                .description(dto.getDescription())
                .teamLeaderLevel(dto.getTeamLeaderLevel())
                .middleManagerLevel(dto.getMiddleManagerLevel())
                .upperManagerLevel(dto.getUpperManagerLevel())
                .executiveLevel(dto.getExecutiveLevel())
                .build();

        Department savedDepartment = departmentRepository.save(department);
        return convertToDTO(savedDepartment);
    }

    /**
     * 부서 정보 수정
     */
    public DepartmentDTO updateDepartment(Long id, DepartmentDTO dto) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("부서를 찾을 수 없습니다. ID: " + id));

        // 다른 부서와 코드 중복 검사 (같은 ID는 제외)
        if (!department.getCode().equals(dto.getCode()) && departmentRepository.existsByCode(dto.getCode())) {
            throw new DuplicateResourceException("이미 존재하는 부서 코드입니다: " + dto.getCode());
        }

        // 부서 정보 업데이트
        department.setName(dto.getName());
        department.setCode(dto.getCode());
        department.setDescription(dto.getDescription());
        department.setTeamLeaderLevel(dto.getTeamLeaderLevel());
        department.setMiddleManagerLevel(dto.getMiddleManagerLevel());
        department.setUpperManagerLevel(dto.getUpperManagerLevel());
        department.setExecutiveLevel(dto.getExecutiveLevel());

        Department updatedDepartment = departmentRepository.save(department);
        return convertToDTO(updatedDepartment);
    }

    /**
     * 부서 삭제
     */
    public void deleteDepartment(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("부서를 찾을 수 없습니다. ID: " + id));

        // 부서에 소속된 멤버가 있는지 확인 (안전 장치)
        if (!department.getMembers().isEmpty()) {
            throw new IllegalStateException("소속 멤버가 있는 부서는 삭제할 수 없습니다. 부서 ID: " + id);
        }

        departmentRepository.delete(department);
    }

    /**
     * 부서 엔티티를 DTO로 변환
     */
    private DepartmentDTO convertToDTO(Department department) {
        return DepartmentDTO.builder()
                .id(department.getId())
                .name(department.getName())
                .code(department.getCode())
                .description(department.getDescription())
                .teamLeaderLevel(department.getTeamLeaderLevel())
                .middleManagerLevel(department.getMiddleManagerLevel())
                .upperManagerLevel(department.getUpperManagerLevel())
                .executiveLevel(department.getExecutiveLevel())
                .build();
    }
}
