import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Typography, Box, TextField, MenuItem } from '@mui/material';

const mockInvoices = [
    { id: 1, invoiceNumber: 'INV001', contractId: 'C001', supplier: '공급업체 A', totalAmount: 500000, issueDate: '2024-03-01', dueDate: '2024-03-15', status: 'PENDING' },
    { id: 2, invoiceNumber: 'INV002', contractId: 'C002', supplier: '공급업체 B', totalAmount: 750000, issueDate: '2024-03-02', dueDate: '2024-03-16', status: 'PAID' }
];

function InvoiceListPage() {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState(mockInvoices);
    const [filter, setFilter] = useState({ search: '', status: '' });

    const filteredInvoices = invoices.filter(invoice =>
        invoice.invoiceNumber.includes(filter.search) &&
        (filter.status ? invoice.status === filter.status : true)
    );

    return (
        <Box>
            <Typography variant="h4">송장 목록</Typography>
            <TextField
                label="송장 검색"
                variant="outlined"
                fullWidth
                onChange={e => setFilter({ ...filter, search: e.target.value })}
            />
            <TextField
                select
                label="상태 필터"
                value={filter.status}
                onChange={e => setFilter({ ...filter, status: e.target.value })}
                fullWidth
            >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="PENDING">PENDING</MenuItem>
                <MenuItem value="PAID">PAID</MenuItem>
                <MenuItem value="OVERDUE">OVERDUE</MenuItem>
            </TextField>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>송장 번호</TableCell>
                            <TableCell>계약 번호</TableCell>
                            <TableCell>공급업체</TableCell>
                            <TableCell>총 금액</TableCell>
                            <TableCell>발행일</TableCell>
                            <TableCell>마감일</TableCell>
                            <TableCell>상태</TableCell>
                            <TableCell>액션</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredInvoices.map(invoice => (
                            <TableRow key={invoice.id}>
                                <TableCell>{invoice.invoiceNumber}</TableCell>
                                <TableCell>{invoice.contractId}</TableCell>
                                <TableCell>{invoice.supplier}</TableCell>
                                <TableCell>{invoice.totalAmount.toLocaleString()}원</TableCell>
                                <TableCell>{invoice.issueDate}</TableCell>
                                <TableCell>{invoice.dueDate}</TableCell>
                                <TableCell>{invoice.status}</TableCell>
                                <TableCell>
                                    <Button onClick={() => navigate(`/invoices/${invoice.id}`)}>상세보기</Button>
                                    <Button onClick={() => navigate(`/invoices/${invoice.id}/edit`)}>수정</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
export default InvoiceListPage;