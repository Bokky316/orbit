import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField, Button,
    Grid, FormControl, InputLabel, Select, MenuItem, Link
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import moment from 'moment';
import { styled } from '@mui/material/styles';
import useWebSocket from '@hooks/useWebSocket';


// Redux 액션 및 선택자 임포트
import {
    fetchPurchaseRequests,
    setSearchTerm,
    setRequestDate,
    setStatus
} from '@/redux/purchaseRequestSlice'; // Correct import path
import { API_URL } from '@/utils/constants';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
    maxHeight: 440,
    '& .MuiTableHead-root': {
        position: 'sticky',
        top: 0,
        backgroundColor: theme.palette.background.paper,
        zIndex: 1,
    },
}));

function PurchaseRequestListPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
      useWebSocket(user);

    // Redux 상태에서 데이터 가져오기
    const { purchaseRequests, filters } = useSelector(state => state.purchaseRequest);

    useEffect(() => {
        // 컴포넌트 마운트 시 구매 요청 목록 가져오기
        dispatch(fetchPurchaseRequests());
    }, [dispatch]);

    // 필터링된 구매 요청 목록 계산
    const filteredRequests = purchaseRequests.filter(request => {
        const searchTermLower = filters.searchTerm.toLowerCase();
        const searchMatch = [
            request.requestName?.toLowerCase(),
            String(request.id),
            request.customer?.toLowerCase(),
            request.businessManager?.toLowerCase(),
        ].some(field => field?.includes(searchTermLower));

        const dateMatch = !filters.requestDate ||
            (request.requestDate && moment(request.requestDate).isSame(filters.requestDate, 'day'));

        const statusMatch = !filters.status || request.prStatusChild === filters.status;

        return searchMatch && dateMatch && statusMatch;
    });

    // 필터 변경 핸들러
    const handleFilterChange = (type, value) => {
        switch (type) {
            case 'searchTerm':
                dispatch(setSearchTerm(value));
                break;
            case 'requestDate':
                dispatch(setRequestDate(value));
                break;
            case 'status':
                dispatch(setStatus(value));
                break;
            default:
                break;
        }
    };

    const downloadFile = async (attachment) => {
        try {
            const response = await fetchWithAuth(`${API_URL}attachments/${attachment.id}/download`, {
                method: 'GET',
                responseType: 'blob', // Blob 형태로 받기
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = attachment.originalName; // 파일 이름 설정
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } else {
                console.error('파일 다운로드 실패:', response.status);
            }
        } catch (error) {
            console.error('파일 다운로드 중 오류 발생:', error);
        }
    };

export default PurchaseRequestListPage;
