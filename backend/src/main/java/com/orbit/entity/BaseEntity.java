package com.orbit.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * 생성자, 수정자를 자동으로 관리하는 엔티티
 * BaseTimeEntity를 상속받아 생성자, 수정자를 자동으로 관리하는 엔티티를 만듦
 * 거기에 추가적으로 생성자, 수정자를 나타내는 필드를 추가함.
 */
@EntityListeners({AuditingEntityListener.class})
@MappedSuperclass
@Getter@Setter
public abstract class BaseEntity extends BaseTimeEntity {

    @CreatedBy
    @Column(updatable = false)
    private String createdBy;

    @LastModifiedBy
    private String modifiedBy;
}
