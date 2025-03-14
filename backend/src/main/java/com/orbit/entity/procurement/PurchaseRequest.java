package com.orbit.entity.procurement;

import com.orbit.entity.member.Member;
import com.orbit.entity.project.Project;
import com.orbit.entity.commonCode.SystemStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter @Setter
@Table(name = "purchase_requests")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "request_type")
public abstract class PurchaseRequest {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "purchase_request_id")
    private Long id;

    @Column(name = "request_name", nullable = false)
    private String requestName;

    @Column(name = "request_number", unique = true)
    private String requestNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @Embedded
    private SystemStatus status;

    @Column(name = "request_date")
    private LocalDate requestDate;

    @Column(name = "customer")
    private String customer;

    @Column(name = "business_department")
    private String businessDepartment;

    @Column(name = "business_manager")
    private String businessManager;

    @Column(name = "business_type")
    private String businessType;

    @Column(precision = 19, scale = 2)
    @PositiveOrZero(message = "사업예산은 0 이상이어야 합니다.")
    private BigDecimal businessBudget;

    @Column(name = "special_notes", length = 1000)
    private String specialNotes;

    @Column(name = "manager_phone_number")
    private String managerPhoneNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    @OneToMany(mappedBy = "purchaseRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseRequestAttachment> attachments = new ArrayList<>();

    // 첨부파일 추가 편의 메서드
    public void addAttachment(PurchaseRequestAttachment attachment) {
        attachment.setPurchaseRequest(this);
        this.attachments.add(attachment);
    }
}