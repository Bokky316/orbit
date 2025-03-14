package com.orbit.entity.item;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "item")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Item {
    @Id
    @Column(name = "item_id", length = 20)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "item_name", length = 100, nullable = false)
    private String name;

    @Column(name = "item_code", length = 50, nullable = false, unique = true)
    private String code;

    @Column(length = 500)
    private String specification;

    // 단위 코드를 ParentCode와 ChildCode로 변경
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_parent_code")
    private ParentCode unitParentCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_child_code")
    private ChildCode unitChildCode;

    @Column(name = "standard_price", precision = 15, scale = 2)
    private BigDecimal standardPrice;

    @Column(length = 500)
    private String description;

    @Column(name = "use_yn", length = 1)
    @Builder.Default
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