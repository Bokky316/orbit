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
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

function ContractsListPage() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // 계약 목록 가져오기
  const fetchContracts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`${API_URL}contracts`);
      if (!response.ok) {
        throw new Error(
          `계약 목록을 가져오는데 실패했습니다. (${response.status})`
        );
      }
      const data = await response.json();
      setContracts(data);
    } catch (err) {
      console.error("계약 목록 가져오기 실패:", err);
      setError(`계약 목록을 불러오는 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    fetchContracts();
  }, []);

  // 검색 처리
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // 필터링된 계약 목록
  const filteredContracts = contracts.filter((contract) => {
    const searchValue = searchTerm.toLowerCase();
    return (
      contract.transactionNumber?.toLowerCase().includes(searchValue) ||
      contract.supplierName?.toLowerCase().includes(searchValue) ||
      contract.biddingNumber?.toLowerCase().includes(searchValue) ||
      String(contract.totalAmount).includes(searchValue)
    );
  });

  // 계약 상세 페이지로 이동
  const handleViewContract = (contractId) => {
    navigate(`/contracts/${contractId}`);
  };

  // 계약서 다운로드
  const handleDownloadContract = async (contractId, transactionNumber) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}contracts/${contractId}/download`,
        {
          method: "GET",
          headers: {
            Accept: "application/pdf"
          }
        }
      );

      if (!response.ok) {
        throw new Error(`계약서 다운로드에 실패했습니다. (${response.status})`);
      }

      // Blob으로 응답 데이터 가져오기
      const blob = await response.blob();

      // 다운로드 링크 생성
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `계약서_${transactionNumber}.pdf`;
      document.body.appendChild(a);
      a.click();

      // 링크 정리
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 0);
    } catch (err) {
      console.error("계약서 다운로드 오류:", err);
      alert(`계약서 다운로드 중 오류가 발생했습니다: ${err.message}`);
    }
  };

  // 계약 상태에 따른 색상
  const getStatusColor = (status) => {
    switch (status) {
      case "초안":
        return "default";
      case "서명중":
        return "warning";
      case "활성":
        return "success";
      case "완료":
        return "info";
      case "취소":
        return "error";
      default:
        return "default";
    }
  };

  // 서명 상태에 따른 색상
  const getSignatureStatusColor = (status) => {
    switch (status) {
      case "미서명":
        return "default";
      case "내부서명":
        return "warning";
      case "완료":
        return "success";
      default:
        return "default";
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && contracts.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "70vh"
        }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          계약 목록을 불러오는 중...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4
        }}>
        <Typography variant="h4">계약 관리</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/biddings")}>
          입찰 목록으로
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="계약번호, 공급자, 입찰번호 등으로 검색"
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>계약번호</TableCell>
                <TableCell>입찰번호</TableCell>
                <TableCell>공급자</TableCell>
                <TableCell align="right">금액</TableCell>
                <TableCell>계약기간</TableCell>
                <TableCell>계약상태</TableCell>
                <TableCell>서명상태</TableCell>
                <TableCell align="center">관리</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredContracts.length > 0 ? (
                filteredContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>{contract.transactionNumber}</TableCell>
                    <TableCell>{contract.biddingNumber || "-"}</TableCell>
                    <TableCell>{contract.supplierName}</TableCell>
                    <TableCell align="right">
                      {contract.totalAmount.toLocaleString()}원
                    </TableCell>
                    <TableCell>
                      {formatDate(contract.startDate)} ~{" "}
                      {formatDate(contract.endDate)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={contract.status}
                        color={getStatusColor(contract.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={contract.signatureStatus}
                        color={getSignatureStatusColor(
                          contract.signatureStatus
                        )}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="계약 상세 보기">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewContract(contract.id)}>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      {contract.finalContractFilePath && (
                        <Tooltip title="계약서 다운로드">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() =>
                              handleDownloadContract(
                                contract.id,
                                contract.transactionNumber
                              )
                            }>
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    {searchTerm
                      ? "검색 결과가 없습니다."
                      : "등록된 계약이 없습니다."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default ContractsListPage;
