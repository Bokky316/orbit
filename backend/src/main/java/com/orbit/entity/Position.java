package com.orbit.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * 직급 정보를 나타내는 엔티티 클래스
 */
@Entity
@Table(name = "positions")
@Getter
@Setter
public class Position {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;
}
