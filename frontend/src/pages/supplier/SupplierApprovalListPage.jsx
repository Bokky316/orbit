import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchSuppliers } from '../../redux/supplier/supplierSlice';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Container,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Chip
} from '@mui/material';
import { Visibility as VisibilityIcon } from '@mui/icons-material';

const SupplierApprovalListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // 안전하게 상태 접근
  const supplierState = useSelector((state) => state.supplier) || { suppliers: [], loading: false, error: null };
  const { suppliers = [], loading = false, error = null } = supplierState;

  // 안전하게 사용자 정보 접근
  const authState = useSelector((state) => state.auth) || { user: null };
  const { user = null } = authState;

  const [openModal, setOpenModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  // 페이징 관련 상태 추가
  const [page, setPage] = useState(0); // TablePagination은 0부터 시작
  const [rowsPerPage, setRowsPerPage] = useState(15); // 페이지당 표시할 항목 수

  // ADMIN 권한 체크
  const isAdmin = user && user.roles && user.roles.includes('ROLE_ADMIN');

  // 페이지 접근 시 ADMIN 권한 체크
  useEffect(() => {
    if (!isAdmin) {
      setAccessDenied(true);
      // 3초 후 리다이렉트
      const timer = setTimeout(() => {
        navigate('/supplier');
      }, 3000);
      return () => clearTimeout(timer);
    }

    // ADMIN인 경우에만 API 호출
    try {
      dispatch(fetchSuppliers({ status: 'PENDING' }));
    } catch (err) {
      console.error('Error fetching pending suppliers:', err);
    }
  }, [dispatch, isAdmin, navigate]);

  // 승인 대기 중인 협력업체만 필터링 (안전하게)
  const pendingSuppliers = Array.isArray(suppliers)
    ? suppliers.filter(supplier =>
        supplier.status?.childCode === 'PENDING' || supplier.status === 'PENDING')
    : [];

  // 페이지 변경 핸들러
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  // 페이지당 행 수 변경 핸들러
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // 페이지당 행 수 변경 시 첫 페이지로 이동
  };

  // 현재 페이지에 표시할 항목들만 선택
  const paginatedSuppliers = pendingSuppliers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // 총 항목 수
  const totalItems = pendingSuppliers.length;

  const handleShowRejectionReason = (reason) => {
    setRejectionReason(reason);
    setOpenModal(true);
  };

  // 접근 제한 알림 표시
  if (accessDenied) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body1">
            관리자만 접근할 수 있는 페이지입니다. 메인 페이지로 이동합니다.
          </Typography>
        </Alert>
      </Container>
    );
  }

  // 로딩 표시
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">승인 대기 협력업체 목록</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/supplier')}
            >
              전체 목록으로
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            데이터를 불러오는 중 오류가 발생했습니다. 나중에 다시 시도해 주세요.
          </Alert>
        )}

        {!Array.isArray(suppliers) || pendingSuppliers.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="subtitle1">승인 대기 중인 협력업체가 없습니다.</Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>No</TableCell>
                    <TableCell>업체명</TableCell>
                    <TableCell>사업자등록번호</TableCell>
                    <TableCell>대표자명</TableCell>
                    <TableCell>등록일</TableCell>
                    <TableCell>상태</TableCell>
                    <TableCell>관리</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedSuppliers.map((supplier, index) => (
                    <TableRow key={supplier.id || index} hover>
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>
                        <Link
                          to={`/supplier/review/${supplier.id}`}
                          style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 'bold' }}
                        >
                          {supplier.supplierName || '이름 없음'}
                        </Link>
                      </TableCell>
                      <TableCell>{supplier.businessNo || '-'}</TableCell>
                      <TableCell>{supplier.ceoName || '-'}</TableCell>
                      <TableCell>{supplier.registrationDate || '-'}</TableCell>
                      <TableCell>
                        <Chip label="심사대기" color="warning" size="small" />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => navigate(`/supplier/review/${supplier.id}`)}
                        >
                          상세보기
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* 테이블 페이지네이션 추가 */}
            <TablePagination
              rowsPerPageOptions={[5, 10, 15, 30]}
              component="div"
              count={totalItems}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="페이지당 행 수"
              labelDisplayedRows={({ page, count, rowsPerPage }) => {
                const totalPages = rowsPerPage > 0 ? Math.max(1, Math.ceil(count / rowsPerPage)) : 1;
                return `${Math.max(1, page + 1)} / ${totalPages}`;
              }}
            />
          </>
        )}
      </Paper>

      {/* 거절 사유 확인 모달 */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)}>
        <DialogTitle>거절 사유</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {rejectionReason || '거절 사유가 입력되지 않았습니다.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} color="primary">
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SupplierApprovalListPage;