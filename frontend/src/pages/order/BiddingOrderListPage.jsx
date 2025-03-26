// BiddingOrderListPage.jsx
import React, { useEffect, useState } from "react";
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
  CircularProgress,
  Chip,
  Pagination
} from "@mui/material";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_URL } from "@/utils/constants";
import { formatNumber } from "../bidding/helpers/commonBiddingHelpers";
import moment from "moment";

const BiddingOrderListPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetchWithAuth(`${API_URL}bidding-orders`);
        if (!res.ok) throw new Error("발주 목록 로드 실패");
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handlePageChange = (event, value) => setPage(value);
  const handleViewDetail = (id) => navigate(`/orders/${id}`);
  const formatDate = (dateStr) => moment(dateStr).format("YYYY-MM-DD");
  const paginated = orders.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        발주 관리
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Paper>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>발주번호</TableCell>
                  <TableCell>입찰번호</TableCell>
                  <TableCell>발주명</TableCell>
                  <TableCell>공급업체</TableCell>
                  <TableCell>발주일자</TableCell>
                  <TableCell>납품예정일</TableCell>
                  <TableCell>총액</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((order) => (
                  <TableRow
                    key={order.id}
                    hover
                    onClick={() => handleViewDetail(order.id)}
                    sx={{ cursor: "pointer" }}>
                    <TableCell>{order.orderNumber}</TableCell>
                    <TableCell>{order.bidNumber}</TableCell>
                    <TableCell>{order.title}</TableCell>
                    <TableCell>{order.supplierName}</TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>
                      {formatDate(order.expectedDeliveryDate)}
                    </TableCell>
                    <TableCell>{formatNumber(order.totalAmount)}원</TableCell>
                  </TableRow>
                ))}
                {paginated.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      발주 데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <Pagination
              count={Math.ceil(orders.length / pageSize)}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default BiddingOrderListPage;
