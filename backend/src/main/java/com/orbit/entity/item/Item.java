package com.orbit.entity.item;

import com.orbit.entity.commonCode.CommonCode;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "item")
@Getter
@Setter
@NoArgsConstructor
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_code", nullable = false)
    private CommonCode unit;

    @Column(name = "standard_price", precision = 15, scale = 2)
    private BigDecimal standardPrice;

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