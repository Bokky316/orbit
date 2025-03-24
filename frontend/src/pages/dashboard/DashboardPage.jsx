// frontend/src/pages/buyer/BuyerDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_URL } from "@/utils/constants";
import useWebSocket from "@/hooks/useWebSocket";
import { useNotificationsWebSocket } from "@/hooks/useNotificationsWebSocket"; // 알림 웹소켓 훅 추가
import { useSelector } from "react-redux";
import {
  getStatusText,
  getBidMethodText
} from "../bidding/helpers/commonBiddingHelpers";
import "/public/css/layout/Notification.css";

function DashboardPage() {
  const navigate = useNavigate();
  const { isConnected } = useWebSocket(); // 기존 웹소켓 연결 유지

  // 알림 전용 웹소켓 훅 사용
  const { notifications, markNotificationAsRead } = useNotificationsWebSocket(
    useSelector((state) => state.auth.user)
  );

  // 대시보드 상태 관리
  const [dashboardData, setDashboardData] = useState({
    biddingSummary: {
      total: 0,
      pending: 0,
      ongoing: 0,
      closed: 0,
      canceled: 0
    },
    purchaseRequestSummary: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    },
    recentBiddings: [],
    recentPurchaseRequests: [],
    performanceMetrics: {
      totalContractAmount: 0,
      avgProcessingTime: 0,
      completionRate: 0
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 대시보드 데이터 페치
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 병렬로 데이터 요청
      const [
        biddingSummaryResponse,
        prSummaryResponse,
        recentBiddingsResponse,
        recentPRsResponse,
        performanceResponse
      ] = await Promise.all([
        fetchWithAuth(`${API_URL}buyer/bidding-summary`),
        fetchWithAuth(`${API_URL}buyer/purchase-request-summary`),
        fetchWithAuth(`${API_URL}buyer/recent-biddings`),
        fetchWithAuth(`${API_URL}buyer/recent-purchase-requests`),
        fetchWithAuth(`${API_URL}buyer/performance-metrics`)
      ]);

      // 응답이 성공적인지 확인하고 데이터 추출
      // 실제 API가 없을 경우를 대비한 더미 데이터 처리
      let biddingSummary = {};
      let prSummary = {};
      let recentBiddings = [];
      let recentPRs = [];
      let performanceMetrics = {};

      try {
        biddingSummary = await biddingSummaryResponse.json();
      } catch (e) {
        console.log(
          "입찰 요약 데이터를 가져오는데 실패했습니다. 더미 데이터를 사용합니다."
        );
        biddingSummary = {
          total: 12,
          pending: 3,
          ongoing: 5,
          closed: 3,
          canceled: 1
        };
      }

      try {
        prSummary = await prSummaryResponse.json();
      } catch (e) {
        console.log(
          "구매요청 요약 데이터를 가져오는데 실패했습니다. 더미 데이터를 사용합니다."
        );
        prSummary = {
          total: 25,
          pending: 8,
          approved: 15,
          rejected: 2
        };
      }

      try {
        recentBiddings = await recentBiddingsResponse.json();
      } catch (e) {
        console.log(
          "최근 입찰 데이터를 가져오는데 실패했습니다. 더미 데이터를 사용합니다."
        );
        recentBiddings = [
          {
            id: 1001,
            bidNumber: "BID-230101-001",
            title: "사무실 컴퓨터 공급",
            status: { childCode: "ONGOING" },
            bidMethod: "FIXED_PRICE",
            startDate: new Date(2023, 5, 1),
            endDate: new Date(2023, 5, 15),
            totalAmount: 25000000
          },
          {
            id: 1002,
            bidNumber: "BID-230105-002",
            title: "사무용품 공급",
            status: { childCode: "CLOSED" },
            bidMethod: "OPEN_PRICE",
            startDate: new Date(2023, 5, 5),
            endDate: new Date(2023, 5, 20),
            totalAmount: 5000000
          },
          {
            id: 1003,
            bidNumber: "BID-230110-003",
            title: "네트워크 장비 구매",
            status: { childCode: "PENDING" },
            bidMethod: "FIXED_PRICE",
            startDate: new Date(2023, 5, 10),
            endDate: new Date(2023, 5, 25),
            totalAmount: 15000000
          }
        ];
      }

      try {
        recentPRs = await recentPRsResponse.json();
      } catch (e) {
        console.log(
          "최근 구매요청 데이터를 가져오는데 실패했습니다. 더미 데이터를 사용합니다."
        );
        recentPRs = [
          {
            id: 2001,
            requestNumber: "PR-230101-001",
            title: "마케팅 부서 노트북 구매",
            status: "APPROVED",
            requestDate: new Date(2023, 4, 28),
            department: "마케팅",
            totalAmount: 5500000
          },
          {
            id: 2002,
            requestNumber: "PR-230103-002",
            title: "회의실 프로젝터 구매",
            status: "PENDING",
            requestDate: new Date(2023, 5, 1),
            department: "총무",
            totalAmount: 2800000
          },
          {
            id: 2003,
            requestNumber: "PR-230105-003",
            title: "개발팀 서버 장비 구매",
            status: "APPROVED",
            requestDate: new Date(2023, 5, 3),
            department: "개발",
            totalAmount: 12000000
          }
        ];
      }

      try {
        performanceMetrics = await performanceResponse.json();
      } catch (e) {
        console.log(
          "성과 지표 데이터를 가져오는데 실패했습니다. 더미 데이터를 사용합니다."
        );
        performanceMetrics = {
          totalContractAmount: 230000000,
          avgProcessingTime: 8.5,
          completionRate: 0.85
        };
      }

      setDashboardData({
        biddingSummary,
        purchaseRequestSummary: prSummary,
        recentBiddings,
        recentPurchaseRequests: recentPRs,
        performanceMetrics
      });
    } catch (error) {
      console.error("대시보드 데이터 로딩 실패:", error);
      setError("데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // 상세 페이지 이동 핸들러
  const navigateToBiddingDetail = (biddingId) => {
    navigate(`/biddings/${biddingId}`);
  };

  const navigateToPurchaseRequestDetail = (prId) => {
    navigate(`/purchase-requests/${prId}`);
  };

  // 알림 클릭 핸들러
  const handleNotificationClick = (notification) => {
    // 알림 읽음 처리
    markNotificationAsRead(notification.id);

    // 알림 소스 페이지로 네비게이션
    if (notification.referenceId) {
      if (notification.type?.includes("BIDDING")) {
        navigate(`/biddings/${notification.referenceId}`);
      } else if (notification.type?.includes("CONTRACT")) {
        navigate(`/contracts/${notification.referenceId}`);
      } else if (notification.type?.includes("ORDER")) {
        navigate(`/orders/${notification.referenceId}`);
      } else if (notification.type?.includes("PURCHASE_REQUEST")) {
        navigate(`/purchase-requests/${notification.referenceId}`);
      }
    }
  };

  // 알림 아이콘 가져오기
  const getNotificationIcon = (type) => {
    if (type?.includes("BIDDING")) return "📋";
    if (type?.includes("CONTRACT")) return "📝";
    if (type?.includes("ORDER")) return "🚚";
    if (type?.includes("PURCHASE_REQUEST")) return "📑";
    if (type?.includes("EVALUATION")) return "📊";
    return "🔔";
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="dashboard_loading">
        <div className="loading_spinner"></div>
        <p>대시보드 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  // 오류 상태
  if (error) {
    return (
      <div className="dashboard_error">
        <h2>오류가 발생했습니다</h2>
        <p>{error}</p>
        <button onClick={fetchDashboardData}>다시 시도</button>
      </div>
    );
  }

  return (
    <div className="buyer_dashboard">
      <h1 className="dashboard_title">구매자 대시보드</h1>

      <div className="dashboard_grid">
        {/* 입찰 요약 카드 */}
        <div className="dashboard_card summary_card">
          <h2 className="card_title">입찰 요약</h2>
          <div className="summary_stats">
            <div className="stat_item">
              <span className="stat_value">
                {dashboardData.biddingSummary.total}
              </span>
              <span className="stat_label">총 입찰 공고</span>
            </div>
            <div className="stat_item">
              <span className="stat_value">
                {dashboardData.biddingSummary.ongoing}
              </span>
              <span className="stat_label">진행중</span>
            </div>
            <div className="stat_item">
              <span className="stat_value">
                {dashboardData.biddingSummary.pending}
              </span>
              <span className="stat_label">대기중</span>
            </div>
            <div className="stat_item">
              <span className="stat_value">
                {dashboardData.biddingSummary.closed}
              </span>
              <span className="stat_label">완료</span>
            </div>
          </div>
        </div>

        {/* 구매요청 요약 카드 */}
        <div className="dashboard_card pr_summary_card">
          <h2 className="card_title">구매요청 요약</h2>
          <div className="summary_stats">
            <div className="stat_item">
              <span className="stat_value">
                {dashboardData.purchaseRequestSummary.total}
              </span>
              <span className="stat_label">총 요청</span>
            </div>
            <div className="stat_item">
              <span className="stat_value">
                {dashboardData.purchaseRequestSummary.pending}
              </span>
              <span className="stat_label">대기중</span>
            </div>
            <div className="stat_item">
              <span className="stat_value">
                {dashboardData.purchaseRequestSummary.approved}
              </span>
              <span className="stat_label">승인됨</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {dashboardData.purchaseRequestSummary.rejected}
              </span>
              <span className="stat_label">거부됨</span>
            </div>
          </div>
        </div>

        {/* 성과 지표 카드 */}
        <div className="dashboard_card metrics_card">
          <h2 className="card_title">성과 지표</h2>
          <div className="metrics_stats">
            <div className="metric_item">
              <div className="metric_circle">
                <span className="metric_value">
                  {Math.floor(
                    dashboardData.performanceMetrics.totalContractAmount / 10000
                  )}
                  <small>만원</small>
                </span>
              </div>
              <span className="metric_label">총 계약 금액</span>
            </div>

            <div className="metric_item">
              <div className="metric_circle">
                <span className="metric_value">
                  {dashboardData.performanceMetrics.avgProcessingTime.toFixed(
                    1
                  )}
                  <small>일</small>
                </span>
              </div>
              <span className="metric_label">평균 처리 시간</span>
            </div>

            <div className="metric_item">
              <div className="metric_circle">
                <span className="metric_value">
                  {(
                    dashboardData.performanceMetrics.completionRate * 100
                  ).toFixed(1)}
                  <small>%</small>
                </span>
              </div>
              <span className="metric_label">완료율</span>
            </div>
          </div>
        </div>

        {/* 최근 알림 섹션 */}
        <div className="dashboard_card notifications_card">
          <h2 className="card-title">
            최근 알림
            <button
              className="view_all_button"
              onClick={() => navigate("/notifications")}>
              전체보기
            </button>
          </h2>

          {notifications && notifications.length > 0 ? (
            <ul className="notification_list">
              {notifications.slice(0, 5).map((notification) => (
                <li
                  key={notification.id}
                  className={`notification_item ${
                    !notification.isRead ? "unread" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}>
                  <div className="notification_icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification_content">
                    <div className="notification_title">
                      {notification.title}
                    </div>
                    <div className="notification_message">
                      {notification.content}
                    </div>
                    {/* <div className="notification_time">
                      {formatRelativeTime(notification.createdAt)}
                    </div> */}
                  </div>
                  {!notification.isRead && (
                    <span className="unread_marker"></span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty_notifications">
              <p>새로운 알림이 없습니다</p>
            </div>
          )}
        </div>

        {/* 최근 입찰 공고 섹션 */}
        <div className="dashboard_card biddings_card">
          <h2 className="card-title">
            최근 입찰 공고
            <button
              className="view_all_button"
              onClick={() => navigate("/biddings")}>
              전체보기
            </button>
          </h2>

          {dashboardData.recentBiddings.length > 0 ? (
            <div className="biddings_table_container">
              <table className="biddings-table">
                <thead>
                  <tr>
                    <th>공고번호</th>
                    <th>제목</th>
                    <th>입찰 방식</th>
                    <th>상태</th>
                    <th>마감일</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recentBiddings.map((bidding) => (
                    <tr key={bidding.id}>
                      <td>{bidding.bidNumber}</td>
                      <td className="bid_title">{bidding.title}</td>
                      <td>{getBidMethodText(bidding.bidMethod)}</td>
                      <td>
                        <span
                          className={`status_badge ${
                            bidding.status?.childCode === "PENDING"
                              ? "status-pending"
                              : bidding.status?.childCode === "ONGOING"
                              ? "status-ongoing"
                              : bidding.status?.childCode === "CLOSED"
                              ? "status-closed"
                              : "status-default"
                          }`}>
                          {getStatusText(bidding.status)}
                        </span>
                      </td>
                      <td>{new Date(bidding.endDate).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="detail_button"
                          onClick={() => navigateToBiddingDetail(bidding.id)}>
                          상세보기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty_biddings">
              <p>최근 입찰 공고가 없습니다</p>
            </div>
          )}
        </div>

        {/* 최근 구매 요청 섹션 */}
        <div className="dashboard_card purchase_requests_card">
          <h2 className="card-title">
            최근 구매 요청
            <button
              className="view_all_button"
              onClick={() => navigate("/purchase-requests")}>
              전체보기
            </button>
          </h2>

          {dashboardData.recentPurchaseRequests.length > 0 ? (
            <div className="pr_table_container">
              <table className="pr_table">
                <thead>
                  <tr>
                    <th>요청번호</th>
                    <th>제목</th>
                    <th>부서</th>
                    <th>상태</th>
                    <th>요청일</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recentPurchaseRequests.map((pr) => (
                    <tr key={pr.id}>
                      <td>{pr.requestNumber}</td>
                      <td className="pr_title">{pr.title}</td>
                      <td>{pr.department}</td>
                      <td>
                        <span
                          className={`status_badge ${
                            pr.status === "PENDING"
                              ? "status-pending"
                              : pr.status === "APPROVED"
                              ? "status-approved"
                              : pr.status === "REJECTED"
                              ? "status-rejected"
                              : "status-default"
                          }`}>
                          {pr.status === "PENDING"
                            ? "대기중"
                            : pr.status === "APPROVED"
                            ? "승인됨"
                            : pr.status === "REJECTED"
                            ? "거부됨"
                            : "기타"}
                        </span>
                      </td>
                      <td>{new Date(pr.requestDate).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="detail_button"
                          onClick={() =>
                            navigateToPurchaseRequestDetail(pr.id)
                          }>
                          상세보기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty_purchase_requests">
              <p>최근 구매 요청이 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
