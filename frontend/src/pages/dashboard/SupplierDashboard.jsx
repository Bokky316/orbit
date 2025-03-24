// frontend/src/pages/supplier/SupplierDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_URL } from "@/utils/constants";
import useWebSocket from "@/hooks/useWebSocket";
import { useSelector } from "react-redux";
import {
  getStatusText,
  getBidMethodText
} from "../bidding/helpers/commonBiddingHelpers";
 import "/public/css/layout/Notification.css";

function SupplierDashboard() {
  const navigate = useNavigate();
  const { notifications, markNotificationAsRead } = useWebSocket();

  // 대시보드 상태 관리
  const [dashboardData, setDashboardData] = useState({
    biddingSummary: {
      total: 0,
      invited: 0,
      participated: 0,
      won: 0
    },
    recentBiddings: [],
    performanceMetrics: {
      winRate: 0,
      totalBidValue: 0,
      averageBidScore: 0
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 대시보드 데이터 페치
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 병렬로 데이터 요청
      const [summaryResponse, recentBiddingsResponse, performanceResponse] =
        await Promise.all([
          fetchWithAuth(`${API_URL}supplier/bidding-summary`),
          fetchWithAuth(`${API_URL}supplier/recent-biddings`),
          fetchWithAuth(`${API_URL}supplier/performance-metrics`)
        ]);

      const summaryData = await summaryResponse.json();
      const recentBiddings = await recentBiddingsResponse.json();
      const performanceMetrics = await performanceResponse.json();

      setDashboardData({
        biddingSummary: summaryData,
        recentBiddings,
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

  // 입찰 공고 상세 페이지로 이동
  const navigateToBiddingDetail = (biddingId) => {
    navigate(`/supplier/biddings/${biddingId}`);
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
      }
    }
  };

  // 알림 아이콘 가져오기
  const getNotificationIcon = (type) => {
    if (type?.includes("BIDDING")) return "📋";
    if (type?.includes("CONTRACT")) return "📝";
    if (type?.includes("ORDER")) return "🚚";
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
    <div className="supplier_dashboard">
      <h1 className="dashboard_title">공급사 대시보드</h1>

      <div className="dashboard_grid">
        {/* 입찰 요약 섹션 */}
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
                {dashboardData.biddingSummary.invited}
              </span>
              <span className="stat_label">초대받은 입찰</span>
            </div>
            <div className="stat_item">
              <span className="stat_value">
                {dashboardData.biddingSummary.participated}
              </span>
              <span className="stat_label">참여한 입찰</span>
            </div>
            <div className="stat_item">
              <span className="stat_value">
                {dashboardData.biddingSummary.won}
              </span>
              <span className="stat_label">낙찰 건수</span>
            </div>
          </div>
        </div>

        {/* 성과 지표 섹션 */}
        <div className="dashboard_card metrics_card">
          <h2 className="card_title">성과 지표</h2>
          <div className="metrics_stats">
            <div className="metric_item">
              <div className="metric_circle">
                <span className="metric_value">
                  {(dashboardData.performanceMetrics.winRate * 100).toFixed(1)}%
                </span>
              </div>
              <span className="metric_label">낙찰률</span>
            </div>

            <div className="metric_item">
              <div className="metric_circle">
                <span className="metric_value">
                  {
                    dashboardData.performanceMetrics.totalBidValue
                      .toLocaleString()
                      .split(",")[0]
                  }
                  <small>만원</small>
                </span>
              </div>
              <span className="metric_label">총 낙찰 금액</span>
            </div>

            <div className="metric_item">
              <div className="metric_circle">
                <span className="metric_value">
                  {dashboardData.performanceMetrics.averageBidScore.toFixed(1)}
                </span>
              </div>
              <span className="metric_label">평균 입찰 점수</span>
            </div>
          </div>
        </div>

        {/* 최근 알림 섹션 */}
        <div className="dashboard_card notifications_card">
          <h2 className="card_title">
            최근 알림
            <button
              className="view_all_button"
              onClick={() => navigate("/notifications")}>
              전체보기
            </button>
          </h2>

          {notifications.length > 0 ? (
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
          <h2 className="card_title">
            최근 입찰 공고
            <button
              className="view_all_button"
              onClick={() => navigate("/biddings")}>
              전체보기
            </button>
          </h2>

          {dashboardData.recentBiddings.length > 0 ? (
            <div className="biddings_table_container">
              <table className="biddings_table">
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
      </div>
    </div>
  );
}

export default SupplierDashboard;
