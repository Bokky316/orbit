package com.orbit.entity.inspection;

import com.orbit.entity.Member;
import com.orbit.entity.bidding.BiddingContract;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "inspections")
public class Inspection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    private BiddingContract contract;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspector_id", nullable = false)
    private Member inspector;

    @Column(name = "inspection_date")
    private LocalDate inspectionDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "result")
    private InspectionResult result;

    @Column(name = "comments")
    private String comments;

    public enum InspectionResult {
        합격, 불합격
    }
}


