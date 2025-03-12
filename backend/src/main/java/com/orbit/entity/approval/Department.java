package com.orbit.entity.approval;

import com.orbit.entity.member.Member;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "department")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 20, unique = true)
    private String code;

    @Column(length = 200)
    private String description;

    @OneToMany(mappedBy = "department", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Member> members = new ArrayList<>();

    // 연관 관계 편의 메서드
    public void addMember(Member member) {
        this.members.add(member);
        member.setDepartment(this);
    }
}