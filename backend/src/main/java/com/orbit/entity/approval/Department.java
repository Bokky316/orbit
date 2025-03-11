package com.orbit.entity.approval;

import com.orbit.entity.member.Member;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

import com.orbit.entity.member.Member;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "department")
@Getter
@Setter
@NoArgsConstructor
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 20, unique = true)
    private String code;

    @OneToMany(mappedBy = "department", cascade = CascadeType.ALL)
    private List<Member> members = new ArrayList<>(); // Employee → Member로 변경

    // 연관 관계 편의 메서드
    public void addMember(Member member) {
        this.members.add(member);
        member.setDepartment(this);
    }
}
