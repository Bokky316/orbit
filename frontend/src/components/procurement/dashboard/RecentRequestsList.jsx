// src/components/procurement/dashboard/RecentRequestsList.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Badge } from 'react-bootstrap';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const RecentRequestsList = ({ requests }) => {
  // 상태 코드별 색상 매핑
  const statusColorMap = {
    'REQUESTED': 'warning',
    'RECEIVED': 'info',
    'VENDOR_SELECTION': 'primary',
    'CONTRACT_PENDING': 'danger',
    'INSPECTION': 'success',
    'INVOICE_ISSUED': 'secondary',
    'PAYMENT_COMPLETED': 'dark'
  };

  return (
    <div className="recent-requests">
      <Table hover responsive className="mb-0">
        <thead>
          <tr>
            <th>요청번호</th>
            <th>요청명</th>
            <th>요청자</th>
            <th>상태</th>
            <th>요청일</th>
            <th>예산</th>
          </tr>
        </thead>
        <tbody>
          {requests.length > 0 ? (
            requests.map((request) => (
              <tr key={request.id}>
                <td>
                  <Link to={`/purchase-requests/${request.id}`}>
                    {request.requestNumber}
                  </Link>
                </td>
                <td>{request.requestName}</td>
                <td>{request.requesterName}</td>
                <td>
                  <Badge bg={statusColorMap[request.status] || 'secondary'}>
                    {request.statusDisplayName}
                  </Badge>
                </td>
                <td>
                  {request.requestDate && format(new Date(request.requestDate), 'yyyy-MM-dd', { locale: ko })}
                </td>
                <td className="text-end">
                  {request.businessBudget && request.businessBudget.toLocaleString()}원
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center">최근 구매요청이 없습니다.</td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default RecentRequestsList;