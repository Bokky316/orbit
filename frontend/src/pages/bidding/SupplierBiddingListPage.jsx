import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_URL } from "@/utils/constants";

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
  Grid
} from "@mui/material";

import { BiddingStatus, BiddingMethod } from "./helpers/biddingTypes";
import {
  getStatusText,
  getBidMethodText
} from "./helpers/commonBiddingHelpers";

function SupplierBiddingListPage() {
  const navigate = useNavigate();

  const [biddings, setBiddings] = useState([]);
  const [filteredBiddings, setFilteredBiddings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 필터링 상태
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("all"); // 'all', 'invited', 'participated', 'won'

  // 입찰 공고 목록 가져오기
  const fetchBiddings = async () => {
    setLoading(true);
    try {
      let endpoint = `${API_URL}supplier/biddings`;
      switch (viewMode) {
        case "invited":
          endpoint += "/invited";
          break;
        case "participated":
          endpoint += "/participated";
          break;
        case "won":
          endpoint += "/won";
          break;
        default:
          endpoint += "/active-invited";
      }

      const response = await fetchWithAuth(endpoint);

      if (!response.ok) {
        throw new Error("입찰 공고를 불러오는 중 오류가 발생했습니다.");
      }

      const data = await response.json();
      setBiddings(data);
    } catch (error) {
      setError(error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 필터 적용
  const applyFilters = () => {
    let filtered = [...biddings];

    // 상태 필터
    if (statusFilter) {
      filtered = filtered.filter(
        (bidding) => bidding.status?.childCode === statusFilter
      );
    }

    // 입찰 방식 필터
    if (methodFilter) {
      filtered = filtered.filter(
        (bidding) => bidding.bidMethod === methodFilter
      );
    }

    // 검색어 필터
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
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

  // 데이터 및 필터 변경 시 필터 적용
  useEffect(() => {
    fetchBiddings();
  }, [viewMode]);

  useEffect(() => {
    applyFilters();
  }, [biddings, statusFilter, methodFilter, searchTerm]);

  // 상세 페이지로 이동
  const handleViewDetail = (id) => {
    navigate(`/supplier/biddings/${id}`);
  };

  // 참여 가능 여부 확인
  const canParticipate = (bidding) => {
    // 입찰 상태가 진행중이고 정가제안 방식이면 초대된 공급사만 참여 가능
    // 가격제안 방식이면 모두 참여 가능
    return (
      bidding.status?.childCode === BiddingStatus.ONGOING &&
      (bidding.bidMethod === BiddingMethod.OPEN_PRICE ||
        bidding.invitedSuppliers?.includes(currentUser.supplierId))
    );
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        입찰 공고 목록
      </Typography>

      {/* 필터링 섹션 */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="검색어 입력"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
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
          <Grid item xs={12} md={3}>
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
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>보기 모드</InputLabel>
              <Select
                value={viewMode}
                label="보기 모드"
                onChange={(e) => setViewMode(e.target.value)}>
                <MenuItem value="all">활성 입찰</MenuItem>
                <MenuItem value="invited">초대된 입찰</MenuItem>
                <MenuItem value="participated">참여한 입찰</MenuItem>
                <MenuItem value="won">낙찰된 입찰</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* 입찰 공고 목록 테이블 */}
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
            {filteredBiddings.map((bidding) => (
              <TableRow key={bidding.id} hover>
                <TableCell>{bidding.bidNumber}</TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    color="primary"
                    sx={{ cursor: "pointer" }}
                    onClick={() => handleViewDetail(bidding.id)}>
                    {bidding.title}
                  </Typography>
                </TableCell>
                <TableCell>{getBidMethodText(bidding.bidMethod)}</TableCell>
                <TableCell>
                  {bidding.startDate && bidding.endDate
                    ? `${moment(bidding.startDate).format("YYYY-MM-DD")} ~ 
                       ${moment(bidding.endDate).format("YYYY-MM-DD")}`
                    : "-"}
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusText(bidding.status)}
                    color={
                      bidding.status?.childCode === BiddingStatus.PENDING
                        ? "default"
                        : bidding.status?.childCode === BiddingStatus.ONGOING
                        ? "primary"
                        : bidding.status?.childCode === BiddingStatus.CLOSED
                        ? "success"
                        : bidding.status?.childCode === BiddingStatus.CANCELED
                        ? "error"
                        : "default"
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {canParticipate(bidding) ? (
                    <Chip label="참여 가능" color="success" size="small" />
                  ) : (
                    <Chip label="참여 불가" color="default" size="small" />
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 요약 섹션 */}
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
              {filteredBiddings.filter(canParticipate).length}건
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2">
              참여한 입찰 공고:{" "}
              {
                filteredBiddings.filter((bidding) =>
                  bidding.participations?.some(
                    (p) => p.supplierId === currentUser.supplierId
                  )
                ).length
              }
              건
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default SupplierBiddingListPage;
