package com.orbit.entity.state;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class SystemStatus {
    @Column(name = "status_parent", length = 20)
    private String parentCode;

    @Column(name = "status_child", length = 20)
    private String childCode;

    public String getFullCode() {
        return parentCode + "-" + childCode;
    }
}
