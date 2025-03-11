import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_URL } from '@/utils/constants';
import moment from 'moment';
import {
    AttachFile as AttachFileIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import ApprovalLineComponent from '@/pages/approval/ApprovalLineComponent';
import ApprovalLineSetupComponent from '@/pages/approval/ApprovalLineSetupComponent';
import { styled } from '@mui/material/styles';
import { deletePurchaseRequest } from '@/redux/purchaseRequestSlice';
import useWebSocket from '@hooks/useWebSocket';

/**
 * 구매 요청 상세 페이지 컴포넌트
 * @returns {JSX.Element}
 */
function PurchaseRequestDetailPage() {
    const { id } = useParams(); // URL에서 구매 요청 ID를 가져옴
    const [request, setRequest] = useState(null); // 구매 요청 정보 상태

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetchWithAuth(`${API_URL}purchase-requests/${id}`);
                if (!response.ok) throw new Error('데이터 로드 실패');
                const data = await response.json();
                setRequest(data);

                // 2. 프로젝트 ID가 있으면 프로젝트 정보 가져오기
                if (data.projectId) {
                    const projectResponse = await fetchWithAuth(`${API_URL}projects/${data.projectId}`);
                    if (projectResponse.ok) {
                        const projectData = await projectResponse.json();
                        setProject(projectData);
                    } else {
                        console.warn('프로젝트 정보를 가져오는데 실패했습니다.');
                    }
                }

                // 3. 결재선 정보 가져오기
                try {
                    const approvalResponse = await fetchWithAuth(`${API_URL}approvals/${id}`);
                    if (approvalResponse.ok) {
                        const approvalData = await approvalResponse.json();
                        setApprovalLines(approvalData);

                        // 현재 사용자가 결재 권한이 있는지 확인
                        if (currentUser) {
                            const hasAuthority = approvalData.some(line =>
                                line.statusCode === 'IN_REVIEW' &&
                                line.approverId === currentUser.id
                            );
                            setHasApprovalAuthority(hasAuthority);
                        }
                    }
                } catch (approvalError) {
                    console.warn('결재선 정보를 가져오는데 실패했습니다:', approvalError);
                    // 결재선 정보가 없어도 페이지는 계속 로드
                }

                setError(null);
            } catch (error) {
                console.error('Error:', error);
            }
            const purchaseRequestData = await purchaseRequestResponse.json();
            setRequest(purchaseRequestData); // 구매 요청 정보 설정
        } catch (error) {
            console.error('다운로드 오류:', error);
        }
    };

    // 결재선 설정 가능 여부 확인
    const canSetupApprovalLine = () => {
        if (approvalLines.length === 0) {
            return true;
        }

        // 이미 승인 또는 반려된 결재선이 있으면 설정 불가
        return !approvalLines.some(line =>
            line.statusCode === 'APPROVED' || line.statusCode === 'REJECTED'
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* 상단 헤더 및 상태 표시 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h4">{request.requestName}</Typography>
                    <StatusChip
                        label={request.prStatusChild || '요청됨'}
                        statuscode={request.prStatusChild}
                        variant="outlined"
                    />
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={() => navigate(`/purchase-requests/edit/${id}`)}
                    >
                        수정
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => {
                            if (window.confirm('정말 삭제하시겠습니까?')) {
                                // 삭제 로직
                            }
                        }}
                    >
                        삭제
                    </Button>
                    {canSetupApprovalLine() && !showApprovalSetup && (
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<AddIcon />}
                            onClick={() => setShowApprovalSetup(true)}
                        >
                            결재선 설정
                        </Button>
                    )}
                </Box>
            </Box>

            {/* 결재선 설정 또는 결재선 표시 */}
            {showApprovalSetup ? (
                <ApprovalLineSetupComponent
                    purchaseRequestId={Number(id)}
                    onSetupComplete={handleApprovalSetupComplete}
                />
            ) : (
                approvalLines.length > 0 && (
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <ApprovalLineComponent
                            purchaseRequestId={Number(id)}
                            currentUserId={currentUser?.id}
                            onApprovalComplete={handleApprovalComplete}
                        />
                    </Paper>
                )
            )}

            {/* 관련 프로젝트 정보 */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>구매 요청 정보</Typography>
                {/* 변경된 API 응답 구조에 맞게 데이터 표시 */}
                <Typography>요청번호: {request.id}</Typography>
                <Typography>요청명: {request.requestName}</Typography>
                <Typography>상태: {request.status}</Typography>
                <Typography>요청일: {request.requestDate}</Typography>
                <Typography>고객사: {request.customer}</Typography>
                <Typography>사업부서: {request.businessDepartment}</Typography>
                <Typography>사업담당자: {request.businessManager}</Typography>
                <Typography>사업구분: {request.businessType}</Typography>
                <Typography>사업예산: {request.businessBudget?.toLocaleString()}원</Typography>
                <Typography>특이사항: {request.specialNotes}</Typography>
                <Typography>담당자 핸드폰: {request.managerPhoneNumber}</Typography>
                <Typography>사업시작일: {request.projectStartDate}</Typography>
                <Typography>사업종료일: {request.projectEndDate}</Typography>
                <Typography>사업내용: {request.projectContent}</Typography>
                <Typography>첨부파일: {request.attachments}</Typography>
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
                    {Array.isArray(request.items) && request.items.length > 0 ? (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>No</TableCell>
                                        <TableCell>품목명</TableCell>
                                        <TableCell>사양</TableCell>
                                        <TableCell>단위</TableCell>
                                        <TableCell align="right">수량</TableCell>
                                        <TableCell align="right">단가</TableCell>
                                        <TableCell align="right">금액</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {request.items.map((item, index) => (
                                        <TableRow key={item.id || index}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{item.itemName}</TableCell>
                                            <TableCell>{item.specification || '-'}</TableCell>
                                            <TableCell>{item.unitChildCode || '-'}</TableCell>
                                            <TableCell align="right">{item.quantity}</TableCell>
                                            <TableCell align="right">
                                                ₩{Number(item.unitPrice).toLocaleString()}
                                            </TableCell>
                                            <TableCell align="right">
                                                ₩{Number(item.totalPrice).toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow>
                                        <TableCell colSpan={6} align="right" sx={{ fontWeight: 'bold' }}>합계</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                            ₩{request.items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            구매 품목 정보가 없습니다.
                        </Typography>
                    )}
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

            {/* 하단 버튼 그룹 */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                    variant="outlined"
                    onClick={() => navigate('/purchase-requests')}
                >
                    목록으로
                </Button>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {/* 필요한 액션 버튼들 */}
                </Box>
            </Box>
        </Box>
    );
};

export default PurchaseRequestDetailPage;