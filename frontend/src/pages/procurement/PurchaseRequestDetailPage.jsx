import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, Link, Chip,
    Grid, List, ListItem, ListItemText, Divider, Alert
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_URL } from '@/utils/constants';
import moment from 'moment';

const PurchaseRequestDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await fetchWithAuth(`${API_URL}purchase-requests/${id}`);
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`데이터 로드 실패: ${errorText}`);
                }

                const data = await response.json();
                console.log('API 응답 데이터:', data);
                console.log('비즈니스 타입:', data.businessType);
                console.log('items 존재 여부:', data.hasOwnProperty('items'));
                console.log('items 내용:', data.items);

                // 만약 GOODS 타입인데 items가 없으면 빈 배열로 초기화
                if (data.businessType === 'GOODS' && !Array.isArray(data.items)) {
                    console.log('GOODS 타입인데 items가 배열이 아니므로 초기화합니다');
                    data.items = [];
                }

                setRequest(data);
                setError(null);
            } catch (error) {
                console.error('Error:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    // 로딩 상태 처리
    if (loading) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>데이터를 불러오는 중입니다...</Typography>
            </Box>
        );
    }

    // 에러 상태 처리
    if (error) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="error">오류 발생: {error}</Typography>
                <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/purchase-requests')}
                >
                    목록으로 돌아가기
                </Button>
            </Box>
        );
    }

    // 데이터가 없는 경우
    if (!request) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>구매 요청 정보가 없습니다.</Typography>
                <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/purchase-requests')}
                >
                    목록으로 돌아가기
                </Button>
            </Box>
        );
    }

    // 상태 표시 색상 설정
    const statusColor = {
        'REQUESTED': 'info',
        'APPROVED': 'success',
        'REJECTED': 'error',
        'COMPLETED': 'warning'
    }[request.prStatusChild] || 'default';

    // 첨부파일 다운로드 함수
    const downloadFile = async (attachment) => {
        try {
            console.log("[DEBUG] 첨부파일 객체:", attachment);

            if (!attachment?.id) {
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
                alert('파일 다운로드에 실패했습니다.');
            }
        } catch (error) {
            console.error('다운로드 오류:', error);
            alert(`다운로드 중 오류 발생: ${error.message}`);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* 상단 헤더 및 상태 표시 */}
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
                        <Typography><strong>요청일:</strong> {request.requestDate ? moment(request.requestDate).format('YYYY-MM-DD') : '정보 없음'}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                        <Typography><strong>고객사:</strong> {request.customer || '정보 없음'}</Typography>
                        <Typography><strong>사업부서:</strong> {request.businessDepartment || '정보 없음'}</Typography>
                        <Typography><strong>담당자:</strong> {request.businessManager || '정보 없음'}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                        <Typography><strong>예산:</strong> {request.businessBudget ? `${request.businessBudget.toLocaleString()}원` : '정보 없음'}</Typography>
                        <Typography><strong>연락처:</strong> {request.managerPhoneNumber || '정보 없음'}</Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* 사업 구분별 상세 정보 */}
            {request.businessType === 'SI' && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>SI 프로젝트 정보</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography>
                                <strong>시작일:</strong> {request.projectStartDate ? moment(request.projectStartDate).format('YYYY-MM-DD') : '정보 없음'}
                            </Typography>
                            <Typography>
                                <strong>종료일:</strong> {request.projectEndDate ? moment(request.projectEndDate).format('YYYY-MM-DD') : '정보 없음'}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography><strong>프로젝트 내용:</strong></Typography>
                            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{request.projectContent || '내용 없음'}</Typography>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {request.businessType === 'MAINTENANCE' && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>유지보수 정보</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography>
                                <strong>계약기간:</strong> {
                                    request.contractStartDate && request.contractEndDate ?
                                    `${moment(request.contractStartDate).format('YYYY-MM-DD')} ~ ${moment(request.contractEndDate).format('YYYY-MM-DD')}` :
                                    '정보 없음'
                                }
                            </Typography>
                            <Typography>
                                <strong>계약금액:</strong> {request.contractAmount ? `${request.contractAmount.toLocaleString()}원` : '정보 없음'}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography><strong>계약내용:</strong></Typography>
                            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{request.contractDetails || '내용 없음'}</Typography>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {/* 물품 구매 정보 (GOODS 타입일 때만 표시) */}
            {request.businessType === 'GOODS' && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>구매 품목</Typography>
                    {Array.isArray(request.items) && request.items.length > 0 ? (
                        <List>
                            {request.items.map((item, index) => (
                                <div key={index}>
                                    <ListItem>
                                        <ListItemText
                                            primary={`${item.itemName || '품목명 없음'} ${item.specification ? `(${item.specification})` : ''}`}
                                            secondary={
                                                <>
                                                    <Typography component="span" variant="body2">
                                                        수량: {item.quantity || 0} {item.unitChildCode || '개'} |
                                                        단가: {item.unitPrice ? `${item.unitPrice.toLocaleString()}원` : '0원'} |
                                                        총액: {item.totalPrice ? `${item.totalPrice.toLocaleString()}원` : '0원'}
                                                    </Typography>
                                                    {item.deliveryRequestDate &&
                                                        <Typography component="span" variant="body2" sx={{ display: 'block' }}>
                                                            배송 요청일: {moment(item.deliveryRequestDate).format('YYYY-MM-DD')}
                                                            {item.deliveryLocation ? ` | 배송 장소: ${item.deliveryLocation}` : ''}
                                                        </Typography>
                                                    }
                                                </>
                                            }
                                        />
                                    </ListItem>
                                    {index < request.items.length - 1 && <Divider />}
                                </div>
                            ))}
                        </List>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            구매 품목 정보가 없습니다.
                        </Typography>
                    )}
                </Paper>
            )}

            {/* 첨부 파일 */}
            {request.attachments && request.attachments.length > 0 ? (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>첨부 파일</Typography>
                    <List>
                        {request.attachments.map((attachment) => (
                           <ListItem key={attachment.id}>
                             <Link
                               component="button"
                               onClick={() => downloadFile(attachment)}
                               sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                             >
                               📎 {attachment.fileName || '파일명 없음'}
                               <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                 ({Math.round((attachment.fileSize || 0) / 1024)}KB)
                               </Typography>
                             </Link>
                           </ListItem>
                        ))}
                    </List>
                </Paper>
            ) : (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>첨부 파일</Typography>
                    <Typography variant="body2" color="text.secondary">첨부된 파일이 없습니다.</Typography>
                </Paper>
            )}

            {/* 하단 버튼 그룹 */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                    variant="outlined"
                    onClick={() => navigate('/purchase-requests')}
                >
                    목록으로
                </Button>
                <Box>
                    {/* 여기에 필요한 액션 버튼들을 추가할 수 있습니다 (예: 수정, 삭제 등) */}
                </Box>
            </Box>
        </Box>
    );
};

export default PurchaseRequestDetailPage;