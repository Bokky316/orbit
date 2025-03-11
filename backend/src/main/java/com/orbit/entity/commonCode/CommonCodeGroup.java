package com.orbit.entity.commonCode;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "common_code_group")
@Getter
@Setter
@NoArgsConstructor
public class CommonCodeGroup {
    @Id
    @Column(name = "group_id", length = 20)
    private String id;

    @Column(name = "group_name", length = 100, nullable = false)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "use_yn", length = 1)
    private String useYn = "Y";

    @Column(name = "created_by", length = 50, nullable = false)
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_by", length = 50)
    private String updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CommonCode> codes = new ArrayList<>();

    // 연관관계 편의 메서드
    public void addCode(CommonCode code) {
        this.codes.add(code);
        code.setGroup(this);
    }

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}