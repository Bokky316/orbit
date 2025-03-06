package com.orbit.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * 부서 정보를 나타내는 엔티티 클래스
 */
@Entity
@Table(name = "departments")
@Getter
@Setter
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;
}
