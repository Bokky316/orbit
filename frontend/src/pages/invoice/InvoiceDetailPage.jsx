import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Paper, Typography, Button, Box } from '@mui/material';

function InvoiceDetailPage() {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const invoice = { id: invoiceId, invoiceNumber: 'INV001', totalAmount: 500000, issueDate: '2024-03-01', dueDate: '2024-03-15', status: 'PENDING' };

    return (
        <Box>
            <Typography variant="h4">송장 상세</Typography>
            <Paper sx={{ padding: 2 }}>
                <Typography>송장 번호: {invoice.invoiceNumber}</Typography>
                <Typography>총 금액: {invoice.totalAmount.toLocaleString()}원</Typography>
                <Typography>발행일: {invoice.issueDate}</Typography>
                <Typography>마감일: {invoice.dueDate}</Typography>
                <Typography>상태: {invoice.status}</Typography>
                <Button onClick={() => navigate(-1)}>뒤로가기</Button>
                <Button onClick={() => navigate(`/invoices/${invoice.id}/edit`)}>수정</Button>
            </Paper>
        </Box>
    );
}
export default InvoiceDetailPage;