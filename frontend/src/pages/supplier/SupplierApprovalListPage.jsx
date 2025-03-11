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

  // ADMIN 권한 체크
  const isAdmin = user && user.role === 'ADMIN';

  // 승인 대기 중인 협력업체만 필터링 (안전하게)
  const pendingSuppliers = Array.isArray(suppliers)
    ? suppliers.filter(supplier =>
        supplier.status?.childCode === 'PENDING' || supplier.status === 'PENDING')
    : [];

  useEffect(() => {
    // 실행은 하되, ADMIN 체크는 재차 확인
    try {
      dispatch(fetchSuppliers({ status: 'PENDING' }));
    } catch (err) {
      console.error('Error fetching pending suppliers:', err);
    }
  }, [dispatch]);

  const handleShowRejectionReason = (reason) => {
    setRejectionReason(reason);
    setOpenModal(true);
  };

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
          <Button
            variant="outlined"
            onClick={() => navigate('/supplier')}
          >
            전체 목록으로
          </Button>
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
                {pendingSuppliers.map((supplier, index) => (
                  <TableRow key={supplier.id || index} hover>
                    <TableCell>{index + 1}</TableCell>
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