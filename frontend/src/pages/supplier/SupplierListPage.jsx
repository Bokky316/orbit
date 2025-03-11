import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchSuppliers } from '../../redux/supplier/supplierSlice';
import { fetchWithAuth } from '../../utils/fetchWithAuth'; // fetchWithAuth 임포트 추가
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Chip,
  Container,
  InputLabel,
  TextField,
  Grid,
  IconButton,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

const SupplierListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // 안전하게 상태 접근
  const supplierState = useSelector((state) => state.supplier) || {
    suppliers: [],
    loading: false,
    error: null,
    sourcingCategories: [],
    sourcingSubCategories: {},
    sourcingDetailCategories: {}
  };

  const {
    suppliers = [],
    loading = false,
    error = null,
    sourcingCategories = [],
    sourcingSubCategories = {},
    sourcingDetailCategories = {}
  } = supplierState;

  // 안전하게 사용자 정보 접근
  const authState = useSelector((state) => state.auth) || { user: null };
  const { user = null } = authState;

  // 필터 상태
  const [filters, setFilters] = useState({
    status: '',
    sourcingCategory: '',
    sourcingSubCategory: '',
    sourcingDetailCategory: '',
    supplierName: ''
  });

  // 모달 상태
  const [openModal, setOpenModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // 사용 가능한 소싱 중분류 및 소분류 옵션
  const [availableSubCategories, setAvailableSubCategories] = useState([]);
  const [availableDetailCategories, setAvailableDetailCategories] = useState([]);

  useEffect(() => {
    // API 호출 시 권한에 맞는 API 호출
    try {
      // fetchWithAuth를 사용하여 실제 API 호출을 할 경우를 위한 예시 코드
      // const fetchData = async () => {
      //   const queryParams = new URLSearchParams();
      //   if (filters.status) queryParams.append('status', filters.status);
      //   if (filters.supplierName) queryParams.append('supplierName', filters.supplierName);
      //   // 추가 필터 파라미터...
      //
      //   const url = `/api/supplier-registrations?${queryParams.toString()}`;
      //   const response = await fetchWithAuth(url);
      //   if (response.ok) {
      //     const data = await response.json();
      //     // 데이터 처리 로직
      //   }
      // };
      // fetchData();

      // 현재는 supplierSlice의 fetchSuppliers를 이용
      dispatch(fetchSuppliers(filters));
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  }, [dispatch, filters]);

  // 대분류 변경 시 중분류 옵션 업데이트
  useEffect(() => {
    if (filters.sourcingCategory) {
      setAvailableSubCategories(sourcingSubCategories[filters.sourcingCategory] || []);
      setAvailableDetailCategories([]);

      // 기존 상태와 비교하여 필요할 때만 업데이트
      setFilters(prev => {
        if (prev.sourcingSubCategory !== '' || prev.sourcingDetailCategory !== '') {
          return { ...prev, sourcingSubCategory: '', sourcingDetailCategory: '' };
        }
        return prev;
      });
    } else {
      setAvailableSubCategories([]);
    }
  }, [filters.sourcingCategory]); // ✅ `sourcingSubCategories` 제외

  // 중분류 변경 시 소분류 옵션 업데이트
  useEffect(() => {
    if (filters.sourcingSubCategory) {
      setAvailableDetailCategories(sourcingDetailCategories[filters.sourcingSubCategory] || []);

      setFilters(prev => {
        if (prev.sourcingDetailCategory !== '') {
          return { ...prev, sourcingDetailCategory: '' };
        }
        return prev;
      });
    } else {
      setAvailableDetailCategories([]);
    }
  }, [filters.sourcingSubCategory]); // ✅ `sourcingDetailCategories` 제외

  // 필터 변경 핸들러
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 필터 초기화 핸들러
  const handleClearFilters = () => {
    setFilters({
      status: '',
      sourcingCategory: '',
      sourcingSubCategory: '',
      sourcingDetailCategory: '',
      supplierName: ''
    });
  };

  // 반려 사유 모달 핸들러
  const handleShowRejectionReason = (reason) => {
    setRejectionReason(reason);
    setOpenModal(true);
  };

  // 사용자의 역할에 따른 권한 확인
  // roles 배열에서 권한 확인 (응답 형식: {"roles":["ROLE_SUPPLIER"]} 또는 {"roles":["ROLE_ADMIN"]})
  const isAdmin = user && user.roles && user.roles.includes('ROLE_ADMIN');
  const isSupplier = user && user.roles && user.roles.includes('ROLE_SUPPLIER');

  // 상태에 따른 Chip 색상 설정
  const getStatusChip = (status) => {
    // status가 객체인 경우 childCode를 사용
    const statusCode = status?.childCode || status;

    switch(statusCode) {
      case 'APPROVED':
        return <Chip label="승인" color="success" size="small" />;
      case 'PENDING':
        return <Chip label="심사대기" color="warning" size="small" />;
      case 'REJECTED':
        return <Chip label="반려" color="error" size="small" />;
      case 'SUSPENDED':
        return <Chip label="일시정지" color="default" size="small" />;
      case 'BLACKLIST':
        return <Chip label="블랙리스트" color="error" size="small" />;
      default:
        return <Chip label="미확인" size="small" />;
    }
  };

  // 에러 표시
  if (error) {
    console.error('Error in supplier list:', error);
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          협력업체 목록
        </Typography>
        {/* SUPPLIER 역할일 때만 신규 등록 버튼 표시 */}
        {isSupplier && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/supplier/registrations')}
          >
            신규 협력업체 등록
          </Button>
        )}
      </Box>

      {/* 필터 섹션 - ADMIN과 SUPPLIER 모두 사용 가능 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          {/* 첫 번째 줄: 소싱 분류 필터 */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>소싱대분류</InputLabel>
              <Select
                name="sourcingCategory"
                value={filters.sourcingCategory}
                onChange={handleFilterChange}
                label="소싱대분류"
              >
                <MenuItem value="">전체</MenuItem>
                {sourcingCategories.map(category => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small" disabled={!filters.sourcingCategory}>
              <InputLabel>소싱중분류</InputLabel>
              <Select
                name="sourcingSubCategory"
                value={filters.sourcingSubCategory}
                onChange={handleFilterChange}
                label="소싱중분류"
              >
                <MenuItem value="">전체</MenuItem>
                {availableSubCategories.map(category => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small" disabled={!filters.sourcingSubCategory}>
              <InputLabel>소싱소분류</InputLabel>
              <Select
                name="sourcingDetailCategory"
                value={filters.sourcingDetailCategory}
                onChange={handleFilterChange}
                label="소싱소분류"
              >
                <MenuItem value="">전체</MenuItem>
                {availableDetailCategories.map(category => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* 두 번째 줄: 업체명 및 상태 필터 */}
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              label="업체명"
              name="supplierName"
              value={filters.supplierName}
              onChange={handleFilterChange}
              InputProps={{
                endAdornment: filters.supplierName ? (
                  <IconButton
                    size="small"
                    onClick={() => setFilters(prev => ({ ...prev, supplierName: '' }))}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                ) : (
                  <SearchIcon color="action" fontSize="small" />
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <FormControl fullWidth size="small">
              <InputLabel>상태</InputLabel>
              <Select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                label="상태"
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="APPROVED">승인됨</MenuItem>
                <MenuItem value="PENDING">심사대기</MenuItem>
                <MenuItem value="REJECTED">거절됨</MenuItem>
                {/* ADMIN만 일시정지 및 블랙리스트 필터 표시 */}
                {isAdmin && (
                  <>
                    <MenuItem value="SUSPENDED">일시정지</MenuItem>
                    <MenuItem value="BLACKLIST">블랙리스트</MenuItem>
                  </>
                )}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleClearFilters}
              startIcon={<ClearIcon />}
            >
              필터 초기화
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#fff9c4' }}>
          <Typography color="error">데이터를 불러오는 중 오류가 발생했습니다. 나중에 다시 시도해 주세요.</Typography>
        </Paper>
      )}

      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : !Array.isArray(suppliers) || suppliers.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="subtitle1">등록된 협력업체가 없습니다.</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>업체명</TableCell>
                <TableCell>사업자등록번호</TableCell>
                <TableCell>대표자명</TableCell>
                <TableCell>소싱분류</TableCell>
                <TableCell>담당자</TableCell>
                <TableCell>등록일</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>관리</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {suppliers.map((supplier, index) => (
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
                  <TableCell>
                    {supplier.sourcingCategory && (
                      <Box>
                        <Typography variant="caption" component="div">
                          {supplier.sourcingCategory}
                          {supplier.sourcingSubCategory && ` > ${supplier.sourcingSubCategory}`}
                          {supplier.sourcingDetailCategory && ` > ${supplier.sourcingDetailCategory}`}
                        </Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    {supplier.contactPerson && (
                      <Box>
                        <Typography variant="body2">{supplier.contactPerson}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {supplier.contactPhone || supplier.contactEmail || '-'}
                        </Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>{supplier.registrationDate || '-'}</TableCell>
                  <TableCell>{getStatusChip(supplier.status)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {/* 상세 버튼은 ADMIN과 SUPPLIER 모두 사용 가능 */}
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/supplier/review/${supplier.id}`)}
                      >
                        상세
                      </Button>

                      {/* 반려 상태일 때만 반려사유 버튼 표시 */}
                      {(supplier.status === 'REJECTED' || supplier.status?.childCode === 'REJECTED') &&
                        supplier.rejectionReason && (
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => handleShowRejectionReason(supplier.rejectionReason)}
                        >
                          반려사유
                        </Button>
                      )}

                      {/* 일시정지 상태일 때 정지사유 버튼 표시 */}
                      {(supplier.status === 'SUSPENDED' || supplier.status?.childCode === 'SUSPENDED') &&
                        supplier.suspensionReason && (
                        <Button
                          size="small"
                          color="warning"
                          variant="outlined"
                          onClick={() => handleShowRejectionReason(supplier.suspensionReason)}
                        >
                          정지사유
                        </Button>
                      )}

                      {/* 블랙리스트 상태일 때 블랙리스트 사유 버튼 표시 */}
                      {(supplier.status === 'BLACKLIST' || supplier.status?.childCode === 'BLACKLIST') &&
                        supplier.rejectionReason && (
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => handleShowRejectionReason(supplier.rejectionReason)}
                        >
                          블랙리스트 사유
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* 반려/정지/블랙리스트 사유 모달 */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        aria-labelledby="rejection-dialog-title"
      >
        <DialogTitle id="rejection-dialog-title">사유 확인</DialogTitle>
        <DialogContent>
          <DialogContentText>{rejectionReason || '사유가 입력되지 않았습니다.'}</DialogContentText>
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

export default SupplierListPage;