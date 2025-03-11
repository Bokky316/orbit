package com.orbit.config.datainitializer;

import com.orbit.entity.approval.Department;
import com.orbit.entity.approval.Position;
import com.orbit.entity.item.Category;
import com.orbit.entity.item.Item;
import com.orbit.entity.member.Member;

import com.orbit.repository.item.CategoryRepository;
import com.orbit.repository.item.ItemRepository;
import com.orbit.repository.member.MemberRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(
            CategoryRepository categoryRepository,
            ItemRepository itemRepository,
            DepartmentRepository departmentRepository,
            PositionRepository positionRepository,
            MemberRepository memberRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {
            // 1. 카테고리 초기화
            Category computer = createCategory("컴퓨터");
            Category software = createCategory("소프트웨어");
            Category office = createCategory("사무용품");
            categoryRepository.saveAll(List.of(computer, software, office));

            // 2. 품목 초기화
            createItem(computer, "노트북", "1500000", "i7/16GB/512GB SSD");
            createItem(computer, "데스크탑", "1200000", "i5/8GB/256GB SSD");
            createItem(software, "윈도우10 프로", "250000", "정품라이선스");
            createItem(office, "복합기", "500000", "A3지지원");

            // 3. 부서/직급 초기화
            Department hr = createDepartment("인사팀", "HRD001");
            Department purchase = createDepartment("구매팀", "PUR002");
            Department dev = createDepartment("IT개발팀", "DEV003");

            Position staff = createPosition("사원", 1);
            Position assistantManager = createPosition("대리", 2);
            Position manager = createPosition("과장", 3);
            Position director = createPosition("부장", 4);

            // 4. 멤버 초기화
            createMember("admin", "관리자", "admin@orbit.com", "Orbit Inc.",
                    hr, director, Member.Role.ADMIN, passwordEncoder);

            createMember("cs.kim", "김철수", "cs.kim@orbit.com", "Orbit Inc.",
                    hr, staff, Member.Role.BUYER, passwordEncoder);

            createMember("yh.lee", "이영희", "yh.lee@orbit.com", "Orbit Inc.",
                    purchase, manager, Member.Role.BUYER, passwordEncoder);
        };

        // 헬퍼 메서드들
        private Category createCategory(String name) {
            Category category = new Category();
            category.setName(name);
            return category;
        }

        private Item createItem(Category category, String name, String price, String spec) {
            Item item = new Item();
            item.setCategory(category);
            item.setName(name);
            item.setUnitPrice(new BigDecimal(price));
            item.setSpec(spec);
            return itemRepository.save(item);
        }

        private Department createDepartment(String name, String code) {
            Department dept = new Department();
            dept.setName(name);
            dept.setCode(code);
            return departmentRepository.save(dept);
        }

        private Position createPosition(String name, int level) {
            Position pos = new Position();
            pos.setName(name);
            pos.setLevel(level);
            return positionRepository.save(pos);
        }

        private void createMember(String username, String name, String email, String company,
                Department dept, Position pos, Member.Role role,
                PasswordEncoder encoder) {
            Member member = Member.builder()
                    .username(username)
                    .name(name)
                    .email(email)
                    .companyName(company)
                    .password(encoder.encode("password123!"))
                    .role(role)
                    .build();

            member.setDepartment(dept);
            member.setPosition(pos);
            memberRepository.save(member);
        }
    }
}
