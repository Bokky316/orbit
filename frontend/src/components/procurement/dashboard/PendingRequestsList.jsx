// src/components/procurement/dashboard/PendingRequestsList.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Badge } from 'react-bootstrap';
import { format, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';

const PendingRequestsList = ({ requests }) => {
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

  // 요청일로부터 경과일 계산 및 표시
  const getElapsedDays = (requestDate) => {
    if (!requestDate) return null;

    const elapsed = differenceInDays(new Date(), new Date(requestDate));

    if (elapsed > 7) {
      return <Badge bg="danger">{elapsed}일 경과</Badge>;
    } else if (elapsed > 3) {
      return <Badge bg="warning">{elapsed}일 경과</Badge>;
    } else {
      return <Badge bg="success">{elapsed}일 경과</Badge>;
    }
  };

  return (
    <div className="pending-requests">
      <Table hover responsive className="mb-0">
        <thead>
          <tr>
            <th>요청번호</th>
            <th>요청명</th>
            <th>부서</th>
            <th>상태</th>
            <th>요청일</th>
            <th>경과</th>
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
                <td>{request.businessDepartment}</td>
                <td>
                  <Badge bg={statusColorMap[request.status] || 'secondary'}>
                    {request.statusDisplayName}
                  </Badge>
                </td>
                <td>
                  {request.requestDate && format(new Date(request.requestDate), 'yyyy-MM-dd', { locale: ko })}
                </td>
                <td>{getElapsedDays(request.requestDate)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center">처리 대기중인 요청이 없습니다.</td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default PendingRequestsList;