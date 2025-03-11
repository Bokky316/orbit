package com.orbit.entity.commonCode;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StatusCodeId implements Serializable {

    private String parentCode;
    private String childCode;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        StatusCodeId that = (StatusCodeId) o;
        return Objects.equals(parentCode, that.parentCode) && Objects.equals(childCode, that.childCode);
    }

    @Override
    public int hashCode() {
        return Objects.hash(parentCode, childCode);
    }
}
