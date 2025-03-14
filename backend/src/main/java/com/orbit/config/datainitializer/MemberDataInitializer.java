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

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class MemberDataInitializer {

    private final MemberRepository memberRepo;
    private final DepartmentRepository departmentRepo;
    private final PositionRepository positionRepo;
    private final PasswordEncoder passwordEncoder;

    // 직급 레벨 상수 정의
    private static final int STAFF_LEVEL = 1;
    private static final int ASSISTANT_MANAGER_LEVEL = 2;
    private static final int MANAGER_LEVEL = 3;
    private static final int SENIOR_MANAGER_LEVEL = 4;
    private static final int DIRECTOR_LEVEL = 5;
    private static final int EXECUTIVE_LEVEL = 6;
    private static final int CEO_LEVEL = 7;

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
                // 1. 직급 생성 및 저장
                List<Position> positions = createPositions();
                positions = positionRepo.saveAll(positions);
                log.info("Positions saved successfully. Count: {}", positions.size());

                // 2. 부서 생성 및 저장 (직급 레벨 기준 포함)
                List<Department> departments = createDepartments();
                departments = departmentRepo.saveAll(departments);
                log.info("Departments saved successfully. Count: {}", departments.size());

                // 3. 멤버 생성 및 저장 (다양한 부서와 직급으로)
                List<Member> members = createMembers(departments, positions);
                members = memberRepo.saveAll(members);
                log.info("Members saved successfully. Count: {}", members.size());

                // 각 멤버의 상세 정보 로깅
                for (Member member : members) {
                    log.info("Created Member - Name: {}, Username: {}, Department: {}, Position: {} (Level: {})",
                            member.getName(),
                            member.getUsername(),
                            member.getDepartment() != null ? member.getDepartment().getName() : "No Department",
                            member.getPosition() != null ? member.getPosition().getName() : "No Position",
                            member.getPosition() != null ? member.getPosition().getLevel() : 0
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
                        .teamLeaderLevel(MANAGER_LEVEL)
                        .middleManagerLevel(MANAGER_LEVEL)
                        .upperManagerLevel(SENIOR_MANAGER_LEVEL)
                        .executiveLevel(DIRECTOR_LEVEL)
                        .build(),
                Department.builder()
                        .name("IT인프라팀")
                        .code("DEPT-002")
                        .description("IT 인프라 관리 부서")
                        .teamLeaderLevel(MANAGER_LEVEL)
                        .middleManagerLevel(MANAGER_LEVEL)
                        .upperManagerLevel(SENIOR_MANAGER_LEVEL)
                        .executiveLevel(DIRECTOR_LEVEL)
                        .build(),
                Department.builder()
                        .name("총무기획팀")
                        .code("DEPT-003")
                        .description("총무 및 기획 부서")
                        .teamLeaderLevel(MANAGER_LEVEL)
                        .middleManagerLevel(MANAGER_LEVEL)
                        .upperManagerLevel(SENIOR_MANAGER_LEVEL)
                        .executiveLevel(DIRECTOR_LEVEL)
                        .build(),
                Department.builder()
                        .name("재무회계팀")
                        .code("DEPT-004")
                        .description("재무 및 회계 관리 부서")
                        .teamLeaderLevel(MANAGER_LEVEL)
                        .middleManagerLevel(MANAGER_LEVEL)
                        .upperManagerLevel(SENIOR_MANAGER_LEVEL)
                        .executiveLevel(DIRECTOR_LEVEL)
                        .build(),
                Department.builder()
                        .name("재무팀")  // 결재선 로직에서 사용하는 정확한 팀명
                        .code("DEPT-005")
                        .description("재무 관리 부서")
                        .teamLeaderLevel(MANAGER_LEVEL)
                        .middleManagerLevel(MANAGER_LEVEL)
                        .upperManagerLevel(SENIOR_MANAGER_LEVEL)
                        .executiveLevel(DIRECTOR_LEVEL)
                        .build(),
                Department.builder()
                        .name("구매팀")  // 결재선 로직에서 사용하는 정확한 팀명
                        .code("DEPT-006")
                        .description("구매 관리 부서")
                        .teamLeaderLevel(MANAGER_LEVEL)
                        .middleManagerLevel(MANAGER_LEVEL)
                        .upperManagerLevel(SENIOR_MANAGER_LEVEL)
                        .executiveLevel(DIRECTOR_LEVEL)
                        .build(),
                Department.builder()
                        .name("임원") // 결재선 로직에서 사용하는 정확한 부서명
                        .code("DEPT-007")
                        .description("임원진")
                        .teamLeaderLevel(EXECUTIVE_LEVEL)
                        .middleManagerLevel(EXECUTIVE_LEVEL)
                        .upperManagerLevel(EXECUTIVE_LEVEL)
                        .executiveLevel(EXECUTIVE_LEVEL)
                        .build(),
                Department.builder()
                        .name("마케팅팀")
                        .code("DEPT-008")
                        .description("마케팅 부서")
                        .teamLeaderLevel(MANAGER_LEVEL)
                        .middleManagerLevel(MANAGER_LEVEL)
                        .upperManagerLevel(SENIOR_MANAGER_LEVEL)
                        .executiveLevel(DIRECTOR_LEVEL)
                        .build(),
                Department.builder()
                        .name("영업팀")
                        .code("DEPT-009")
                        .description("영업 부서")
                        .teamLeaderLevel(MANAGER_LEVEL)
                        .middleManagerLevel(MANAGER_LEVEL)
                        .upperManagerLevel(SENIOR_MANAGER_LEVEL)
                        .executiveLevel(DIRECTOR_LEVEL)
                        .build(),
                Department.builder()
                        .name("인사팀")
                        .code("DEPT-010")
                        .description("인사 관리 부서")
                        .teamLeaderLevel(MANAGER_LEVEL)
                        .middleManagerLevel(MANAGER_LEVEL)
                        .upperManagerLevel(SENIOR_MANAGER_LEVEL)
                        .executiveLevel(DIRECTOR_LEVEL)
                        .build()
        );
    }

    private List<Position> createPositions() {
        return List.of(
                Position.builder()
                        .name("사원")
                        .level(STAFF_LEVEL)
                        .description("초급 직급")
                        .build(),
                Position.builder()
                        .name("대리")
                        .level(ASSISTANT_MANAGER_LEVEL)
                        .description("중급 직급")
                        .build(),
                Position.builder()
                        .name("과장")
                        .level(MANAGER_LEVEL)
                        .description("결재 가능 직급")
                        .build(),
                Position.builder()
                        .name("차장")
                        .level(SENIOR_MANAGER_LEVEL)
                        .description("고위 결재 직급")
                        .build(),
                Position.builder()
                        .name("부장")
                        .level(DIRECTOR_LEVEL)
                        .description("최종 결재 직급")
                        .build(),
                Position.builder()
                        .name("이사")
                        .level(EXECUTIVE_LEVEL)
                        .description("임원 직급")
                        .build(),
                Position.builder()
                        .name("대표이사")
                        .level(CEO_LEVEL)
                        .description("최고 임원 직급")
                        .build()
        );
    }

    private List<Member> createMembers(List<Department> departments, List<Position> positions) {
        List<Member> members = new ArrayList<>();

        // 기본 positions 가져오기
        Position staff = findPositionByName(positions, "사원");
        Position assistant = findPositionByName(positions, "대리");
        Position manager = findPositionByName(positions, "과장");
        Position seniorManager = findPositionByName(positions, "차장");
        Position director = findPositionByName(positions, "부장");
        Position executive = findPositionByName(positions, "이사");
        Position ceo = findPositionByName(positions, "대표이사");

        // 모든 부서에 대해 다양한 직급의 직원 추가
        for (Department dept : departments) {
            if ("임원".equals(dept.getName())) {
                // 임원 부서는 따로 처리
                members.add(createMember(dept.getCode() + "-001", "김임원", "1234", dept, executive, Member.Role.ADMIN));
                members.add(createMember(dept.getCode() + "-002", "이대표", "1234", dept, ceo, Member.Role.ADMIN));
                continue;
            }

            // 일반 부서
            String deptPrefix = dept.getCode().substring(5);  // "DEPT-001" -> "001"

            // 각 직급별 직원 추가
            members.add(createMember(deptPrefix + "-staff-1", dept.getName() + " 직원1", "1234", dept, staff, Member.Role.BUYER));
            members.add(createMember(deptPrefix + "-staff-2", dept.getName() + " 직원2", "1234", dept, staff, Member.Role.BUYER));

            members.add(createMember(deptPrefix + "-asst-1", dept.getName() + " 대리1", "1234", dept, assistant, Member.Role.BUYER));
            members.add(createMember(deptPrefix + "-asst-2", dept.getName() + " 대리2", "1234", dept, assistant, Member.Role.BUYER));

            members.add(createMember(deptPrefix + "-mgr-1", dept.getName() + " 과장1", "1234", dept, manager, Member.Role.BUYER));

            // 차장은 부서당 한 명
            members.add(createMember(deptPrefix + "-sr-1", dept.getName() + " 차장", "1234", dept, seniorManager, Member.Role.BUYER));

            // 부장은 부서당 한 명
            members.add(createMember(deptPrefix + "-dir-1", dept.getName() + " 부장", "1234", dept, director, Member.Role.ADMIN));
        }

        // 테스트용 추가 계정
        Department purchaseDept = findDepartmentByName(departments, "구매관리팀");
        Department financeDept = findDepartmentByName(departments, "재무팀");
        Department itDept = findDepartmentByName(departments, "IT인프라팀");

        members.add(createMember("testuser1", "테스트 유저1", "1234", purchaseDept, assistant, Member.Role.BUYER));
        members.add(createMember("testuser2", "테스트 유저2", "1234", financeDept, manager, Member.Role.BUYER));
        members.add(createMember("testadmin", "테스트 관리자", "1234", itDept, director, Member.Role.ADMIN));

        // 결재선 테스트용 특정 계정 추가
        Department pureDept = findDepartmentByName(departments, "구매팀");
        Department finDept = findDepartmentByName(departments, "재무팀");
        Department execDept = findDepartmentByName(departments, "임원");

        members.add(createMember("purchaser", "구매담당자", "1234", pureDept, manager, Member.Role.BUYER));
        members.add(createMember("finmanager", "재무담당자", "1234", finDept, seniorManager, Member.Role.BUYER));
        members.add(createMember("executive", "임원결재자", "1234", execDept, executive, Member.Role.ADMIN));

        return members;
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