package com.orbit.entity.approval;

import com.orbit.entity.member.Member;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "positions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Position {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String name;

    @Column(nullable = false)
    private int level;

    @Column(length = 200)
    private String description;

    @OneToMany(mappedBy = "position", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Member> members = new ArrayList<>();

    public static final int MIN_APPROVAL_LEVEL = 3;

    // 연관 관계 편의 메서드
    public void addMember(Member member) {
        this.members.add(member);
        member.setPosition(this);
    }

}


