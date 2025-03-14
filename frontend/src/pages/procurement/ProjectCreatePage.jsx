import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    IconButton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Delete as DeleteIcon, AttachFile as AttachFileIcon } from '@mui/icons-material';
import moment from 'moment';
import { API_URL } from '@/utils/constants';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

/**
 * 프로젝트 생성 페이지 컴포넌트
 */
function ProjectCreatePage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // 상태 관리
    const [projectName, setProjectName] = useState('');
    const [businessCategory, setBusinessCategory] = useState('');
    const [totalBudget, setTotalBudget] = useState('');
    const [budgetCode, setBudgetCode] = useState('');
    const [remarks, setRemarks] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [basicStatus, setBasicStatus] = useState('PROJECT-STATUS-REQUESTED'); // 유효한 기본값 설정
    const [procurementStatus, setProcurementStatus] = useState('PROJECT-PROCUREMENT-REQUEST_RECEIVED'); // 유효한 기본값 설정
    const [requestDepartment, setRequestDepartment] = useState('');

    // 첨부 파일 상태
    const [attachments, setAttachments] = useState([]);

    /**
     * 폼 제출 핸들러
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 요청 데이터 구성 (첨부파일 제외)
        const requestData = {
            projectName,
            businessCategory,
            totalBudget: parseFloat(totalBudget) || 0,
            budgetCode,
            remarks,
            projectPeriod: {
                startDate: startDate ? startDate.format('YYYY-MM-DD') : null,
                endDate: endDate ? endDate.format('YYYY-MM-DD') : null,
            },
            basicStatus,
            procurementStatus,
            requestDepartment,
        };

        try {
            // 1. 먼저 JSON으로 프로젝트 생성
            const response = await fetchWithAuth(`${API_URL}projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (response.ok) {
                const createdProject = await response.json();

                // 2. 파일 첨부가 있는 경우, 별도 요청으로 처리
                if (attachments.length > 0) {
                    const fileFormData = new FormData();

                    attachments.forEach(file => {
                        fileFormData.append('files', file);
                    });

                    try {
                        // 구매요청과 동일하게 fetch 직접 호출 방식으로 변경
                        const fileResponse = await fetch(`${API_URL}projects/${createdProject.id}/attachments`, {
                            method: 'POST',
                            credentials: 'include', // 쿠키 포함
                            body: fileFormData
                        });

                        if (fileResponse.ok) {
                            console.log('첨부 파일이 성공적으로 업로드되었습니다.');
                            alert('첨부 파일이 성공적으로 업로드되었습니다.');
                        } else {
                            const errorMsg = await fileResponse.text();
                            console.error(`첨부 파일 업로드에 실패했습니다: ${errorMsg}`);
                            alert(`첨부 파일 업로드에 실패했습니다: ${errorMsg}`);
                        }
                    } catch (fileError) {
                        console.error(`첨부 파일 업로드 중 오류 발생: ${fileError.message}`);
                        alert(`첨부 파일 업로드 중 오류 발생: ${fileError.message}`);
                    }
                }

                alert('프로젝트가 성공적으로 생성되었습니다.');
                navigate('/projects');
            } else {
                const errorData = await response.text();
                alert(`오류 발생: ${errorData}`);
            }
        } catch (error) {
            alert(`오류 발생: ${error.message}`);
        }
    };

    /**
     * JSON 형식으로 제출 (파일 없을 때)
     */
    const handleSubmitJson = async () => {
        // 요청 데이터 구성
        const requestData = {
            projectName,
            businessCategory,
            totalBudget: parseFloat(totalBudget) || 0,
            budgetCode,
            remarks,
            projectPeriod: {
                startDate: startDate ? startDate.format('YYYY-MM-DD') : null,
                endDate: endDate ? endDate.format('YYYY-MM-DD') : null,
            },
            basicStatus,
            procurementStatus,
            requestDepartment,
        };

        try {
            // API 요청
            const response = await fetchWithAuth(`${API_URL}projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (response.ok) {
                alert('프로젝트가 성공적으로 생성되었습니다.');
                navigate('/projects'); // 프로젝트 목록 페이지로 이동
            } else {
                const errorData = await response.text();
                alert(`오류 발생: ${errorData}`);
            }
        } catch (error) {
            alert(`오류 발생: ${error.message}`);
        }
    };

    /**
     * Multipart/form-data로 제출 (파일 있을 때) - 구매요청과 동일한 방식으로 수정
     */
    const handleSubmitWithFiles = async () => {
        try {
            // FormData 생성
            const formData = new FormData();

            // 각 필드를 개별적으로 추가 (JSON 문자열 대신)
            formData.append('projectName', projectName);
            formData.append('businessCategory', businessCategory);
            formData.append('totalBudget', parseFloat(totalBudget) || 0);
            formData.append('budgetCode', budgetCode);
            formData.append('remarks', remarks);

            // 날짜 필드
            if (startDate)
                formData.append('projectPeriod.startDate', startDate.format('YYYY-MM-DD'));
            if (endDate)
                formData.append('projectPeriod.endDate', endDate.format('YYYY-MM-DD'));

            // 상태 필드
            formData.append('basicStatus', basicStatus);
            formData.append('procurementStatus', procurementStatus);
            formData.append('requestDepartment', requestDepartment);

            // 첨부 파일 추가
            for (let i = 0; i < attachments.length; i++) {
                formData.append('files', attachments[i]);
            }

            // API 요청
            const response = await fetchWithAuth(`${API_URL}projects`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                alert('프로젝트가 성공적으로 생성되었습니다.');
                navigate('/projects');
            } else {
                const errorData = await response.text();
                alert(`오류 발생: ${errorData}`);
            }
        } catch (error) {
            alert(`오류 발생: ${error.message}`);
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" component="h2">
                프로젝트 생성
            </Typography>
            <Paper sx={{ p: 2, mt: 1 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="프로젝트명"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                required
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="사업 유형"
                                value={businessCategory}
                                onChange={(e) => setBusinessCategory(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="요청 부서"
                                value={requestDepartment}
                                onChange={(e) => setRequestDepartment(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="총 예산"
                                value={totalBudget}
                                onChange={(e) => setTotalBudget(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="예산 코드"
                                value={budgetCode}
                                onChange={(e) => setBudgetCode(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="비고"
                                multiline
                                rows={4}
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel id="basic-status-label">기본 상태</InputLabel>
                                <Select
                                    labelId="basic-status-label"
                                    value={basicStatus}
                                    label="기본 상태"
                                    onChange={(e) => setBasicStatus(e.target.value)}
                                >
                                    <MenuItem value="PROJECT-STATUS-REQUESTED">프로젝트 요청</MenuItem>
                                    <MenuItem value="PROJECT-STATUS-RECEIVED">프로젝트 접수</MenuItem>
                                    <MenuItem value="PROJECT-STATUS-REJECTED">프로젝트 반려</MenuItem>
                                    <MenuItem value="PROJECT-STATUS-TERMINATED">프로젝트 중도 종결</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel id="procurement-status-label">조달 상태</InputLabel>
                                <Select
                                    labelId="procurement-status-label"
                                    value={procurementStatus}
                                    label="조달 상태"
                                    onChange={(e) => setProcurementStatus(e.target.value)}
                                >
                                    <MenuItem value="PROJECT-PROCUREMENT-REQUEST_RECEIVED">구매요청 접수</MenuItem>
                                    <MenuItem value="PROJECT-PROCUREMENT-VENDOR_SELECTION">업체 선정</MenuItem>
                                    <MenuItem value="PROJECT-PROCUREMENT-CONTRACT_PENDING">구매계약 대기</MenuItem>
                                    <MenuItem value="PROJECT-PROCUREMENT-INSPECTION">검수 진행</MenuItem>
                                    <MenuItem value="PROJECT-PROCUREMENT-INVOICE_ISSUED">인보이스 발행</MenuItem>
                                    <MenuItem value="PROJECT-PROCUREMENT-PAYMENT_COMPLETED">대급지급 완료</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <LocalizationProvider dateAdapter={AdapterMoment}>
                                <DatePicker
                                    label="시작일"
                                    value={startDate}
                                    onChange={(date) => setStartDate(date)}
                                    slotProps={{
                                      textField: {
                                        fullWidth: true,
                                        error: false } }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={6}>
                            <LocalizationProvider dateAdapter={AdapterMoment}>
                                <DatePicker
                                    label="종료일"
                                    value={endDate}
                                    onChange={(date) => setEndDate(date)}
                                    slotProps={{
                                      textField: {
                                        fullWidth: true,
                                        error: false } }}
                                />
                            </LocalizationProvider>
                        </Grid>

                        {/* 파일 첨부 영역 */}
                        <Grid item xs={12}>
                            <input
                                type="file"
                                multiple
                                onChange={(e) => setAttachments(Array.from(e.target.files))}
                                id="file-upload"
                                style={{ display: 'none' }}
                            />
                            <label htmlFor="file-upload">
                                <Button variant="outlined" component="span" startIcon={<AttachFileIcon />}>
                                    파일 첨부
                                </Button>
                            </label>
                            {attachments.length > 0 && (
                                <List>
                                    {attachments.map((file, index) => (
                                        <ListItem key={index}>
                                            <ListItemAvatar>
                                                <Avatar><AttachFileIcon /></Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={file.name}
                                                secondary={`${(file.size / 1024).toFixed(2)} KB`}
                                            />
                                            <IconButton
                                                edge="end"
                                                aria-label="delete"
                                                onClick={() => {
                                                    const newFiles = [...attachments];
                                                    newFiles.splice(index, 1);
                                                    setAttachments(newFiles);
                                                }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Grid>

                        <Grid item xs={12}>
                            <Button type="submit" variant="contained">
                                제출하기
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
}

export default ProjectCreatePage;