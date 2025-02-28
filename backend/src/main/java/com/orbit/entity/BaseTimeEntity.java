package com.orbit.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 생성일, 수정일을 자동으로 관리하는 엔티티
 * @MappedSuperclass
 *  - JPA에서 사용하는 어노테이션으로, 공통적인 매핑 정보를 제공하는 부모 클래스를 정의할 때 사용됩니다.
 *    이 어노테이션이 적용된 클래스는 엔티티로 직접 사용되지 않으며 다른 엔티티 클래스가 이를 상속받아
 *    매핑 정보를 활용할 수 있도록 함.
 *  - 상속받은 자식 클래스에 공통 필드와 매핑 정보를 전달합니다.
 *  - 부모 클래스의 필드가 자식 클래스의 테이블에 포함됩니다
 *  - @MappedSuperclass가 선언된 클래스는 독립적인 엔티티가 아니며 테이블을 생성하지 않고
 *    오직 자식 클래스의 매핑 정보로만 활용됩니다.
 *  - 예를 들어, BaseTimeEntity를 상속받은 Order 엔티티의 테이블에 regTime과 updateTime 컬럼이 추가됩니다.
 */
@EntityListeners({AuditingEntityListener.class})    // JPA Auditing 활성화
@MappedSuperclass   // JPA Entity 클래스들이 BaseTimeEntity를 상속할 경우 필드들도 칼럼으로 인식하도록 함
@Getter@Setter
public abstract class BaseTimeEntity {

    // Entity가 생성되어 저장될 때 시간이 자동 저장, updatable = false로 설정하면
    // 엔티티가 생성되어 저장될 때 시간이 자동 저장되지만, 엔티티의 값이 변경될 때는 시간이 변경되지 않음
    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime regTime;

    // 조회한 Entity의 값을 변경할 때 시간이 자동 저장
    @LastModifiedDate
    private LocalDateTime updateTime;
}
