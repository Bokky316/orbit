package com.orbit.entity.commonCode;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "status_transition_rules")
@Getter @Setter
public class StatusTransitionRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "parentCode", column = @Column(name = "from_parent")),
            @AttributeOverride(name = "childCode", column = @Column(name = "from_child", insertable = false, updatable = false))
    })
    private SystemStatus fromStatus;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "parentCode", column = @Column(name = "to_parent")),
            @AttributeOverride(name = "childCode", column = @Column(name = "to_child"))
    })
    private SystemStatus toStatus;
}
