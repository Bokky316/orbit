// src/components/procurement/dashboard/RequestProgress.jsx
import React from 'react';
import { Card, ProgressBar, Badge } from 'react-bootstrap';

const RequestProgress = ({ progress }) => {
  if (!progress) {
    return (
      <Card>
        <Card.Body className="text-center">
          <p>진행 상태 정보가 없습니다.</p>
        </Card.Body>
      </Card>
    );
  }

  // 상태 코드별 표시 이름 매핑
  const statusDisplayName = {
    'REQUESTED': '요청됨',
    'RECEIVED': '접수됨',
    'VENDOR_SELECTION': '업체선정',
    'CONTRACT_PENDING': '계약대기',
    'INSPECTION': '검수',
    'INVOICE_ISSUED': '인보이스발행',
    'PAYMENT_COMPLETED': '대금지급완료'
  };

  // 상태별 색상 매핑
  const statusColors = {
    'REQUESTED': 'warning',
    'RECEIVED': 'info',
    'VENDOR_SELECTION': 'primary',
    'CONTRACT_PENDING': 'danger',
    'INSPECTION': 'success',
    'INVOICE_ISSUED': 'secondary',
    'PAYMENT_COMPLETED': 'dark'
  };

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0">{progress.requestName}</h5>
          <small className="text-muted">{progress.requestNumber}</small>
        </div>
        <Badge bg={statusColors[progress.currentStatus] || 'secondary'}>
          {statusDisplayName[progress.currentStatus] || progress.currentStatus}
        </Badge>
      </Card.Header>
      <Card.Body>
        <div className="mb-4">
          <ProgressBar now={progress.completionPercentage} label={`${Math.round(progress.completionPercentage)}%`} />
        </div>

        <div className="d-flex justify-content-between mb-3">
          <div>
            <h6>현재 단계</h6>
            <Badge bg={statusColors[progress.currentStatus] || 'secondary'} className="fs-6">
              {statusDisplayName[progress.currentStatus] || progress.currentStatus}
            </Badge>
          </div>
          {progress.nextStep && (
            <div>
              <h6>다음 단계</h6>
              <Badge bg="light" text="dark" className="fs-6">
                {statusDisplayName[progress.nextStep] || progress.nextStep}
              </Badge>
            </div>
          )}
        </div>

        <div className="mb-3">
          <h6>완료된 단계</h6>
          <div className="d-flex flex-wrap gap-2 mb-2">
            {progress.completedSteps.map((step) => (
              <Badge key={step} bg="success">
                {statusDisplayName[step] || step}
              </Badge>
            ))}
          </div>
        </div>

        {progress.pendingSteps && progress.pendingSteps.length > 0 && (
          <div>
            <h6>남은 단계</h6>
            <div className="d-flex flex-wrap gap-2">
              {progress.pendingSteps.map((step) => (
                <Badge key={step} bg="light" text="dark">
                  {statusDisplayName[step] || step}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default RequestProgress;