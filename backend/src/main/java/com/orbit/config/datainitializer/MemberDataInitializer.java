package com.orbit.config.datainitializer;

import com.orbit.entity.approval.Department;
import com.orbit.entity.approval.Position;
import com.orbit.entity.member.Member;
import com.orbit.repository.approval.DepartmentRepository;
import com.orbit.repository.approval.PositionRepository;
import com.orbit.repository.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class MemberDataInitializer {

    private final MemberRepository memberRepo;
    private final DepartmentRepository departmentRepo;
    private final PositionRepository positionRepo;
    private final PasswordEncoder passwordEncoder;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void initializeData() {
        // 로깅 강화
        log.info("Starting member data initialization process...");
        log.info("Current database state:");
        log.info("Department count: {}", departmentRepo.count());
        log.info("Position count: {}", positionRepo.count());
        log.info("Member count: {}", memberRepo.count());

        // 부서가 없는 경우에만 초기화
        if (departmentRepo.count() == 0) {
            log.info("No departments found. Initializing data...");

            try {
                // 1. 부서 생성 및 저장
                List<Department> departments = createDepartments();
                departments = departmentRepo.saveAll(departments);
                log.info("Departments saved successfully. Count: {}", departments.size());

                // 2. 직급 생성 및 저장
                List<Position> positions = createPositions();
                positions = positionRepo.saveAll(positions);
                log.info("Positions saved successfully. Count: {}", positions.size());

                // 3. 멤버 생성 및 저장
                List<Member> members = createMembers(departments, positions);
                members = memberRepo.saveAll(members);
                log.info("Members saved successfully. Count: {}", members.size());

                // 각 멤버의 상세 정보 로깅
                for (Member member : members) {
                    log.info("Created Member - Name: {}, Username: {}, Department: {}, Position: {}",
                            member.getName(),
                            member.getUsername(),
                            member.getDepartment() != null ? member.getDepartment().getName() : "No Department",
                            member.getPosition() != null ? member.getPosition().getName() : "No Position"
                    );
                }

            } catch (Exception e) {
                log.error("Error during data initialization", e);
                throw new RuntimeException("Data initialization failed", e);
            }
        } else {
            log.info("Departments already exist. Skipping initialization.");
        }
    }

    private List<Department> createDepartments() {
        return List.of(
                Department.builder()
                        .name("구매관리팀")
                        .code("DEPT-001")
                        .description("구매 및 조달 관리 부서")
                        .build(),
                Department.builder()
                        .name("IT인프라팀")
                        .code("DEPT-002")
                        .description("IT 인프라 관리 부서")
                        .build(),
                Department.builder()
                        .name("총무기획팀")
                        .code("DEPT-003")
                        .description("총무 및 기획 부서")
                        .build(),
                Department.builder()
                        .name("재무회계팀")
                        .code("DEPT-004")
                        .description("재무 및 회계 관리 부서")
                        .build()
        );
    }

    private List<Position> createPositions() {
        return List.of(
                Position.builder()
                        .name("사원")
                        .level(1)
                        .description("초급 직급")
                        .build(),
                Position.builder()
                        .name("대리")
                        .level(2)
                        .description("중급 직급")
                        .build(),
                Position.builder()
                        .name("과장")
                        .level(3)
                        .description("결재 가능 직급")
                        .build(),
                Position.builder()
                        .name("차장")
                        .level(4)
                        .description("고위 결재 직급")
                        .build(),
                Position.builder()
                        .name("부장")
                        .level(5)
                        .description("최종 결재 직급")
                        .build()
        );
    }

    private List<Member> createMembers(List<Department> departments, List<Position> positions) {
        // departments와 positions에서 해당하는 엔티티를 찾아 사용
        Department buyerDept = findDepartmentByName(departments, "구매관리팀");
        Department itDept = findDepartmentByName(departments, "IT인프라팀");
        Department generalAffairsDept = findDepartmentByName(departments, "총무기획팀");
        Department financeDept = findDepartmentByName(departments, "재무회계팀");

        Position manager = findPositionByName(positions, "과장");
        Position assistant = findPositionByName(positions, "대리");
        Position seniorManager = findPositionByName(positions, "차장");
        Position director = findPositionByName(positions, "부장");

        return List.of(
                createMember("구매001", "김경란", "buyer001", buyerDept, manager, Member.Role.BUYER),
                createMember("구매002", "박지훈", "buyer002", buyerDept, assistant, Member.Role.BUYER),
                createMember("IT001", "이승호", "it001", itDept, seniorManager, Member.Role.BUYER),
                createMember("총무001", "최윤정", "manager001", generalAffairsDept, director, Member.Role.ADMIN),
                createMember("재무001", "정상훈", "finance001", financeDept, seniorManager, Member.Role.BUYER),
                createMember("testuser1", "Test User", "1234", buyerDept, assistant, Member.Role.BUYER)
        );
    }

    private Department findDepartmentByName(List<Department> departments, String name) {
        return departments.stream()
                .filter(d -> name.equals(d.getName()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(name + "을 찾을 수 없습니다."));
    }

    private Position findPositionByName(List<Position> positions, String name) {
        return positions.stream()
                .filter(p -> name.equals(p.getName()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(name + " 직급을 찾을 수 없습니다."));
    }

    private Member createMember(String username, String name, String password,
                                Department department, Position position, Member.Role role) {
        Member member = Member.builder()
                .username(username)
                .name(name)
                .password(passwordEncoder.encode(password))
                .email(username + "@orbit.com")
                .companyName("오비트 주식회사")
                .contactNumber("010-" + generateRandomPhoneNumber())
                .role(role)
                .enabled(true)
                .build();

        member.setDepartment(department);
        member.setPosition(position);

        return member;
    }

    private String generateRandomPhoneNumber() {
        return String.format("%04d-%04d",
                (int)(Math.random() * 10000),
                (int)(Math.random() * 10000)
        );
    }
}