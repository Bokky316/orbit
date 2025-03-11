package com.orbit.entity.commonCode;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "common_code")
@Getter
@Setter
@NoArgsConstructor
public class CommonCode {
    @Id
    @Column(name = "code_id", length = 20)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private CommonCodeGroup group;

    @Column(name = "code_name", length = 100, nullable = false)
    private String name;

    @Column(name = "code_value", length = 100)
    private String value;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

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

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}