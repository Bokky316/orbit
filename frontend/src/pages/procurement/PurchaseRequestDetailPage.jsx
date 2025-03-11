import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, Link, Chip,
    Grid, List, ListItem, ListItemText, Divider
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_URL } from '@/utils/constants';
import moment from 'moment';
import { useDispatch } from 'react-redux';

const PurchaseRequestDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetchWithAuth(`${API_URL}purchase-requests/${id}`);
                if (!response.ok) throw new Error('데이터 로드 실패');
                const data = await response.json();
                setRequest(data);
            } catch (error) {
                console.error('Error:', error);
            }
        };
        fetchData();
    }, [id]);

    if (!request) return <Typography>Loading...</Typography>;

    const statusColor = {
        'REQUESTED': 'info',
        'APPROVED': 'success',
        'REJECTED': 'error',
        'COMPLETED': 'warning'
    }[request.prStatusChild] || 'default';

    const downloadFile = async (attachment) => {
      try {
        console.log("[DEBUG] 첨부파일 객체 전체:", attachment); // 추가

        // ID 유효성 검사 강화
        if (!attachment?.id || typeof attachment.id !== "number") {
          alert("유효하지 않은 첨부파일 ID입니다.");
          return;
        }

        const response = await fetchWithAuth(
          `${API_URL}purchase-requests/attachments/${attachment.id}/download`,
          { method: 'GET', responseType: 'blob' }
        );

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = attachment.fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } else {
                console.error('다운로드 실패:', await response.text());
            }
        } catch (error) {
            console.error('다운로드 오류:', error);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Typography variant="h4">{request.requestName}</Typography>
                <Chip label={request.prStatusChild} color={statusColor} variant="outlined" />
            </Box>

            {/* 기본 정보 */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>기본 정보</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={4}>
                        <Typography><strong>요청번호:</strong> {request.id}</Typography>
                        <Typography><strong>사업구분:</strong> {request.businessType}</Typography>
                        <Typography><strong>요청일:</strong> {moment(request.requestDate).format('YYYY-MM-DD')}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                        <Typography><strong>고객사:</strong> {request.customer}</Typography>
                        <Typography><strong>사업부서:</strong> {request.businessDepartment}</Typography>
                        <Typography><strong>담당자:</strong> {request.businessManager}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                        <Typography><strong>예산:</strong> {request.businessBudget?.toLocaleString()}원</Typography>
                        <Typography><strong>연락처:</strong> {request.managerPhoneNumber}</Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* 사업 구분별 상세 정보 */}
            {request.businessType === 'SI' && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>SI 프로젝트 정보</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography><strong>시작일:</strong> {moment(request.projectStartDate).format('YYYY-MM-DD')}</Typography>
                            <Typography><strong>종료일:</strong> {moment(request.projectEndDate).format('YYYY-MM-DD')}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography><strong>프로젝트 내용:</strong></Typography>
                            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{request.projectContent}</Typography>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {request.businessType === 'MAINTENANCE' && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>유지보수 정보</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography><strong>계약기간:</strong> {moment(request.contractStartDate).format('YYYY-MM-DD')} ~ {moment(request.contractEndDate).format('YYYY-MM-DD')}</Typography>
                            <Typography><strong>계약금액:</strong> {request.contractAmount?.toLocaleString()}원</Typography>
                            <Typography><strong>시작일:</strong> {moment(request.contractStartDate).format('YYYY-MM-DD')}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography><strong>계약내용:</strong></Typography>
                            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{request.contractDetails}</Typography>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {request.businessType === 'GOODS' && request.items?.length > 0 && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>구매 품목</Typography>
                    <List>
                        {request.items.map((item, index) => (
                            <div key={index}>
                                <ListItem>
                                    <ListItemText
                                        primary={`${item.itemName} (${item.specification})`}
                                        secondary={`수량: ${item.quantity} ${item.unit} | 단가: ${item.unitPrice?.toLocaleString()}원`}
                                    />
                                </ListItem>
                                {index < request.items.length - 1 && <Divider />}
                            </div>
                        ))}
                    </List>
                </Paper>
            )}

            {/* 첨부 파일 */}
            {request.attachments?.length > 0 && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>첨부 파일</Typography>
                    <List>
                        {request.attachments.map((attachment, index) => (
                           <ListItem key={attachment.id}>
                             <Link
                               component="button"
                               onClick={() => downloadFile(attachment)}
                               sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                             >
                               📎 {attachment.fileName}
                               <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                 ({Math.round(attachment.fileSize / 1024)}KB)
                               </Typography>
                             </Link>
                           </ListItem>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
};

export default PurchaseRequestDetailPage;
