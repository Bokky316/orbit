package com.orbit.controller.organization;

import com.orbit.dto.approval.DepartmentDTO;
import com.orbit.dto.member.MemberDTO;
import com.orbit.service.organization.OrganizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 조직 관련 API 컨트롤러 (부서 및 멤버 정보 조회)
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/organization")
public class OrganizationController {

    private final OrganizationService organizationService;

    /**
     * 모든 부서 목록을 조회하는 API
     */
    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentDTO>> getAllDepartments() {
        List<DepartmentDTO> departments = organizationService.getAllDepartments();
        return ResponseEntity.ok(departments);
    }

    /**
     * 특정 부서 정보를 조회하는 API
     */
    @GetMapping("/departments/{id}")
    public ResponseEntity<DepartmentDTO> getDepartmentById(@PathVariable Long id) {
        DepartmentDTO department = organizationService.getDepartmentById(id);
        return ResponseEntity.ok(department);
    }

    /**
     * 모든 사용자 목록을 조회하는 API
     */
    @GetMapping("/members")
    public ResponseEntity<List<MemberDTO>> getAllMembers() {
        List<MemberDTO> members = organizationService.getAllMembers();
        return ResponseEntity.ok(members);
    }

    /**
     * 특정 부서에 속한 사용자 목록을 조회하는 API
     */
    @GetMapping("/members/department/{departmentId}")
    public ResponseEntity<List<MemberDTO>> getMembersByDepartment(@PathVariable Long departmentId) {
        List<MemberDTO> members = organizationService.getMembersByDepartment(departmentId);
        return ResponseEntity.ok(members);
    }
}