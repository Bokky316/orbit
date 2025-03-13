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
import {
  getStatusText,
  getBidMethodText,
  canParticipateInBidding
} from "./helpers/biddingHelpers";

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

  // 사용자 정보 (컨텍스트나 훅에서 가져올 수 있음)
  const [userSupplierInfo, setUserSupplierInfo] = useState(null);

  // 입찰 공고 목록 불러오기
  const fetchBiddings = async () => {
    setLoading(true);
    try {
      // 초대된 입찰 공고 + 공개 입찰 공고 모두 조회
      const [invitedResponse, openResponse] = await Promise.all([
        fetchWithAuth(`${API_URL}/biddings/supplier/invited`),
        fetchWithAuth(`${API_URL}/biddings/open`)
      ]);

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
      applyFilters(combinedBiddings);
    } catch (error) {
      setError("입찰 공고를 불러오는 중 오류가 발생했습니다.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 필터 적용
  const applyFilters = (biddingList) => {
    let filtered = biddingList;

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
          bidding.title.toLowerCase().includes(searchTermLower) ||
          bidding.bidNumber.toLowerCase().includes(searchTermLower)
      );
    }

    setFilteredBiddings(filtered);
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchBiddings();
  }, []);

  // 필터 변경 시 필터 적용
  useEffect(() => {
    applyFilters(biddings);
  }, [statusFilter, methodFilter, searchTerm]);

  // 입찰 상세 페이지로 이동
  const handleViewDetail = (id) => {
    navigate(`/supplier/biddings/${id}`);
  };

  // 입찰 참여 가능 여부 확인
  const checkParticipationEligibility = (bidding) => {
    return canParticipateInBidding(bidding, userSupplierInfo);
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
                <MenuItem value="PENDING">대기중</MenuItem>
                <MenuItem value="ONGOING">진행중</MenuItem>
                <MenuItem value="CLOSED">마감</MenuItem>
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
                <MenuItem value="정가제안">정가제안</MenuItem>
                <MenuItem value="가격제안">가격제안</MenuItem>
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
      ) : (
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
                  <TableCell>{bidding.title}</TableCell>
                  <TableCell>{getBidMethodText(bidding.bidMethod)}</TableCell>
                  <TableCell>
                    {bidding.startDate && bidding.endDate
                      ? `${new Date(bidding.startDate).toLocaleDateString()} ~ 
                         ${new Date(bidding.endDate).toLocaleDateString()}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusText(bidding.status)}
                      color={
                        bidding.status?.childCode === "PENDING"
                          ? "default"
                          : bidding.status?.childCode === "ONGOING"
                          ? "primary"
                          : bidding.status?.childCode === "CLOSED"
                          ? "success"
                          : "default"
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {checkParticipationEligibility(bidding) ? (
                      <Chip label="참여 가능" color="success" size="small" />
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
                  {/* 추가 정보 및 페이징 */}
                  <div className="list-footer">
                    <div className="bidding-summary">
                      <p>총 입찰 공고: {filteredBiddings.length}건</p>
                      <p>
                        참여 가능 입찰 공고:{" "}
                        {
                          filteredBiddings.filter(checkParticipationEligibility)
                            .length
                        }
                        건
                      </p>
                    </div>
                  </div>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default SupplierBiddingListPage;
