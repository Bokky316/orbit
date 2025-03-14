package com.orbit.service.organization;

import com.orbit.dto.approval.DepartmentDTO;
import com.orbit.dto.member.MemberDTO;
import com.orbit.entity.approval.Department;
import com.orbit.entity.member.Member;
import com.orbit.exception.ResourceNotFoundException;
import com.orbit.repository.approval.DepartmentRepository;
import com.orbit.repository.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 조직 관련 서비스 (부서 및 멤버 정보 조회)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrganizationService {

    private final DepartmentRepository departmentRepository;
    private final MemberRepository memberRepository;

    /**
     * 모든 부서 목록 조회
     */
    @Transactional(readOnly = true)
    public List<DepartmentDTO> getAllDepartments() {
        List<Department> departments = departmentRepository.findAll();
        return departments.stream()
                .map(this::convertToDepartmentDTO)
                .collect(Collectors.toList());
    }

    /**
     * 특정 부서 정보 조회
     */
    @Transactional(readOnly = true)
    public DepartmentDTO getDepartmentById(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ID " + id + "에 해당하는 부서가 없습니다."));
        return convertToDepartmentDTO(department);
    }

    /**
     * 모든 사용자 목록 조회
     */
    @Transactional(readOnly = true)
    public List<MemberDTO> getAllMembers() {
        List<Member> members = memberRepository.findAll();
        return members.stream()
                .map(this::convertToMemberDTO)
                .collect(Collectors.toList());
    }

    /**
     * 특정 부서에 속한 사용자 목록 조회
     */
    @Transactional(readOnly = true)
    public List<MemberDTO> getMembersByDepartment(Long departmentId) {
        List<Member> members = memberRepository.findByDepartmentId(departmentId);
        return members.stream()
                .map(this::convertToMemberDTO)
                .collect(Collectors.toList());
    }

    /**
     * 부서 엔티티를 DTO로 변환
     */
    private DepartmentDTO convertToDepartmentDTO(Department department) {
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

    /**
     * 사용자 엔티티를 DTO로 변환
     */
    private MemberDTO convertToMemberDTO(Member member) {
        MemberDTO dto = MemberDTO.builder()
                .id(member.getId())
                .username(member.getUsername())
                .name(member.getName())
                .email(member.getEmail())
                .contactNumber(member.getContactNumber())
                .companyName(member.getCompanyName())
                .enabled(member.isEnabled())
                .role(member.getRole().name())
                .build();

        // 부서 정보 설정
        if (member.getDepartment() != null) {
            dto.setDepartment(MemberDTO.DepartmentInfo.builder()
                    .id(member.getDepartment().getId())
                    .name(member.getDepartment().getName())
                    .code(member.getDepartment().getCode())
                    .build());
        }

        // 직급 정보 설정
        if (member.getPosition() != null) {
            dto.setPosition(MemberDTO.PositionInfo.builder()
                    .id(member.getPosition().getId())
                    .name(member.getPosition().getName())
                    .level(member.getPosition().getLevel())
                    .build());
        }

        return dto;
    }
}