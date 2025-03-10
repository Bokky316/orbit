import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TextField, Button, Paper, Box, Typography } from '@mui/material';

function InvoiceEditPage() {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const [invoiceData, setInvoiceData] = useState({ invoiceNumber: 'INV001', totalAmount: 500000, issueDate: '2024-03-01', dueDate: '2024-03-15' });

    const handleChange = (e) => {
        setInvoiceData({ ...invoiceData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        alert('송장 정보가 수정되었습니다.');
        navigate(`/invoices/${invoiceId}`);
    };

    return (
        <Box>
            <Typography variant="h4">송장 수정</Typography>
            <Paper sx={{ padding: 2 }}>
                <form onSubmit={handleSubmit}>
                    <TextField fullWidth label="총 금액" name="totalAmount" type="number" value={invoiceData.totalAmount} onChange={handleChange} required />
                    <Button type="submit" variant="contained">저장</Button>
                </form>
            </Paper>
        </Box>
    );
}
export default InvoiceEditPage;
