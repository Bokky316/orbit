import React, { useState, useEffect } from "react";
import {
  canParticipateInBidding,
  getStatusText,
  getBidMethodText
} from "./helpers/biddingHelpers";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_URL } from "@/utils/constants";

function SupplierBiddingDetailPage() {
  // 상태 관리
  const [bidding, setBidding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 참여 관련 상태
  const [participationData, setParticipationData] = useState({
    unitPrice: 0,
    quantity: 0,
    note: ""
  });

  // 사용자 정보 (컨텍스트나 훅에서 가져올 수 있음)
  const [userSupplierInfo, setUserSupplierInfo] = useState(null);

  // 입찰 공고 상세 정보 가져오기
  const fetchBiddingDetail = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/biddings/${id}`);
      if (!response.ok) {
        throw new Error("입찰 공고 정보를 불러올 수 없습니다.");
      }
      const data = await response.json();
      setBidding(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 입찰 참여 처리
  const handleParticipate = async () => {
    try {
      // 참여 가능 여부 확인
      if (!canParticipateInBidding(bidding, userSupplierInfo)) {
        throw new Error("현재 입찰에 참여할 수 없습니다.");
      }

      const participationPayload = {
        biddingId: bidding.id,
        supplierId: userSupplierInfo.id,
        unitPrice: participationData.unitPrice,
        quantity: participationData.quantity,
        note: participationData.note
      };

      const response = await fetchWithAuth(
        `${API_URL}/biddings/${bidding.id}/participate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(participationPayload)
        }
      );

      if (!response.ok) {
        throw new Error("입찰 참여 중 오류가 발생했습니다.");
      }

      // 성공 처리
      alert("입찰에 성공적으로 참여했습니다.");

      // 상세 정보 새로고침
      fetchBiddingDetail();
    } catch (error) {
      alert(error.message);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchBiddingDetail();
  }, []);

  // 참여 데이터 변경 핸들러
  const handleParticipationChange = (e) => {
    const { name, value } = e.target;
    setParticipationData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // 로딩 상태
  if (loading) return <div>로딩 중...</div>;

  // 오류 상태
  if (error) return <div>오류: {error}</div>;

  // 입찰 공고가 없는 경우
  if (!bidding) return <div>입찰 공고를 찾을 수 없습니다.</div>;

  return (
    <div className="supplier-bidding-detail-container">
      {/* 기본 입찰 공고 정보 */}
      <section className="bidding-info">
        <h1>{bidding.title}</h1>

        <div className="bidding-meta">
          <p>공고번호: {bidding.bidNumber}</p>
          <p>상태: {getStatusText(bidding.status)}</p>
          <p>입찰 방식: {getBidMethodText(bidding.bidMethod)}</p>
          <p>
            공고 기간: {new Date(bidding.startDate).toLocaleDateString()} ~
            {new Date(bidding.endDate).toLocaleDateString()}
          </p>
        </div>

        {/* 입찰 조건 */}
        <div className="bidding-conditions">
          <h2>입찰 조건</h2>
          <p>{bidding.conditions || "특별한 입찰 조건이 없습니다."}</p>
        </div>
      </section>

      {/* 참여 섹션 */}
      {canParticipateInBidding(bidding, userSupplierInfo) && (
        <section className="participation-section">
          <h2>입찰 참여</h2>

          {/* 입찰 방식에 따른 참여 폼 */}
          {bidding.bidMethod === "정가제안" ? (
            <div className="fixed-price-participation">
              <label>
                수량:
                <input
                  type="number"
                  name="quantity"
                  value={participationData.quantity}
                  onChange={handleParticipationChange}
                  min="1"
                />
              </label>
            </div>
          ) : (
            <div className="price-suggestion-participation">
              <label>
                제안 단가:
                <input
                  type="number"
                  name="unitPrice"
                  value={participationData.unitPrice}
                  onChange={handleParticipationChange}
                  min="0"
                />
              </label>
            </div>
          )}

          {/* 참고 사항 */}
          <div className="participation-note">
            <label>
              참고 사항:
              <textarea
                name="note"
                value={participationData.note}
                onChange={handleParticipationChange}
                placeholder="추가적인 설명이 있다면 작성해주세요."
              />
            </label>
          </div>

          {/* 참여 버튼 */}
          <button
            onClick={handleParticipate}
            disabled={!canParticipateInBidding(bidding, userSupplierInfo)}>
            입찰 참여
          </button>
        </section>
      )}

      {/* 이미 참여한 경우 참여 정보 표시 */}
      {bidding.participations?.some(
        (p) => p.supplierId === userSupplierInfo?.id
      ) && (
        <section className="existing-participation">
          <h2>나의 참여 정보</h2>
          {/* 참여 정보 상세 렌더링 */}
        </section>
      )}

      {/* 첨부 파일 섹션 */}
      {bidding.attachmentPaths && bidding.attachmentPaths.length > 0 && (
        <section className="attachments">
          <h2>첨부 파일</h2>
          <ul>
            {bidding.attachmentPaths.map((filePath, index) => (
              <li key={index}>
                <a href="#" onClick={() => downloadFile(filePath)}>
                  첨부파일 {index + 1}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default SupplierBiddingDetailPage;
