package com.orbit.entity.item;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "category")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Category {
    @Id
    @Column(name = "category_id", length = 20)
    private String id;

    @Column(name = "category_name", length = 100, nullable = false)
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

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Item> items = new ArrayList<>();

    // 연관관계 편의 메서드
    public void addItem(Item item) {
        this.items.add(item);
        item.setCategory(this);
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