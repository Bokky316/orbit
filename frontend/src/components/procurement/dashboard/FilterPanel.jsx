// src/components/procurement/dashboard/FilterPanel.jsx
import React from "react";
import { Row, Col, Form, Button, Card } from "react-bootstrap";

const FilterPanel = ({
  filters,
  departments,
  statusCodes,
  onFilterChange,
  onFilterSubmit,
  onFilterReset
}) => {
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

  // 사업 구분 표시 매핑
  const businessTypeDisplayName = {
    'SI': '시스템 통합',
    'MAINTENANCE': '유지보수',
    'GOODS': '물품'
  };

  // 날짜 타입의 input 이벤트 핸들러
  const handleDateChange = (e, field) => {
    onFilterChange(field, e.target.value);
  };

  return (
    <Card className="mb-4">
      <Card.Header>검색 필터</Card.Header>
      <Card.Body>
        <Form>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>상태</Form.Label>
                <Form.Select
                  value={filters.status}
                  onChange={(e) => onFilterChange('status', e.target.value)}
                >
                  <option value="">전체</option>
                  {statusCodes.map(code => (
                    <option key={code} value={code}>
                      {statusDisplayName[code] || code}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>부서</Form.Label>
                <Form.Select
                  value={filters.department}
                  onChange={(e) => onFilterChange('department', e.target.value)}
                >
                  <option value="">전체</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>사업 구분</Form.Label>
                <Form.Select
                  value={filters.businessType}
                  onChange={(e) => onFilterChange('businessType', e.target.value)}
                >
                  <option value="">전체</option>
                  {Object.entries(businessTypeDisplayName).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>프로젝트 ID</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="프로젝트 ID"
                  value={filters.projectId}
                  onChange={(e) => onFilterChange('projectId', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>시작일</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => handleDateChange(e, 'fromDate')}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>종료일</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => handleDateChange(e, 'toDate')}
                  min={filters.fromDate} // 시작일 이후만 선택 가능
                />
              </Form.Group>
            </Col>
            <Col md={6} className="d-flex align-items-end">
              <Button variant="primary" onClick={onFilterSubmit} className="me-2">
                검색
              </Button>
              <Button variant="secondary" onClick={onFilterReset}>
                초기화
              </Button>
            </Col>
          </Row>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default FilterPanel;