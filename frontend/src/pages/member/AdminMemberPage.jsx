import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, TextField, MenuItem, Select, FormControl, InputLabel, Box, Grid, TablePagination,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  IconButton, Chip, Stack, CircularProgress, Alert, Container,
  styled, FormHelperText
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Clear
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
  const roleFromQuery = queryParams.get('role'); // 역할 쿼리 파라미터 추가

  // 이미 마운트된 상태인지 확인하는 플래그 추가 (컴포넌트 최상위 레벨에서 선언)
  const initialLoadDone = React.useRef(false);
  const didInitialRender = React.useRef(false);

  // 상태
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [pageRequest, setPageRequest] = useState({
    page: 0, // TablePagination은 0부터 시작
    size: 15,
    searchType: '',
    keyword: '',
    status: statusFromQuery || '',
    role: roleFromQuery || '' // 역할 필터 추가
  });

  // 검색 실행
  const handleSearch = () => {
    console.log('검색 실행:', {
      keyword: pageRequest.keyword,
      searchType: pageRequest.searchType
    });

    // 검색어가 있는데 검색 조건이 없는 경우
    if (pageRequest.keyword && !pageRequest.searchType) {
      setPageRequest(prev => ({
        ...prev,
        page: 0, // 첫 페이지로 이동 (0부터 시작)
        searchType: 'name'  // 기본 검색 타입 설정
      }));
    } else {
      setPageRequest({
        ...pageRequest,
        page: 0 // 검색 시 첫 페이지로 이동
      });
    }
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
    console.log("URL 쿼리 파라미터 변경:", { status: statusFromQuery, role: roleFromQuery });
    setPageRequest(prev => ({
      ...prev,
      status: statusFromQuery || '',
      role: roleFromQuery || '',
      page: 0 // 필터 변경 시 첫 페이지로 이동
    }));
  }, [location.search, statusFromQuery, roleFromQuery]);

  // 통합된 useEffect와 함께 마운트 플래그 사용
  // 단일 통합 useEffect - 모든 데이터 로딩 관련 로직 처리
  useEffect(() => {
    // 권한 확인
    if (!user || !user.roles || !user.roles.includes('ROLE_ADMIN')) {
      navigate('/unauthorized');
      return;
    }

    // StrictMode에서 이중 호출 문제 해결
    if (!didInitialRender.current) {
      didInitialRender.current = true;
      return; // 첫 번째 렌더링 시 아무것도 하지 않음
    }

    // 검색어 입력 시에만 디바운스 적용
    if ((pageRequest.searchType || pageRequest.keyword) && initialLoadDone.current) {
      const timer = setTimeout(() => {
        fetchMembers();
    }, 500); // 500ms 디바운스 적용

        return () => clearTimeout(timer);
    } else {
      // 첫 로딩 또는 페이지네이션/상태 필터 변경 시 즉시 실행
      fetchMembers();
      initialLoadDone.current = true;
    }
  }, [pageRequest.page, pageRequest.size, pageRequest.status, pageRequest.searchType, pageRequest.keyword, user]);

  // 페이지, 사이즈, 상태 변경 시 목록 조회
  useEffect(() => {
    if (user && user.roles && user.roles.includes('ROLE_ADMIN')) {
      fetchMembers();
    } else {
      navigate('/unauthorized');
    }
  }, [pageRequest.page, pageRequest.size, pageRequest.status, pageRequest.role, pageRequest.searchType, pageRequest.keyword, user]);

  // 회원 목록 조회
  const fetchMembers = async () => {
    setLoading(true);
    try {
      // 역할 필터를 제외한 나머지 필터만 백엔드에 전송
      const queryParams = new URLSearchParams();

      // 역할 필터링은 프론트엔드에서 처리하므로 백엔드에는 전체 데이터 요청
      // 백엔드 페이징 파라미터는 보내지 않거나 큰 값을 전송 (전체 데이터 가져오기 위해)
      // 이 부분은 데이터 양에 따라 최적화 필요
      queryParams.append('page', 1);
      queryParams.append('size', 1000); // 충분히 큰 값으로 설정

      // 검색 조건이 있을 때만 추가
      if (pageRequest.searchType) {
        queryParams.append('searchType', pageRequest.searchType);
      }

      // 상태 필터가 있을 때만 추가
      if (pageRequest.status === 'active') {
        queryParams.append('status', 'active');
      } else if (pageRequest.status === 'inactive') {
        queryParams.append('status', 'inactive');
      }

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

        // 응답 데이터 구조 확인
        if (data && Array.isArray(data.dtoList)) {
          let membersList = data.dtoList || [];

          // 역할 필터링
          let filteredMembers = [...membersList];

          if (pageRequest.role) {
            const roleFilter = pageRequest.role.toUpperCase();

            if (roleFilter === 'EMPLOYEE') {
              filteredMembers = filteredMembers.filter(member => {
                const role = (member.role || '').toString().toUpperCase();
                return role === 'BUYER' || role === 'ADMIN';
              });
            } else {
              filteredMembers = filteredMembers.filter(member => {
                const role = (member.role || '').toString().toUpperCase();
                return role === roleFilter;
              });
            }

            console.log("역할 필터링 후 결과 수:", filteredMembers.length);
          }

          // 필터링된 총 항목 수 계산
          const totalFilteredItems = filteredMembers.length;

          // 현재 페이지에 표시할 항목 계산
          const startIndex = pageRequest.page * pageRequest.size;
          const endIndex = Math.min(startIndex + pageRequest.size, totalFilteredItems);

          // 현재 페이지에 해당하는 항목들
          const pagedMembers = filteredMembers.slice(startIndex, endIndex);

          // 상태 업데이트
          setMembers(pagedMembers);
          setTotalItems(totalFilteredItems);

          // 결과가 없을 때 알림
          if (filteredMembers.length === 0) {
            const message = pageRequest.role
              ? `'${pageRequest.role === 'employee' ? '직원(BUYER, ADMIN)' : pageRequest.role}' 역할을 가진 회원이 없습니다.`
              : pageRequest.status === 'inactive'
                ? '비활성화된 회원이 없습니다.'
                : '검색 결과가 없습니다.';

            showAlert(message, 'info');
          }
        } else {
          console.warn("응답 데이터 형식이 예상과 다릅니다:", data);
          setMembers([]);
          setTotalItems(0);
        }
      } else {
        console.error("API 호출 실패:", response.status);
        showAlert(`회원 목록을 불러오는데 실패했습니다. (${response.status})`, 'error');
        setMembers([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('회원 목록 조회 오류:', error);
      setMembers([]);
      setTotalItems(0);
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
        try {
          // 텍스트로 먼저 받아옴
          const responseText = await response.text();

          // 응답 텍스트 일부를 로깅
          console.log("응답 텍스트 일부:", responseText.substring(0, 150));

          // 응답 텍스트가 유효한 JSON인지 확인하고 정리
          let cleanedText = responseText;
          try {
            // 유효한 부분까지만 파싱하기 위한 작업
            // 응답의 시작 부분이 { 인지 확인
            if (cleanedText.trim().startsWith('{')) {
              // 다양한 회사명 패턴 확인
              const companyNamePatterns = [
                /"companyName":"([^"]+)"/,  // 기본 패턴
                /"companyName":[ ]*"([^"]+)"/,  // 공백 포함 패턴
                /"company_name":"([^"]+)"/,  // 스네이크 케이스 패턴
              ];

              let companyName = '';
              for (const pattern of companyNamePatterns) {
                const match = pattern.exec(cleanedText);
                if (match) {
                  companyName = match[1];
                  console.log("찾은 회사명 패턴:", pattern, "회사명:", companyName);
                  break;
                }
              }

              // 기존 정규식 추출
              const idMatch = /"id":(\d+)/.exec(cleanedText);
              const usernameMatch = /"username":"([^"]+)"/.exec(cleanedText);
              const nameMatch = /"name":"([^"]+)"/.exec(cleanedText);
              const emailMatch = /"email":"([^"]+)"/.exec(cleanedText);
              const contactNumberMatch = /"contactNumber":"([^"]+)"/.exec(cleanedText);
              const postalCodeMatch = /"postalCode":"([^"]+)"/.exec(cleanedText);
              const roadAddressMatch = /"roadAddress":"([^"]+)"/.exec(cleanedText);
              const detailAddressMatch = /"detailAddress":"([^"]+)"/.exec(cleanedText);
              const roleMatch = /"role":"([^"]+)"/.exec(cleanedText);
              const enabledMatch = /"enabled":(true|false)/.exec(cleanedText);

              // 추출한 정보로 회원 객체 구성
              const extractedMember = {
                id: idMatch ? parseInt(idMatch[1]) : id,
                username: usernameMatch ? usernameMatch[1] : '',
                name: nameMatch ? nameMatch[1] : '',
                email: emailMatch ? emailMatch[1] : '',
                companyName: companyName,  // 수정된 회사명 사용
                contactNumber: contactNumberMatch ? contactNumberMatch[1] : '',
                postalCode: postalCodeMatch ? postalCodeMatch[1] : '',
                roadAddress: roadAddressMatch ? roadAddressMatch[1] : '',
                detailAddress: detailAddressMatch ? detailAddressMatch[1] : '',
                role: roleMatch ? roleMatch[1] : '',
                enabled: enabledMatch ? enabledMatch[1] === 'true' : true
              };

              // 회원 목록에서 회사명 보완
              if (!companyName) {
                const memberFromList = members.find(m => m.id === id);
                if (memberFromList && memberFromList.companyName) {
                  extractedMember.companyName = memberFromList.companyName;
                  console.log("목록에서 가져온 회사명:", extractedMember.companyName);
                }
              }

              console.log("추출된 회원 정보:", extractedMember);

              // 회원 정보 설정
              setMemberDetail(extractedMember);
              setEditMemberData({
                name: extractedMember.name,
                email: extractedMember.email,
                companyName: extractedMember.companyName,
                contactNumber: extractedMember.contactNumber,
                postalCode: extractedMember.postalCode,
                roadAddress: extractedMember.roadAddress,
                detailAddress: extractedMember.detailAddress
              });

              // 디버깅을 위해 로깅
              console.log("설정된 수정 데이터:", {
                ...editMemberData,
                companyName: extractedMember.companyName
              });

              setOpenDetailDialog(true);
            } else {
              throw new Error("응답이 올바른 JSON 형식이 아닙니다.");
            }
          } catch (extractError) {
            console.error("데이터 추출 오류:", extractError);

            // 회원 목록에서 기본 정보 사용
            const member = members.find(m => m.id === id);
            if (member) {
              const simpleMember = {
                id: member.id,
                username: member.username,
                name: member.name,
                email: member.email,
                companyName: member.companyName || '',
                contactNumber: member.contactNumber || '',
                role: member.role,
                enabled: member.enabled
              };

              setMemberDetail(simpleMember);
              setEditMemberData({
                name: member.name,
                email: member.email,
                companyName: member.companyName || '',
                contactNumber: member.contactNumber || '',
                postalCode: '',
                roadAddress: '',
                detailAddress: ''
              });
              setOpenDetailDialog(true);
              showAlert('일부 회원 정보만 표시됩니다.', 'warning');
            } else {
              showAlert('회원 정보를 불러올 수 없습니다.', 'error');
            }
          }
        } catch (error) {
          console.error('응답 처리 오류:', error);
          showAlert('회원 정보 처리 중 오류가 발생했습니다.', 'error');
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

      // 백엔드 오류를 방지하기 위해 불필요한 속성 제거
      const cleanedData = {
        name: editMemberData.name,
        email: editMemberData.email,
        companyName: editMemberData.companyName || '',
        contactNumber: editMemberData.contactNumber || '',
        postalCode: editMemberData.postalCode || '',
        roadAddress: editMemberData.roadAddress || '',
        detailAddress: editMemberData.detailAddress || ''
      };

      console.log("전송할 데이터:", cleanedData);

      const response = await fetchWithAuth(`${API_URL}members/${memberDetail.id}`, {
        method: 'PUT',
        body: JSON.stringify(cleanedData)
      });

      if (response.ok) {
        try {
          const result = await response.json();
          if (result.status === "success") {
            showAlert('회원 정보가 성공적으로 수정되었습니다.', 'success');
            setOpenDetailDialog(false);
            fetchMembers(); // 목록 새로고침
          } else {
            showAlert(result.message || '회원 정보 수정에 실패했습니다.', 'error');
          }
        } catch (parseError) {
          console.error('응답 파싱 오류:', parseError);
          // 응답은 성공했지만 파싱에 실패한 경우
          showAlert('회원 정보가 수정되었으나 서버 응답을 처리할 수 없습니다.', 'warning');
          setOpenDetailDialog(false);
          fetchMembers(); // 목록 새로고침
        }
      } else {
        // 서버 오류 처리
        console.error('서버 오류 상태:', response.status);

        try {
          const errorText = await response.text();
          console.error('오류 응답:', errorText);

          // 구체적인 에러 메시지가 있는지 확인
          if (errorText && errorText.includes('message')) {
            try {
              const errorJson = JSON.parse(errorText);
              showAlert(errorJson.message || '회원 정보 수정에 실패했습니다.', 'error');
            } catch (e) {
              showAlert('회원 정보 수정에 실패했습니다.', 'error');
            }
          } else {
            // 임시 방편으로 데이터베이스 업데이트가 문제일 수 있다고 알림
            showAlert('회원 정보 수정에 실패했습니다. 서버 오류가 발생했습니다.', 'error');
          }
        } catch (error) {
          showAlert('회원 정보 수정에 실패했습니다.', 'error');
        }
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
      page: 0, // TablePagination은 0부터 시작
      size: 15,
      searchType: '',
      keyword: '',
      status: '',
      role: '' // 역할 필터도 초기화
    });

    // URL 쿼리 파라미터 초기화
    navigate('/members');
  };


  // 페이지 변경
  const handlePageChange = (event, newPage) => {
    setPageRequest({
      ...pageRequest,
      page: newPage
    });
  };

  // 페이지당 행 수 변경 핸들러
  const handleChangeRowsPerPage = (event) => {
    setPageRequest({
      ...pageRequest,
      size: parseInt(event.target.value, 15),
      page: 0 // 페이지당 행 수 변경 시 첫 페이지로 이동
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
    const { value } = event.target;

    // 콘솔 로그 추가
    console.log(`검색어 변경 전: ${pageRequest.keyword}`);
    console.log(`검색어 변경 후: ${value}`);

    // 검색어가 변경되면 searchType도 설정
    // 검색어가 있고 searchType이 없으면 기본값 'name'으로 설정
    if (value && !pageRequest.searchType) {
      setPageRequest(prev => ({
        ...prev,
        keyword: value,
        searchType: 'name'  // 기본 검색 타입 설정
      }));
    } else {
      setPageRequest(prev => ({
        ...prev,
        keyword: value
      }));
    }
  };

  // 상태 필터 변경
    const handleStatusFilterChange = (event) => {
      const newStatus = event.target.value;
      setPageRequest({
        ...pageRequest,
        status: newStatus,
        page: 0 // 필터 변경 시 첫 페이지로 이동, TablePagination은 0부터 시작
      });

      // URL 쿼리 파라미터 업데이트
      updateURLParams(newStatus, pageRequest.role);
    };

    // 역할 필터 변경 핸들러
    const handleRoleFilterChange = (event) => {
      const newRole = event.target.value;
      console.log("역할 필터 변경:", newRole);

      setPageRequest(prev => ({
        ...prev,
        role: newRole,
        page: 0 // 필터 변경 시 첫 페이지로 이동
      }));

      // URL 쿼리 파라미터 업데이트
      updateURLParams(pageRequest.status, newRole);
    };

    // URL 쿼리 파라미터 업데이트 함수 (함수를 외부로 이동)
    const updateURLParams = (status, role) => {
      const params = new URLSearchParams();

      if (status) {
        params.append('status', status);
      }

      if (role) {
        params.append('role', role);
      }

      const queryString = params.toString();
      navigate(`/members${queryString ? `?${queryString}` : ''}`);
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
      let displayRole = role ? role.toUpperCase() : '';  // 대문자로 표시

      switch (displayRole) {
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

      return <Chip label={displayRole} color={color} size="small" />;
    };

    return (
      <PageContainer>
        <PageTitle variant="h4">
          사용자 목록
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
            <Grid item xs={12} md={3}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>역할 필터</InputLabel>
                <Select
                  value={pageRequest.role}
                  onChange={handleRoleFilterChange}
                  label="역할 필터"
                >
                  <MenuItem value="">전체</MenuItem>
                  <MenuItem value="employee">직원 (BUYER, ADMIN)</MenuItem>
                  <MenuItem value="BUYER">구매자 (BUYER)</MenuItem>
                  <MenuItem value="SUPPLIER">공급자 (SUPPLIER)</MenuItem>
                  <MenuItem value="ADMIN">관리자 (ADMIN)</MenuItem>
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
                size="small"
                label="검색어 입력 (자동 검색)"
                name="keyword"
                value={pageRequest.keyword || ''}
                onChange={handleKeywordChange}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  endAdornment: pageRequest.keyword ? (
                    <IconButton
                      size="small"
                      onClick={() => {
                        setPageRequest(prev => ({
                          ...prev,
                          keyword: '',
                          // 검색어를 지울 때 검색 조건도 초기화할지 여부 (필요에 따라 주석 해제)
                          // searchType: ''
                        }));

                        // 상태 업데이트 후 즉시 검색 실행
                        fetchMembers();
                      }}
                    >
                      <Clear fontSize="small" />
                    </IconButton>
                  ) : (
                    <SearchIcon color="action" fontSize="small" />
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={resetFilters}
                sx={{ minWidth: '120px' }}  // 적절한 최소 너비 지정
              >
                필터 초기화
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

          {/* 테이블 페이지네이션 */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 15, 30]}
            component="div"
            count={totalItems}
            rowsPerPage={pageRequest.size}
            page={pageRequest.page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="페이지당 행 수"
            labelDisplayedRows={({ from, to, count, page }) => {
              const totalPages = Math.ceil(count / pageRequest.size);
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
            <Button onClick={updateMemberRole} color="primary">
              저장
            </Button>
            <Button onClick={() => setOpenEditDialog(false)}>취소</Button>
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
            <Button
              onClick={() => {
                toggleMemberStatus(statusMemberId);
                setStatusDialogOpen(false);
              }}
              color="primary"
            >
              확인
            </Button>
            <Button onClick={() => setStatusDialogOpen(false)}>취소</Button>
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
                      value={memberDetail.role ? memberDetail.role.toUpperCase() : ''}
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
            <Button
              onClick={updateMemberDetail}
              color="primary"
              disabled={loading || !memberDetail}
            >
              {loading ? <CircularProgress size={24} /> : "변경사항 저장"}
            </Button>
            <Button onClick={() => setOpenDetailDialog(false)}>닫기</Button>
          </DialogActions>
        </Dialog>
      </PageContainer>
    );
  }