// src/components/procurement/dashboard/RequestsTable.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import {
  ArrowDropUp,
  ArrowDropDown
} from '@mui/icons-material';

const RequestsTable = ({ requests, loading, searchTerm }) => {
  // 페이지네이션 관련 상태
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // 정렬 관련 상태
  const [sortConfig, setSortConfig] = useState({
    key: 'requestDate',
    direction: 'desc'
  });

  // 필터링된 데이터
  const [filteredData, setFilteredData] = useState([]);

  // 검색어 변경 시 필터링
  useEffect(() => {
    if (!requests) return;

    if (!searchTerm) {
      setFilteredData(requests);
    } else {
      const filtered = requests.filter(request =>
        request.requestName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requestNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.businessDepartment?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    }
    setPage(0); // 검색 시 첫 페이지로 리셋
  }, [searchTerm, requests]);

  // 상태 코드별 색상 매핑
  const statusColors = {
    'REQUESTED': '#ff9800',
    'RECEIVED': '#2196f3',
    'VENDOR_SELECTION': '#9c27b0',
    'CONTRACT_PENDING': '#f44336',
    'INSPECTION': '#4caf50',
    'INVOICE_ISSUED': '#795548',
    'PAYMENT_COMPLETED': '#3f51b5'
  };

  // 비즈니스 타입 표시 매핑
  const businessTypeDisplayName = {
    'SI': '시스템 통합',
    'MAINTENANCE': '유지보수',
    'GOODS': '물품'
  };

  // 정렬 처리 함수
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 정렬된 데이터 가져오기
  const getSortedData = () => {
    if (!filteredData || filteredData.length === 0) return [];

    return [...filteredData].sort((a, b) => {
      if (sortConfig.key === 'requestDate') {
        const dateA = new Date(a.requestDate || 0);
        const dateB = new Date(b.requestDate || 0);
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortConfig.key === 'businessBudget') {
        const budgetA = a.businessBudget || 0;
        const budgetB = b.businessBudget || 0;
        return sortConfig.direction === 'asc' ? budgetA - budgetB : budgetB - budgetA;
      } else {
        const valueA = a[sortConfig.key] || '';
        const valueB = b[sortConfig.key] || '';
        return sortConfig.direction === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
    });
  };

  // 페이지네이션 변경 핸들러
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 테이블에 표시할 데이터
  const sortedData = getSortedData();
  const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // 정렬 아이콘 표시
  const renderSortIcon = (field) => {
    if (sortConfig.key !== field) return null;
    return sortConfig.direction === 'asc' ? <ArrowDropUp /> : <ArrowDropDown />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography>
          전체 <strong>{sortedData.length}</strong>건
        </Typography>
      </Box>

      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                onClick={() => handleSort('requestNumber')}
                sx={{ cursor: 'pointer' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  요청번호
                  {renderSortIcon('requestNumber')}
                </Box>
              </TableCell>
              <TableCell
                onClick={() => handleSort('requestName')}
                sx={{ cursor: 'pointer' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  요청명
                  {renderSortIcon('requestName')}
                </Box>
              </TableCell>
              <TableCell
                onClick={() => handleSort('status')}
                sx={{ cursor: 'pointer' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  상태
                  {renderSortIcon('status')}
                </Box>
              </TableCell>
              <TableCell
                onClick={() => handleSort('businessDepartment')}
                sx={{ cursor: 'pointer' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  부서
                  {renderSortIcon('businessDepartment')}
                </Box>
              </TableCell>
              <TableCell
                onClick={() => handleSort('businessType')}
                sx={{ cursor: 'pointer' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  구분
                  {renderSortIcon('businessType')}
                </Box>
              </TableCell>
              <TableCell
                onClick={() => handleSort('requestDate')}
                sx={{ cursor: 'pointer' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  요청일
                  {renderSortIcon('requestDate')}
                </Box>
              </TableCell>
              <TableCell
                onClick={() => handleSort('businessBudget')}
                sx={{ cursor: 'pointer' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  예산
                  {renderSortIcon('businessBudget')}
                </Box>
              </TableCell>
              <TableCell align="center">상세보기</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((request) => (
                <TableRow
                  key={request.id}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>{request.requestNumber}</TableCell>
                  <TableCell>
                    <Typography noWrap sx={{ maxWidth: 250 }}>
                      {request.requestName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={request.statusDisplayName || request.status}
                      size="small"
                      sx={{
                        bgcolor: statusColors[request.status],
                        color: '#fff',
                        fontWeight: 'medium'
                      }}
                    />
                  </TableCell>
                  <TableCell>{request.businessDepartment}</TableCell>
                  <TableCell>
                    {businessTypeDisplayName[request.businessType] || request.businessType}
                  </TableCell>
                  <TableCell>
                    {request.requestDate &&
                      format(new Date(request.requestDate), 'yyyy-MM-dd', { locale: ko })}
                  </TableCell>
                  <TableCell align="right">
                    {request.businessBudget &&
                      request.businessBudget.toLocaleString()}원
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      component={Link}
                      to={`/purchase-requests/${request.id}`}
                    >
                      보기
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    조건에 맞는 구매요청이 없습니다.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={sortedData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="페이지당 행 수:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} / ${count}`
        }
      />
    </Box>
  );
};

export default RequestsTable;