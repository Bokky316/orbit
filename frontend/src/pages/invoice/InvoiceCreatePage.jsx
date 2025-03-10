import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Paper, Box, Typography } from '@mui/material';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_URL } from '@/utils/constants';

function InvoiceCreatePage() {
    const navigate = useNavigate();
    const [invoiceData, setInvoiceData] = useState({ invoiceNumber: '', totalAmount: '', issueDate: '', dueDate: '' });

    const handleChange = (e) => {
        setInvoiceData({ ...invoiceData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetchWithAuth(`${API_URL}invoices/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoiceData),
            });
            if (!response.ok) throw new Error('송장 생성 실패');
            alert('송장이 생성되었습니다.');
            navigate('/invoices');
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <Box>
            <Typography variant="h4">송장 발행</Typography>
            <Paper sx={{ padding: 2 }}>
                <form onSubmit={handleSubmit}>
                    <TextField fullWidth label="송장 번호" name="invoiceNumber" onChange={handleChange} required />
                    <TextField fullWidth label="총 금액" name="totalAmount" type="number" onChange={handleChange} required />
                    <TextField fullWidth label="발행일" name="issueDate" type="date" onChange={handleChange} required />
                    <TextField fullWidth label="마감일" name="dueDate" type="date" onChange={handleChange} required />
                    <Button type="submit" variant="contained">송장 발행</Button>
                </form>
            </Paper>
        </Box>
    );
}
export default InvoiceCreatePage;
