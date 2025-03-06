import React, { useState, useEffect } from "react";
import axios from "axios";

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchSuppliers();
  }, [status, page]);

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`/api/supplier-registrations${status ? `?status=${status}` : ''}`);
      setSuppliers(res.data);
    } catch (error) {
      console.error("Error fetching suppliers:", error.response?.data || error.message);
      // 사용자에게 에러 메시지 표시
    }
  };

  const updateSupplierStatus = async (id, newStatus, rejectionReason = "") => {
    try {
      await axios.put(`/api/supplier-registrations/${id}/status`, {
        status: newStatus,
        rejectionReason: rejectionReason
      });
      fetchSuppliers();
    } catch (error) {
      console.error("Error updating supplier status:", error);
    }
  };

  const approveSupplier = (id) => updateSupplierStatus(id, "APPROVED");

  const rejectSupplier = (id) => {
    const reason = prompt("거절 사유를 입력하세요:");
    if (reason) {
      updateSupplierStatus(id, "REJECTED", reason);
    }
  };

  return (
    <div>
      <h2>협력업체 목록</h2>
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">모든 상태</option>
        <option value="PENDING">대기중</option>
        <option value="APPROVED">승인됨</option>
        <option value="REJECTED">거절됨</option>
      </select>
      <button onClick={fetchSuppliers}>필터 적용</button>

      <table>
        <thead>
          <tr>
            <th>업체 ID</th>
            <th>사업자 등록번호</th>
            <th>사업 분야</th>
            <th>상태</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => (
            <tr key={s.id}>
              <td>{s.supplierId}</td>
              <td>{s.businessNo}</td>
              <td>{s.businessCategory}</td>
              <td>{s.status}</td>
              <td>
                {s.status === "PENDING" && (
                  <>
                    <button onClick={() => approveSupplier(s.id)}>승인</button>
                    <button onClick={() => rejectSupplier(s.id)}>거절</button>
                  </>
                )}
                <button onClick={() => window.location.href = `/supplier-details/${s.id}`}>상세보기</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 페이지네이션 로직은 백엔드 구현에 따라 조정이 필요할 수 있습니다 */}
      <div>
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>
          이전 페이지
        </button>
        <span>페이지 {page}</span>
        <button onClick={() => setPage(page + 1)}>다음 페이지</button>
      </div>
    </div>
  );
};

export default SupplierList;
