// BiddingOrderDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  CircularProgress,
  Chip,
  Button
} from "@mui/material";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_URL } from "@/utils/constants";
import { formatNumber } from "../bidding/helpers/commonBiddingHelpers";
import moment from "moment";

const BiddingOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetchWithAuth(`${API_URL}bidding-orders/${id}`);
        if (!res.ok) throw new Error("발주 정보 조회 실패");
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const formatDate = (dateStr) => moment(dateStr).format("YYYY-MM-DD");
  const formatDateTime = (dateStr) =>
    moment(dateStr).format("YYYY-MM-DD HH:mm:ss");

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !order) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">
          {error || "발주 정보를 불러올 수 없습니다."}
        </Typography>
        <Button variant="contained" onClick={() => navigate("/orders")}>
          목록으로
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        발주 상세 정보
      </Typography>

      <TableContainer component={Paper} sx={{ my: 3 }}>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>발주번호</TableCell>
              <TableCell>{order.orderNumber}</TableCell>
              <TableCell>입찰번호</TableCell>
              <TableCell>{order.bidNumber}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>발주명</TableCell>
              <TableCell>{order.title}</TableCell>
              <TableCell>공급자</TableCell>
              <TableCell>{order.supplierName}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>발주일자</TableCell>
              <TableCell>{formatDateTime(order.createdAt)}</TableCell>
              <TableCell>납품예정일</TableCell>
              <TableCell>{formatDate(order.expectedDeliveryDate)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>총액</TableCell>
              <TableCell colSpan={3}>
                <Typography variant="h6" sx={{ color: "primary.main" }}>
                  {formatNumber(order.totalAmount)}원
                </Typography>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>발주 상태</TableCell>
              <TableCell colSpan={3}>
                <Chip label="발주완료" color="success" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>작성자</TableCell>
              <TableCell>{order.createdBy}</TableCell>
              <TableCell>최종 수정일</TableCell>
              <TableCell>{formatDateTime(order.updatedAt)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Button variant="outlined" onClick={() => navigate("/orders")}>
        목록으로 돌아가기
      </Button>
    </Box>
  );
};

export default BiddingOrderDetailPage;
