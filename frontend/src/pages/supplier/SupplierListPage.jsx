import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchSuppliers, updateSupplierStatus, initializeCategoriesFromSuppliers } from '../../redux/supplier/supplierSlice';
import { fetchWithAuth } from '../../utils/fetchWithAuth';
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
  TablePagination,
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
  Divider,
  Alert,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorOutlineIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const SupplierListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const initialLoadComplete = useRef(false); // 초기 로드 완료 여부 체크용

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
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const [selectedSupplierName, setSelectedSupplierName] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  // 사용 가능한 소싱 중분류 및 소분류 옵션
  const [availableSubCategories, setAvailableSubCategories] = useState([]);
  const [availableDetailCategories, setAvailableDetailCategories] = useState([]);

  // 페이징 관련 상태 추가
  const [page, setPage] = useState(0); // TablePagination은 0부터 시작
  const [rowsPerPage, setRowsPerPage] = useState(15); // 페이지당 표시할 항목 수

  // 사용자의 역할에 따른 권한 확인
  const isAdmin = user && user.roles && user.roles.includes('ROLE_ADMIN');
  const isSupplier = user && user.roles && user.roles.includes('ROLE_SUPPLIER');

  // 페이지 접근 시 권한 체크
  useEffect(() => {
    if (!isAdmin && !isSupplier) {
      setAccessDenied(true);
      // 3초 후 리다이렉트
      const timer = setTimeout(() => {
        navigate('/');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isAdmin, isSupplier, navigate]);

  // 컴포넌트 마운트 시 초기 데이터 로드 - 이 부분이 추가됨
  useEffect(() => {
    if (!accessDenied) {
      try {
        console.log('초기 데이터 로드 시작');
        dispatch(fetchSuppliers({})); // 빈 필터로 초기 데이터 로드
        initialLoadComplete.current = true; // 초기 로드 완료 표시
      } catch (err) {
        console.error('Error fetching initial suppliers:', err);
      }
    }
  }, [dispatch, accessDenied]); // 의존성 배열에 accessDenied 추가

  // 필터 변경 시 데이터 로드 - 기존 코드 수정
  useEffect(() => {
    // 초기 로드 이후에는 항상 API 호출
    if (initialLoadComplete.current) {
      console.log('필터 변경으로 API 호출:', JSON.stringify(filters));

      try {
        dispatch(fetchSuppliers({...filters}));
        // 필터 변경 시 페이지를 0으로 리셋 (TablePagination은 0부터 시작)
        setPage(0);
      } catch (err) {
        console.error('Error fetching filtered suppliers:', err);
      }
    }
  }, [dispatch, filters]); // 필터 변경 시 실행

  // suppliers 데이터가 로드된 후 해당 데이터를 기반으로 카테고리 필터 옵션 초기화
  useEffect(() => {
    if (suppliers && suppliers.length > 0) {
      dispatch(initializeCategoriesFromSuppliers(suppliers));
    }
  }, [suppliers, dispatch]);

  // 대분류 변경 시 중분류 옵션 업데이트
  useEffect(() => {
    if (filters.sourcingCategory) {
      setAvailableSubCategories(sourcingSubCategories[filters.sourcingCategory] || []);
      setAvailableDetailCategories([]);
    } else {
      setAvailableSubCategories([]);
    }
  }, [filters.sourcingCategory, sourcingSubCategories]);

  // 중분류 변경 시 소분류 옵션 업데이트
  useEffect(() => {
    if (filters.sourcingSubCategory) {
      setAvailableDetailCategories(sourcingDetailCategories[filters.sourcingSubCategory] || []);
    } else {
      setAvailableDetailCategories([]);
    }
  }, [filters.sourcingSubCategory, sourcingDetailCategories]);

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
  const paginatedSuppliers = Array.isArray(suppliers)
    ? suppliers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : [];

  // 총 항목 수
  const totalItems = Array.isArray(suppliers) ? suppliers.length : 0;

  // 필터 변경 핸들러
  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    // 콘솔 로그 추가
    console.log(`필터 변경 전: ${name} = ${filters[name]}`);
    console.log(`필터 변경 후: ${name} = ${value}`);

    // 상태 업데이트 방식 변경
    if (name === 'sourcingCategory') {
      setFilters({
        ...filters,
        sourcingCategory: value,
        sourcingSubCategory: '',
        sourcingDetailCategory: ''
      });
    } else if (name === 'sourcingSubCategory') {
      setFilters({
        ...filters,
        sourcingSubCategory: value,
        sourcingDetailCategory: ''
      });
    } else {
      setFilters({
        ...filters,
        [name]: value
      });
    }
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

  // 상태에 따른 Chip 색상 설정
  const getStatusChip = (status) => {
    // status가 객체인 경우 childCode를 사용
    const statusCode = status?.childCode || status;

    switch(statusCode) {
      case 'APPROVED':
      case 'ACTIVE':
        return <Chip label="승인" color="success" size="small" />;
      case 'PENDING':
        return <Chip label="심사대기" color="warning" size="small" />;
      case 'REJECTED':
        return <Chip label="반려" color="error" size="small" />;
      case 'SUSPENDED':
        return <Chip label="일시정지" color="default" size="small" />;
      case 'BLACKLIST':
        return <Chip label="블랙리스트" color="error" size="small" />;
      case 'INACTIVE':
        return <Chip label="비활성" color="default" size="small" />;
      default:
        return <Chip label="미확인" size="small" />;
    }
  };

  // 에러 표시
  if (error) {
    console.error('Error in supplier list:', error);
  }

  // 접근 제한 알림 표시
  if (accessDenied) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body1">
            SUPPLIER와 ADMIN 역할을 가진 사용자만 접근할 수 있는 페이지입니다. 메인 페이지로 이동합니다.
          </Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
     <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
       <div>
         <Typography variant="h4" component="div" gutterBottom>
           협력업체 목록
         </Typography>
         {!isAdmin && (
           <Typography variant="subtitle1" color="text.secondary">
             (본인이 등록한 업체만 표시됩니다)
           </Typography>
         )}
       </div>
      </Box>

      {/* 필터 섹션 - ADMIN과 SUPPLIER 모두 사용 가능 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          {/* 첫 번째 줄: 소싱 분류 필터 */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="sourcing-category-label">소싱대분류</InputLabel>
              <Select
                labelId="sourcing-category-label"
                name="sourcingCategory"
                value={filters.sourcingCategory}
                onChange={handleFilterChange}
                label="소싱대분류"
                renderValue={(selected) => {
                  return selected || "전체";
                }}
              >
                <MenuItem value="">
                  <em>전체</em>
                </MenuItem>
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
              <InputLabel id="sourcing-sub-category-label">소싱중분류</InputLabel>
              <Select
                labelId="sourcing-sub-category-label"
                name="sourcingSubCategory"
                value={filters.sourcingSubCategory}
                onChange={handleFilterChange}
                label="소싱중분류"
                renderValue={(selected) => {
                  return selected || "전체";
                }}
              >
                <MenuItem value="">
                  <em>전체</em>
                </MenuItem>
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
              <InputLabel id="sourcing-detail-category-label">소싱소분류</InputLabel>
              <Select
                labelId="sourcing-detail-category-label"
                name="sourcingDetailCategory"
                value={filters.sourcingDetailCategory}
                onChange={handleFilterChange}
                label="소싱소분류"
                renderValue={(selected) => {
                  return selected || "전체";
                }}
              >
                <MenuItem value="">
                  <em>전체</em>
                </MenuItem>
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
              <InputLabel id="status-label">상태</InputLabel>
              <Select
                labelId="status-label"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                label="상태"
                renderValue={(selected) => {
                  return selected ?
                    selected === "APPROVED" ? "승인" :
                    selected === "PENDING" ? "심사대기" :
                    selected === "REJECTED" ? "반려" :
                    selected === "SUSPENDED" ? "일시정지" :
                    selected === "BLACKLIST" ? "블랙리스트" :
                    selected === "INACTIVE" ? "비활성" : selected
                    : "전체";
                }}
              >
                <MenuItem value="">
                  <em>전체</em>
                </MenuItem>
                <MenuItem value="APPROVED">승인</MenuItem>
                <MenuItem value="PENDING">심사대기</MenuItem>
                <MenuItem value="REJECTED">반려</MenuItem>
                {/* ADMIN만 일시정지 및 블랙리스트 필터 표시 */}
                {isAdmin ? [
                  <MenuItem key="suspended" value="SUSPENDED">일시정지</MenuItem>,
                  <MenuItem key="blacklist" value="BLACKLIST">블랙리스트</MenuItem>,
                  <MenuItem key="inactive" value="INACTIVE">비활성</MenuItem>
                ] : null}
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
            <Typography variant="subtitle1">
              {isAdmin ? '등록된 협력업체가 없습니다.' : '등록한 협력업체가 없습니다.'}
            </Typography>
            {isSupplier && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => navigate('/supplier/registrations')}
                sx={{ mt: 2 }}
              >
                협력업체 등록하기
              </Button>
            )}
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="5%">No</TableCell>
                  <TableCell width="12%">업체명</TableCell>
                  <TableCell width="12%">사업자등록번호</TableCell>
                  <TableCell width="10%">대표자명</TableCell>
                  <TableCell width="15%">소싱분류</TableCell>
                  <TableCell width="10%">담당자</TableCell>
                  <TableCell width="10%">등록일</TableCell>
                  <TableCell width="8%">상태</TableCell>
                  <TableCell width="18%">관리</TableCell>
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
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>{supplier.registrationDate || '-'}</TableCell>
                    <TableCell>{getStatusChip(supplier.status)}</TableCell>
                    <TableCell sx={{ minWidth: '160px', maxWidth: '160px' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 0.5 }}>
                        {/* 상세 버튼은 ADMIN과 SUPPLIER 모두 사용 가능 */}
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{ minWidth: '42px', padding: '2px 8px' }}
                          onClick={() => navigate(`/supplier/review/${supplier.id}`)}
                        >
                          상세
                        </Button>

                        {/* ADMIN에게만 활성화 상태 표시 */}
                        {isAdmin && (
                          (supplier.status === 'INACTIVE' || supplier.status?.childCode === 'INACTIVE' ||
                           supplier.status === 'SUSPENDED' || supplier.status?.childCode === 'SUSPENDED' ||
                           supplier.status === 'BLACKLIST' || supplier.status?.childCode === 'BLACKLIST') ? (
                            <Chip
                              label="비활성"
                              icon={<BlockIcon fontSize="small" />}
                              color="default"
                              size="small"
                              sx={{ height: '24px', fontSize: '0.75rem', '& .MuiChip-icon': { fontSize: '14px', marginLeft: '2px' } }}
                            />
                          ) : (
                            <Chip
                              label="활성"
                              icon={<CheckCircleIcon fontSize="small" />}
                              color="success"
                              size="small"
                              sx={{ height: '24px', fontSize: '0.75rem', '& .MuiChip-icon': { fontSize: '14px', marginLeft: '2px' } }}
                            />
                          )
                        )}

                        {/* 반려 상태일 때는 반려사유 버튼과 재승인 요청 버튼 표시 */}
                        {(supplier.status === 'REJECTED' || supplier.status?.childCode === 'REJECTED') &&
                          supplier.rejectionReason && (
                          <>
                            <Tooltip title="반려사유">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleShowRejectionReason(supplier.rejectionReason)}
                                sx={{ padding: '4px' }}
                              >
                                <InfoIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {isSupplier && (
                              <Button
                                size="small"
                                color="warning"
                                variant="contained"
                                sx={{ minWidth: '42px', padding: '2px 8px', fontSize: '0.75rem' }}
                                onClick={() => navigate(`/supplier/edit/${supplier.id}`)}
                              >
                                재승인
                              </Button>
                            )}
                          </>
                        )}

                        {/* 일시정지 상태일 때 정지사유 버튼 표시 */}
                        {(supplier.status === 'SUSPENDED' || supplier.status?.childCode === 'SUSPENDED') &&
                          supplier.rejectionReason && (
                          <Tooltip title="일시정지 사유">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => handleShowRejectionReason(supplier.rejectionReason)}
                              sx={{ padding: '4px' }}
                            >
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* 블랙리스트 상태일 때 블랙리스트 사유 버튼 표시 */}
                        {(supplier.status === 'BLACKLIST' || supplier.status?.childCode === 'BLACKLIST') &&
                          supplier.rejectionReason && (
                          <Tooltip title="블랙리스트 사유">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleShowRejectionReason(supplier.rejectionReason)}
                              sx={{ padding: '4px' }}
                            >
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* 비활성 상태일 때 비활성 사유 버튼 표시 */}
                        {(supplier.status === 'INACTIVE' || supplier.status?.childCode === 'INACTIVE') &&
                          supplier.rejectionReason && (
                          <Tooltip title="비활성 사유">
                            <IconButton
                              size="small"
                              onClick={() => handleShowRejectionReason(supplier.rejectionReason)}
                              sx={{ padding: '4px' }}
                            >
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

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
              labelDisplayedRows={({ from, to, count, page }) => {
                const totalPages = Math.ceil(count / rowsPerPage);
                return `${page + 1} / ${totalPages}`;
              }}
              sx={{
                '& .MuiTablePagination-selectLabel': {
                  marginRight: '8px',
                },
                '& .MuiTablePagination-select': {
                  marginRight: '16px',
                  minWidth: '45px'
                }
              }}
            />
          </>
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