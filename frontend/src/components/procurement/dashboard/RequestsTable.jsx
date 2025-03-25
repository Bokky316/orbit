// src/components/procurement/dashboard/RequestsTable.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Table, Badge, Button, Pagination, Form } from 'react-bootstrap';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const RequestsTable = ({ requests }) => {
  // 페이지네이션 관련 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 정렬 관련 상태
  const [sortField, setSortField] = useState('requestDate');
  const [sortDirection, setSortDirection] = useState('desc');

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

  // 비즈니스 타입 표시 매핑
  const businessTypeDisplayName = {
    'SI': '시스템 통합',
    'MAINTENANCE': '유지보수',
    'GOODS': '물품'
  };

  // 정렬 처리 함수
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 정렬된 데이터 가져오기
  const getSortedData = () => {
    if (!requests || requests.length === 0) return [];

    return [...requests].sort((a, b) => {
      if (sortField === 'requestDate') {
        const dateA = new Date(a.requestDate || 0);
        const dateB = new Date(b.requestDate || 0);
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortField === 'businessBudget') {
        const budgetA = a.businessBudget || 0;
        const budgetB = b.businessBudget || 0;
        return sortDirection === 'asc' ? budgetA - budgetB : budgetB - budgetA;
      } else {
        const valueA = a[sortField] || '';
        const valueB = b[sortField] || '';
        return sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
    });
  };

  // 페이지네이션 계산
  const sortedData = getSortedData();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  // 페이지 변경 핸들러
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // 정렬 아이콘 표시
  const renderSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="requests-table">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          전체 <strong>{sortedData.length}</strong>건
        </div>
        <div className="d-flex align-items-center">
          <span className="me-2">페이지당 표시:</span>
          <Form.Select
            size="sm"
            style={{ width: 'auto' }}
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </Form.Select>
        </div>
      </div>

      <Table responsive hover bordered>
        <thead className="table-light">
          <tr>
            <th onClick={() => handleSort('requestNumber')} className="user-select-none">
              요청번호{renderSortIcon('requestNumber')}
            </th>
            <th onClick={() => handleSort('requestName')} className="user-select-none">
              요청명{renderSortIcon('requestName')}
            </th>
            <th onClick={() => handleSort('status')} className="user-select-none">
              상태{renderSortIcon('status')}
            </th>
            <th onClick={() => handleSort('businessDepartment')} className="user-select-none">
              부서{renderSortIcon('businessDepartment')}
            </th>
            <th onClick={() => handleSort('businessType')} className="user-select-none">
              구분{renderSortIcon('businessType')}
            </th>
            <th onClick={() => handleSort('requestDate')} className="user-select-none">
              요청일{renderSortIcon('requestDate')}
            </th>
            <th onClick={() => handleSort('businessBudget')} className="user-select-none">
              예산{renderSortIcon('businessBudget')}
            </th>
            <th>상세보기</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length > 0 ? (
            currentItems.map((request) => (
              <tr key={request.id}>
                <td>{request.requestNumber}</td>
                <td>{request.requestName}</td>
                <td>
                  <Badge bg={statusColorMap[request.status] || 'secondary'}>
                    {request.statusDisplayName || request.status}
                  </Badge>
                </td>
                <td>{request.businessDepartment}</td>
                <td>
                  {businessTypeDisplayName[request.businessType] || request.businessType}
                </td>
                <td>
                  {request.requestDate &&
                    format(new Date(request.requestDate), 'yyyy-MM-dd', { locale: ko })}
                </td>
                <td className="text-end">
                  {request.businessBudget &&
                    request.businessBudget.toLocaleString()}원
                </td>
                <td className="text-center">
                  <Link to={`/purchase-requests/${request.id}`}>
                    <Button size="sm" variant="outline-primary">
                      보기
                    </Button>
                  </Link>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="text-center py-4">
                조건에 맞는 구매요청이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>
            <Pagination.First
              onClick={() => paginate(1)}
              disabled={currentPage === 1}
            />
            <Pagination.Prev
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
            />

            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              // 현재 페이지 주변 5개 페이지만 표시
              if (
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
              ) {
                return (
                  <Pagination.Item
                    key={pageNumber}
                    active={pageNumber === currentPage}
                    onClick={() => paginate(pageNumber)}
                  >
                    {pageNumber}
                  </Pagination.Item>
                );
              } else if (
                pageNumber === currentPage - 3 ||
                pageNumber === currentPage + 3
              ) {
                return <Pagination.Ellipsis key={pageNumber} />;
              }
              return null;
            })}

            <Pagination.Next
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
            />
            <Pagination.Last
              onClick={() => paginate(totalPages)}
              disabled={currentPage === totalPages}
            />
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default RequestsTable;