package com.orbit.entity.procurement;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Lob;
import lombok.Getter;
import lombok.Setter;

@Entity
@DiscriminatorValue("SI")
@Getter
@Setter
public class SIRequest extends PurchaseRequest {

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(name = "project_start_date") // 컬럼 추가
    private LocalDate projectStartDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(name = "project_end_date") // 컬럼 추가
    private LocalDate projectEndDate;

    @Lob
    @Column(name = "project_content", length = 2000) // 컬럼 추가
    private String projectContent;
}