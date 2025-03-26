// SupplierContractsListPage.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import { useNavigate } from "react-router-dom";
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

const SupplierContractsListPage = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetchWithAuth(`${API_URL}suppliers/contracts`);
        const data = await res.json();
        setContracts(data);
      } catch (err) {
        console.error("계약 목록 가져오기 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleView = (id) => {
    navigate(`/suppliers/contracts/${id}`);
  };

  const handleDownload = async (id, fileName) => {
    try {
      const res = await fetchWithAuth(`${API_URL}contracts/${id}/download`, {
        method: "GET"
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "contract.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("다운로드 실패: " + err.message);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        계약 목록
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>계약번호</TableCell>
                  <TableCell>계약명</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contracts.length > 0 ? (
                  contracts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.transactionNumber}</TableCell>
                      <TableCell>{c.title}</TableCell>
                      <TableCell>
                        <Chip label={c.status} color="primary" size="small" />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="상세 보기">
                          <IconButton onClick={() => handleView(c.id)}>
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        {c.finalContractFilePath && (
                          <Tooltip title="계약서 다운로드">
                            <IconButton
                              onClick={() =>
                                handleDownload(
                                  c.id,
                                  `계약서_${c.transactionNumber}.pdf`
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
                    <TableCell colSpan={4} align="center">
                      계약 내역이 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default SupplierContractsListPage;
