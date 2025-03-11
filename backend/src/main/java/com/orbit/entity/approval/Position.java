package com.orbit.entity.approval;

import com.orbit.entity.member.Member;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "position")
@Getter
@Setter
@NoArgsConstructor
public class Position {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String name;

    @Column(nullable = false)
    private int level;

    @OneToMany(mappedBy = "position", cascade = CascadeType.ALL)
    private List<Member> members = new ArrayList<>();

    public static final int MIN_APPROVAL_LEVEL = 3;

    // 연관 관계 편의 메서드
    public void addMember(Member member) {
        this.members.add(member);
        member.setPosition(this);
    }
}
