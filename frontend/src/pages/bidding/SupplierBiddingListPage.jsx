import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  CircularProgress
} from "@mui/material";

import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_URL } from "@/utils/constants";
// 헬퍼 함수 import
import {
  getStatusText,
  getBidMethodText
} from "./helpers/commonBiddingHelpers";

import {
  BiddingStatus,
  UserRole,
  BiddingMethod,
  canParticipateInBidding,
  filterParticipableBiddings,
  filterMyParticipations,
  filterInvitedBiddings
} from "./helpers/supplierBiddingHelpers";

function SupplierBiddingListPage() {
  const navigate = useNavigate();

  // 상태 관리
  const [biddings, setBiddings] = useState([]);
  const [filteredBiddings, setFilteredBiddings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 필터링 상태
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("all"); // 'all', 'participable', 'participated', 'invited'

  // 사용자 정보 상태
  const [userSupplierInfo, setUserSupplierInfo] = useState(null);

  // 사용자 정보 가져오기 (공급사 정보)
  const fetchUserInfo = async () => {
    try {
      // 사용자 정보 API 호출
      const userResponse = await fetchWithAuth(`${API_URL}users/me`);
      if (!userResponse.ok) {
        throw new Error("사용자 정보를 불러올 수 없습니다.");
      }

      const userData = await userResponse.json();

      // 사용자가 공급사인 경우 공급사 정보 가져오기
      if (userData.role === UserRole.SUPPLIER) {
        const supplierResponse = await fetchWithAuth(
          `${API_URL}suppliers/by-user/${userData.id}`
        );
        if (supplierResponse.ok) {
          const supplierData = await supplierResponse.json();
          setUserSupplierInfo(supplierData);
        }
      }
    } catch (error) {
      console.error("사용자 정보 로드 중 오류:", error);
    }
  };

  // 입찰 공고 목록 불러오기
  const fetchBiddings = async () => {
    setLoading(true);
    try {
      // 초대된 입찰 공고 + 공개 입찰 공고 모두 조회
      const [invitedResponse, openResponse] = await Promise.all([
        fetchWithAuth(`${API_URL}supplier/biddings/invited`),
        fetchWithAuth(`${API_URL}biddings/open`)
      ]);

      if (!invitedResponse.ok || !openResponse.ok) {
        throw new Error("입찰 공고를 불러오는 중 오류가 발생했습니다.");
      }

      const invitedBiddings = await invitedResponse.json();
      const openBiddings = await openResponse.json();

      // 중복 제거 및 병합
      const combinedBiddings = [
        ...invitedBiddings,
        ...openBiddings.filter(
          (open) => !invitedBiddings.some((invited) => invited.id === open.id)
        )
      ];

      setBiddings(combinedBiddings);
      applyFilters(
        combinedBiddings,
        viewMode,
        statusFilter,
        methodFilter,
        searchTerm
      );
    } catch (error) {
      setError("입찰 공고를 불러오는 중 오류가 발생했습니다.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 필터 적용
  const applyFilters = (
    biddingList,
    currentViewMode,
    status,
    method,
    search
  ) => {
    let filtered = [...biddingList];

    // 보기 모드에 따른 필터링
    switch (currentViewMode) {
      case "participable":
        filtered = filterParticipableBiddings(filtered, userSupplierInfo);
        break;
      case "participated":
        filtered = filterMyParticipations(filtered, userSupplierInfo);
        break;
      case "invited":
        filtered = filterInvitedBiddings(filtered, userSupplierInfo);
        break;
      default:
        // 모두 보기는 필터링 없음
        break;
    }

    // 상태 필터
    if (status) {
      filtered = filtered.filter(
        (bidding) => bidding.status?.childCode === status
      );
    }

    // 입찰 방식 필터
    if (method) {
      filtered = filtered.filter((bidding) => bidding.bidMethod === method);
    }

    // 검색어 필터
    if (search) {
      const searchTermLower = search.toLowerCase();
      filtered = filtered.filter(
        (bidding) =>
          (bidding.title &&
            bidding.title.toLowerCase().includes(searchTermLower)) ||
          (bidding.bidNumber &&
            bidding.bidNumber.toLowerCase().includes(searchTermLower))
      );
    }

    setFilteredBiddings(filtered);
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchUserInfo();
  }, []);

  // 사용자 정보가 로드된 후 입찰 정보 가져오기
  useEffect(() => {
    if (userSupplierInfo) {
      fetchBiddings();
    }
  }, [userSupplierInfo]);

  // 필터 변경 시 필터 적용
  useEffect(() => {
    applyFilters(biddings, viewMode, statusFilter, methodFilter, searchTerm);
  }, [viewMode, statusFilter, methodFilter, searchTerm, biddings]);

  // 입찰 상세 페이지로 이동
  const handleViewDetail = (id) => {
    navigate(`/supplier/biddings/${id}`);
  };

  // 입찰 참여 가능 여부 확인
  const checkParticipationEligibility = (bidding) => {
    return canParticipateInBidding(
      bidding,
      UserRole.SUPPLIER,
      userSupplierInfo
    );
  };

  // 보기 모드 변경 핸들러
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    applyFilters(biddings, mode, statusFilter, methodFilter, searchTerm);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        입찰 공고 목록
      </Typography>

      {/* 필터링 섹션 */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="검색어 입력"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>상태</InputLabel>
              <Select
                value={statusFilter}
                label="상태"
                onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="">전체</MenuItem>
                <MenuItem value={BiddingStatus.PENDING}>대기중</MenuItem>
                <MenuItem value={BiddingStatus.ONGOING}>진행중</MenuItem>
                <MenuItem value={BiddingStatus.CLOSED}>마감</MenuItem>
                <MenuItem value={BiddingStatus.CANCELED}>취소</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>입찰 방식</InputLabel>
              <Select
                value={methodFilter}
                label="입찰 방식"
                onChange={(e) => setMethodFilter(e.target.value)}>
                <MenuItem value="">전체</MenuItem>
                <MenuItem value={BiddingMethod.FIXED_PRICE}>정가제안</MenuItem>
                <MenuItem value={BiddingMethod.OPEN_PRICE}>가격제안</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>보기 모드</InputLabel>
              <Select
                value={viewMode}
                label="보기 모드"
                onChange={(e) => handleViewModeChange(e.target.value)}>
                <MenuItem value="all">모든 입찰</MenuItem>
                <MenuItem value="participable">참여 가능한 입찰</MenuItem>
                <MenuItem value="participated">참여한 입찰</MenuItem>
                <MenuItem value="invited">초대된 입찰</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* 로딩 상태 */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ my: 2 }}>
          <Paper sx={{ p: 2, bgcolor: "error.light" }}>
            <Typography color="error">{error}</Typography>
          </Paper>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>공고번호</TableCell>
                  <TableCell>공고명</TableCell>
                  <TableCell>입찰 방식</TableCell>
                  <TableCell>공고 기간</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>참여 가능 여부</TableCell>
                  <TableCell>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBiddings.length > 0 ? (
                  filteredBiddings.map((bidding) => (
                    <TableRow key={bidding.id} hover>
                      <TableCell>{bidding.bidNumber}</TableCell>
                      <TableCell>{bidding.title}</TableCell>
                      <TableCell>
                        {getBidMethodText(bidding.bidMethod)}
                      </TableCell>
                      <TableCell>
                        {bidding.startDate && bidding.endDate
                          ? `${new Date(
                              bidding.startDate
                            ).toLocaleDateString()} ~ 
                             ${new Date(bidding.endDate).toLocaleDateString()}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusText(bidding.status)}
                          color={
                            bidding.status?.childCode === BiddingStatus.PENDING
                              ? "default"
                              : bidding.status?.childCode ===
                                BiddingStatus.ONGOING
                              ? "primary"
                              : bidding.status?.childCode ===
                                BiddingStatus.CLOSED
                              ? "success"
                              : bidding.status?.childCode ===
                                BiddingStatus.CANCELED
                              ? "error"
                              : "default"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {checkParticipationEligibility(bidding) ? (
                          <Chip
                            label="참여 가능"
                            color="success"
                            size="small"
                          />
                        ) : (
                          <Chip label="참여 불가" color="error" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          onClick={() => handleViewDetail(bidding.id)}>
                          상세보기
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body1" sx={{ py: 2 }}>
                        데이터가 없습니다.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 추가 정보 및 요약 */}
          <Box sx={{ mt: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  총 입찰 공고: {filteredBiddings.length}건
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  참여 가능 입찰 공고:{" "}
                  {
                    filteredBiddings.filter(checkParticipationEligibility)
                      .length
                  }
                  건
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  참여한 입찰 공고:{" "}
                  {
                    filteredBiddings.filter((bidding) =>
                      bidding.participations?.some(
                        (p) => p.supplierId === userSupplierInfo?.id
                      )
                    ).length
                  }
                  건
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </>
      )}
    </Box>
  );
}

export default SupplierBiddingListPage;
