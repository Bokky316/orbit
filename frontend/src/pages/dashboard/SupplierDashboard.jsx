import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_URL } from "@/utils/constants";
import {
  getStatusText,
  getBidMethodText
} from "./helpers/commonBiddingHelpers";

function SupplierDashboard() {
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
    },
    notifications: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 대시보드 데이터 페치
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 병렬로 데이터 요청
      const [
        summaryResponse,
        recentBiddingsResponse,
        performanceResponse,
        notificationsResponse
      ] = await Promise.all([
        fetchWithAuth(`${API_URL}/supplier/bidding-summary`),
        fetchWithAuth(`${API_URL}/supplier/recent-biddings`),
        fetchWithAuth(`${API_URL}/supplier/performance-metrics`),
        fetchWithAuth(`${API_URL}/notifications`)
      ]);

      const summaryData = await summaryResponse.json();
      const recentBiddings = await recentBiddingsResponse.json();
      const performanceMetrics = await performanceResponse.json();
      const notifications = await notificationsResponse.json();

      setDashboardData({
        biddingSummary: summaryData,
        recentBiddings,
        performanceMetrics,
        notifications: notifications.slice(0, 5) // 최근 5개 알림만
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
    window.location.href = `/supplier/biddings/${biddingId}`;
  };

  // 로딩 상태
  if (loading) return <div>대시보드 로딩 중...</div>;

  // 오류 상태
  if (error) return <div>오류: {error}</div>;

  return (
    <div className="supplier-dashboard">
      <h1>공급사 대시보드</h1>

      {/* 입찰 요약 섹션 */}
      <section className="bidding-summary">
        <h2>입찰 요약</h2>
        <div className="summary-grid">
          <div className="summary-item">
            <h3>총 입찰 공고</h3>
            <p>{dashboardData.biddingSummary.total}</p>
          </div>
          <div className="summary-item">
            <h3>초대받은 입찰</h3>
            <p>{dashboardData.biddingSummary.invited}</p>
          </div>
          <div className="summary-item">
            <h3>참여한 입찰</h3>
            <p>{dashboardData.biddingSummary.participated}</p>
          </div>
          <div className="summary-item">
            <h3>낙찰 건수</h3>
            <p>{dashboardData.biddingSummary.won}</p>
          </div>
        </div>
      </section>

      {/* 성과 지표 섹션 */}
      <section className="performance-metrics">
        <h2>성과 지표</h2>
        <div className="metrics-grid">
          <div className="metric-item">
            <h3>낙찰률</h3>
            <p>
              {(dashboardData.performanceMetrics.winRate * 100).toFixed(2)}%
            </p>
          </div>
          <div className="metric-item">
            <h3>총 낙찰 금액</h3>
            <p>
              {dashboardData.performanceMetrics.totalBidValue.toLocaleString()}
              원
            </p>
          </div>
          <div className="metric-item">
            <h3>평균 입찰 점수</h3>
            <p>{dashboardData.performanceMetrics.averageBidScore.toFixed(2)}</p>
          </div>
        </div>
      </section>

      {/* 최근 입찰 공고 섹션 */}
      <section className="recent-biddings">
        <h2>최근 입찰 공고</h2>
        <table>
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
                <td>{bidding.title}</td>
                <td>{getBidMethodText(bidding.bidMethod)}</td>
                <td>
                  <span
                    className={`status-chip ${
                      bidding.status?.childCode === "PENDING"
                        ? "default"
                        : bidding.status?.childCode === "ONGOING"
                        ? "primary"
                        : bidding.status?.childCode === "CLOSED"
                        ? "success"
                        : "default"
                    }`}>
                    {getStatusText(bidding.status)}
                  </span>
                </td>
                <td>{new Date(bidding.endDate).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => navigateToBiddingDetail(bidding.id)}>
                    상세보기
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 최근 알림 섹션 */}
      <section className="recent-notifications">
        <h2>최근 알림</h2>
        <ul>
          {dashboardData.notifications.map((notification) => (
            <li key={notification.id}>
              <span className="notification-icon">📬</span>
              <div className="notification-content">
                <h4>{notification.title}</h4>
                <p>{notification.content}</p>
                <small>
                  {new Date(notification.createdAt).toLocaleString()}
                </small>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default SupplierDashboard;
