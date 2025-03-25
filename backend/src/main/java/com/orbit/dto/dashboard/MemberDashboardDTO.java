package com.orbit.dto.dashboard;

import com.orbit.dto.member.MemberDTO;
import com.orbit.dto.procurement.PurchaseRequestDTO;
import com.orbit.dto.procurement.dashboard.PurchaseRequestSummaryDTO;
import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberDashboardDTO {
    private MemberDTO memberInfo;
    private PurchaseRequestStatsDTO purchaseRequestStats;
    private List<PurchaseRequestSummaryDTO> recentRequests;
    private List<PurchaseRequestDTO> pendingApprovals;
    private List<NotificationDTO> notifications;
    private List<RecentActivityDTO> recentActivities;
}