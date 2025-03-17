import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, TextField, MenuItem, Select, FormControl, InputLabel, Box, Grid, Pagination,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  IconButton, Chip, Stack, CircularProgress, Alert, Container,
  styled, FormHelperText
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { API_URL } from '@/utils/constants';
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import KakaoAddressSearch from "@/pages/member/KakaoAddressSearch";

// 스타일 컴포넌트 정의
const PageContainer = styled(Container)(({ theme }) => ({
  maxWidth: 1200,
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4)
}));

const PageTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  fontWeight: 500
}));

const SearchFilterPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3)
}));

const TablePaper = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(3)
}));

const PaginationBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  padding: theme.spacing(2, 0)
}));

const AlertStyled = styled(Alert)(({ theme }) => ({
  marginBottom: theme.spacing(3)
}));

export default function AdminMemberPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  // URL 쿼리 파라미터 파싱
  const queryParams = new URLSearchParams(location.search);
  const statusFromQuery = queryParams.get('status');

  // 상태
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [pageRequest, setPageRequest] = useState({
    page: 1,
    size: 10,
    searchType: '',
    keyword: '',
    status: statusFromQuery || ''
  });

  // 검색 실행
  const handleSearch = () => {
    setPageRequest({
      ...pageRequest,
      page: 1 // 검색 시 첫 페이지로 이동
    });
    fetchMembers();
  };

  // 회원 상세 편집 관련 상태
  const [selectedMember, setSelectedMember] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editedRole, setEditedRole] = useState('');

  // 회원 상세정보 관련 상태 추가
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [memberDetail, setMemberDetail] = useState(null);
  const [editMemberData, setEditMemberData] = useState(null);

  // 상태 변경 관련 상태
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusMemberId, setStatusMemberId] = useState(null);
  const [statusAction, setStatusAction] = useState('');

  // 알림 메시지
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' });

  // URL 쿼리 파라미터가 변경되면 페이지 요청 상태 업데이트
  useEffect(() => {
    setPageRequest(prev => ({
      ...prev,
      status: statusFromQuery || ''
    }));
  }, [location.search, statusFromQuery]);

  // 검색 조건이나 키워드가 변경될 때 목록 조회
  useEffect(() => {
    if (user && user.roles && user.roles.includes('ROLE_ADMIN')) {
      // 검색어 입력 시 디바운스 적용
      const timer = setTimeout(() => {
        // 검색 실행
        fetchMembers();
      }, 500); // 500ms 디바운스 적용

      return () => clearTimeout(timer);
    }
  }, [pageRequest.searchType, pageRequest.keyword]);

  // 페이지, 사이즈, 상태 변경 시 목록 조회
  useEffect(() => {
    if (user && user.roles && user.roles.includes('ROLE_ADMIN')) {
      fetchMembers();
    } else {
      navigate('/unauthorized');
    }
  }, [pageRequest.page, pageRequest.size, pageRequest.status]);

  // 회원 목록 조회
  const fetchMembers = async () => {
    setLoading(true);
    try {
      // 쿼리 파라미터 생성
      const queryParams = new URLSearchParams();
      queryParams.append('page', pageRequest.page);
      queryParams.append('size', pageRequest.size);

      // 검색 조건이 있을 때만 추가
      if (pageRequest.searchType) {
        queryParams.append('searchType', pageRequest.searchType);
      }

      // 상태 필터가 있을 때만 추가 - 항상 status 값을 포함
      if (pageRequest.status === 'active') {
        queryParams.append('status', 'active');
      } else if (pageRequest.status === 'inactive') {
        queryParams.append('status', 'inactive');
      }
      // 전체(빈 문자열) 상태인 경우 status 파라미터 자체를 보내지 않음

      // 검색어가 있을 때만 추가
      if (pageRequest.keyword && pageRequest.keyword.trim() !== '') {
        queryParams.append('keyword', pageRequest.keyword);
      }

      console.log("요청 URL:", `${API_URL}members?${queryParams.toString()}`);

      // API 요청 보내기
      const response = await fetchWithAuth(`${API_URL}members?${queryParams.toString()}`, {
        method: 'GET'
      });

      console.log("응답 상태:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("응답 데이터:", data);

        // 응답 데이터 구조 확인 - 값 확인
        if (data && Array.isArray(data.dtoList)) {
          const membersList = data.dtoList || [];

          // 필터링 상태에 따라 클라이언트 측에서 한번 더 필터링
          let filteredMembers = membersList;
          if (pageRequest.status === 'active') {
            filteredMembers = membersList.filter(member => member.enabled);
          } else if (pageRequest.status === 'inactive') {
            filteredMembers = membersList.filter(member => !member.enabled);
          }

          setMembers(filteredMembers);
          setTotalPages(Math.ceil((data.total || 0) / pageRequest.size));

          // 비활성화 상태에서 결과가 없을 때 알림
          if (pageRequest.status === 'inactive' && filteredMembers.length === 0) {
            showAlert('비활성화된 회원이 없습니다.', 'info');
          }
        } else {
          console.warn("응답 데이터 형식이 예상과 다릅니다:", data);
          // 빈 배열로 설정하고 알림 표시하지 않음
          setMembers([]);
          setTotalPages(0);
        }
      } else {
        console.error("API 호출 실패:", response.status);
        const errorText = await response.text();
        console.error("에러 응답:", errorText);
        showAlert(`회원 목록을 불러오는데 실패했습니다. (${response.status})`, 'error');
        setMembers([]);
        setTotalPages(0);
      }
    } catch (error) {
      console.error('회원 목록 조회 오류:', error);
      // 오류 시 빈 배열로 설정하고 오류 메시지만 콘솔에 표시
      setMembers([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // 회원 활성화/비활성화 토글
  const toggleMemberStatus = async (id) => {
    try {
      const response = await fetchWithAuth(`${API_URL}members/${id}/toggle-status`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        showAlert(result.message, 'success');
        fetchMembers(); // 목록 다시 로드
      } else {
        showAlert('회원 상태 변경에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('회원 상태 변경 오류:', error);
      showAlert('회원 상태 변경 중 오류가 발생했습니다.', 'error');
    }
  };

  // 회원 역할 변경
  const updateMemberRole = async () => {
    if (!selectedMember || !editedRole) return;

    try {
      const response = await fetchWithAuth(`${API_URL}members/${selectedMember.id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: editedRole })
      });

      if (response.ok) {
        const result = await response.json();
        showAlert(result.message, 'success');
        setOpenEditDialog(false);
        fetchMembers(); // 목록 다시 로드
      } else {
        const errorData = await response.json();
        showAlert(errorData.message || '회원 역할 변경에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('회원 역할 변경 오류:', error);
      showAlert('회원 역할 변경 중 오류가 발생했습니다.', 'error');
    }
  };

  // 회원 상세 정보 조회
  const fetchMemberDetail = async (id) => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${API_URL}members/${id}`, {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        console.log("회원 상세 정보:", data);

        if (data.status === "success" && data.data) {
          setMemberDetail(data.data);
          // 수정용 데이터도 같이 설정
          setEditMemberData({
            name: data.data.name,
            email: data.data.email,
            companyName: data.data.companyName || '',
            contactNumber: data.data.contactNumber || '',
            postalCode: data.data.postalCode || '',
            roadAddress: data.data.roadAddress || '',
            detailAddress: data.data.detailAddress || ''
          });
          setOpenDetailDialog(true);
        } else {
          showAlert('회원 정보를 불러올 수 없습니다.', 'error');
        }
      } else {
        showAlert('회원 정보 조회에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('회원 정보 조회 오류:', error);
      showAlert('회원 정보 조회 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 회원 정보 수정
  const updateMemberDetail = async () => {
    if (!memberDetail || !editMemberData) return;

    try {
      setLoading(true);
      const response = await fetchWithAuth(`${API_URL}members/${memberDetail.id}`, {
        method: 'PUT',
        body: JSON.stringify(editMemberData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === "success") {
          showAlert('회원 정보가 성공적으로 수정되었습니다.', 'success');
          setOpenDetailDialog(false);
          fetchMembers(); // 목록 새로고침
        } else {
          showAlert(result.message || '회원 정보 수정에 실패했습니다.', 'error');
        }
      } else {
        showAlert('회원 정보 수정에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('회원 정보 수정 오류:', error);
      showAlert('회원 정보 수정 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 상세 정보 입력 필드 변경 처리
  const handleDetailInputChange = (e) => {
    const { name, value } = e.target;
    setEditMemberData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 카카오 주소 검색 결과 처리
  const handleAddressSelect = (data) => {
    setEditMemberData(prev => ({
      ...prev,
      postalCode: data.zonecode,
      roadAddress: data.roadAddress
    }));
  };

  // 필터 초기화
  const resetFilters = () => {
    setPageRequest({
      page: 1,
      size: 10,
      searchType: '',
      keyword: '',
      status: ''
    });

    // URL 쿼리 파라미터 초기화
    navigate('/members');
  };

  // 페이지 변경
  const handlePageChange = (event, value) => {
    setPageRequest({
      ...pageRequest,
      page: value
    });
  };

  // 검색 필드 변경
  const handleSearchTypeChange = (event) => {
    setPageRequest({
      ...pageRequest,
      searchType: event.target.value
    });
  };

  // 키워드 변경
  const handleKeywordChange = (event) => {
    const newKeyword = event.target.value;
    setPageRequest(prev => ({
      ...prev,
      keyword: newKeyword
    }));
  };

  // 상태 필터 변경
  const handleStatusFilterChange = (event) => {
    const newStatus = event.target.value;
    setPageRequest({
      ...pageRequest,
      status: newStatus,
      page: 1 // 필터 변경 시 첫 페이지로 이동
    });

    // URL 쿼리 파라미터 업데이트
    if (newStatus) {
      navigate(`/members?status=${newStatus}`);
    } else {
      navigate('/members');
    }
  };

  // 회원 편집 다이얼로그 열기
  const openMemberEditDialog = (member) => {
    setSelectedMember(member);
    setEditedRole(member.role);
    setOpenEditDialog(true);
  };

  // 회원 상태 변경 다이얼로그 열기
  const openStatusChangeDialog = (member) => {
    setStatusMemberId(member.id);
    setStatusAction(member.enabled ? '비활성화' : '활성화');
    setStatusDialogOpen(true);
  };

  // 알림 표시
  const showAlert = (message, severity = 'info') => {
    setAlert({
      show: true,
      message,
      severity
    });

    setTimeout(() => {
      setAlert({ ...alert, show: false });
    }, 3000);
  };

  // 역할에 따른 칩 스타일 및 레이블
  const getRoleChip = (role) => {
    let color = 'default';

    switch (role) {
      case 'ADMIN':
        color = 'error';
        break;
      case 'SUPPLIER':
        color = 'primary';
        break;
      case 'BUYER':
        color = 'success';
        break;
      default:
        color = 'default';
    }

    return <Chip label={role} color={color} size="small" />;
  };

  return (
    <PageContainer>
      <PageTitle variant="h4">
        회원 관리
      </PageTitle>

      {/* 검색 및 필터 */}
      <SearchFilterPaper elevation={2}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>상태 필터</InputLabel>
              <Select
                value={pageRequest.status}
                onChange={handleStatusFilterChange}
                label="상태 필터"
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="active">활성</MenuItem>
                <MenuItem value="inactive">비활성</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>검색 조건</InputLabel>
              <Select
                value={pageRequest.searchType}
                onChange={handleSearchTypeChange}
                label="검색 조건"
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="name">이름</MenuItem>
                <MenuItem value="username">아이디</MenuItem>
                <MenuItem value="email">이메일</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="검색어 입력"
              value={pageRequest.keyword || ''}
              onChange={handleKeywordChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.23)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  }
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={1.5}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleSearch}
            >
              검색
            </Button>
          </Grid>
          <Grid item xs={12} md={1.5}>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              onClick={resetFilters}
            >
              초기화
            </Button>
          </Grid>
        </Grid>
      </SearchFilterPaper>

      {/* 알림 메시지 */}
      {alert.show && (
        <AlertStyled severity={alert.severity}>
          {alert.message}
        </AlertStyled>
      )}

      {/* 회원 목록 */}
      <TablePaper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>아이디</TableCell>
                <TableCell>이름</TableCell>
                <TableCell>이메일</TableCell>
                <TableCell>회사명</TableCell>
                <TableCell>역할</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>관리</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    회원 정보가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.id}</TableCell>
                    <TableCell>{member.username}</TableCell>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.companyName}</TableCell>
                    <TableCell>{getRoleChip(member.role)}</TableCell>
                    <TableCell>
                      <Chip
                        label={member.enabled ? '활성' : '비활성'}
                        color={member.enabled ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => fetchMemberDetail(member.id)}
                          title="상세 정보"
                          color="primary"
                        >
                          <SearchIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => openMemberEditDialog(member)}
                          title="역할 변경"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => openStatusChangeDialog(member)}
                          title={member.enabled ? '비활성화' : '활성화'}
                        >
                          {member.enabled ? (
                            <BlockIcon fontSize="small" />
                          ) : (
                            <CheckCircleIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 페이지네이션 */}
        <PaginationBox>
          <Pagination
            count={totalPages}
            page={pageRequest.page}
            onChange={handlePageChange}
            color="primary"
          />
        </PaginationBox>
      </TablePaper>

      {/* 역할 편집 다이얼로그 */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>회원 역할 수정</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedMember?.name} 회원의 역할을 변경합니다.
          </DialogContentText>
          <FormControl fullWidth margin="normal">
            <InputLabel>역할</InputLabel>
            <Select
              value={editedRole}
              onChange={(e) => setEditedRole(e.target.value)}
              label="역할"
            >
              <MenuItem value="BUYER">구매자 (BUYER)</MenuItem>
              <MenuItem value="SUPPLIER">공급자 (SUPPLIER)</MenuItem>
              <MenuItem value="ADMIN">관리자 (ADMIN)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>취소</Button>
          <Button onClick={updateMemberRole} color="primary">
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 상태 변경 확인 다이얼로그 */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
      >
        <DialogTitle>회원 상태 변경</DialogTitle>
        <DialogContent>
          <DialogContentText>
            정말 이 회원을 {statusAction} 하시겠습니까?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>취소</Button>
          <Button
            onClick={() => {
              toggleMemberStatus(statusMemberId);
              setStatusDialogOpen(false);
            }}
            color="primary"
          >
            확인
          </Button>
        </DialogActions>
      </Dialog>

      {/* 회원 상세정보 및 수정 다이얼로그 */}
      <Dialog
        open={openDetailDialog}
        onClose={() => setOpenDetailDialog(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>회원 상세 정보</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : memberDetail ? (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="아이디"
                  value={memberDetail.username || ''}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="이름"
                  name="name"
                  value={editMemberData?.name || ''}
                  onChange={handleDetailInputChange}
                  variant="outlined"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="이메일"
                  name="email"
                  value={editMemberData?.email || ''}
                  onChange={handleDetailInputChange}
                  variant="outlined"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="회사명"
                  name="companyName"
                  value={editMemberData?.companyName || ''}
                  onChange={handleDetailInputChange}
                  variant="outlined"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="연락처"
                  name="contactNumber"
                  value={editMemberData?.contactNumber || ''}
                  onChange={handleDetailInputChange}
                  variant="outlined"
                  margin="normal"
                  placeholder="000-0000-0000 형식으로 입력"
                  helperText="예: 010-1234-5678"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <TextField
                    label="우편번호"
                    name="postalCode"
                    value={editMemberData?.postalCode || ''}
                    onChange={handleDetailInputChange}
                    variant="outlined"
                    margin="normal"
                    InputProps={{ readOnly: true }}
                    sx={{ width: '60%' }}
                  />
                  <Box sx={{ mt: 2 }}>
                    <KakaoAddressSearch onAddressSelect={handleAddressSelect} />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="도로명 주소"
                  name="roadAddress"
                  value={editMemberData?.roadAddress || ''}
                  onChange={handleDetailInputChange}
                  variant="outlined"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="상세 주소"
                  name="detailAddress"
                  value={editMemberData?.detailAddress || ''}
                  onChange={handleDetailInputChange}
                  variant="outlined"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" disabled>
                  <InputLabel>역할</InputLabel>
                  <Select
                    value={memberDetail.role || ''}
                    label="역할"
                  >
                    <MenuItem value="BUYER">구매자 (BUYER)</MenuItem>
                    <MenuItem value="SUPPLIER">공급자 (SUPPLIER)</MenuItem>
                    <MenuItem value="ADMIN">관리자 (ADMIN)</MenuItem>
                  </Select>
                  <FormHelperText>역할 변경은 별도 버튼을 이용하세요</FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 3, ml: 2 }}>
                  <Typography variant="body1" sx={{ mr: 2 }}>계정 상태:</Typography>
                  <Chip
                    label={memberDetail.enabled ? '활성' : '비활성'}
                    color={memberDetail.enabled ? 'success' : 'default'}
                  />
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="error">회원 정보를 불러올 수 없습니다.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailDialog(false)}>닫기</Button>
          <Button
            onClick={updateMemberDetail}
            color="primary"
            disabled={loading || !memberDetail}
          >
            {loading ? <CircularProgress size={24} /> : "변경사항 저장"}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
