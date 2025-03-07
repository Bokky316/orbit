// import React, { useState, useEffect } from 'react';
// import { useDispatch } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
// import { createPurchaseRequest } from '@/redux/purchaseRequestSlice';
// import {
//     Box,
//     Typography,
//     Paper,
//     TextField,
//     Button,
//     FormControl,
//     InputLabel,
//     Select,
//     MenuItem,
//     Grid,
// } from '@mui/material';
// import { DatePicker } from '@mui/x-date-pickers';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { API_URL } from '@/utils/constants';
// import { fetchWithAuth } from '@/utils/fetchWithAuth';
//
// function PurchaseRequestCreatePage() {
//     const dispatch = useDispatch();
//     const navigate = useNavigate();
//
//     // 상태 변수 정의 (이미지, OCR 정보 기반)
//     const [projectName, setProjectName] = useState('');
//     const [requestDate, setRequestDate] = useState(null);
//     const [requester, setRequester] = useState('');
//     const [customer, setCustomer] = useState('');
//     const [department, setDepartment] = useState('');
//     const [projectManager, setProjectManager] = useState('');
//     const [managerPhone, setManagerPhone] = useState('');
//     const [budget, setBudget] = useState('');
//     const [specialNotes, setSpecialNotes] = useState('');
//     const [contractPeriod, setContractPeriod] = useState('');
//     const [contractAmount, setContractAmount] = useState('');
//     const [contractDetails, setContractDetails] = useState('');
//
//     // 폼 제출 핸들러
//     const handleSubmit = (event) => {
//         event.preventDefault();
//
//         // 폼 데이터 객체 생성 (이미지, OCR 정보 기반)
//         const formData = {
//             projectName,
//             requestDate,
//             requester,
//             customer,
//             department,
//             projectManager,
//             managerPhone,
//             budget,
//             specialNotes,
//             contractPeriod,
//             contractAmount,
//             contractDetails,
//         };
//
//         // Redux 액션 디스패치
//         dispatch(createPurchaseRequest(formData));
//
//         // 구매 요청 목록 페이지로 이동
//         navigate('/purchase-requests');
//     };
//
//     // 폼 필드 변경 핸들러
//     const handleChange = (event) => {
//         const { name, value } = event.target;
//         switch (name) {
//             case 'projectName':
//                 setProjectName(value);
//                 break;
//             case 'requester':
//                 setRequester(value);
//                 break;
//             case 'customer':
//                 setCustomer(value);
//                 break;
//             case 'department':
//                 setDepartment(value);
//                 break;
//             case 'projectManager':
//                 setProjectManager(value);
//                 break;
//             case 'managerPhone':
//                 setManagerPhone(value);
//                 break;
//             case 'budget':
//                 setBudget(value);
//                 break;
//             case 'specialNotes':
//                 setSpecialNotes(value);
//                 break;
//             case 'contractPeriod':
//                 setContractPeriod(value);
//                 break;
//             case 'contractAmount':
//                 setContractAmount(value);
//             case 'contractDetails':
//                 setContractDetails(value);
//                 break;
//             default:
//                 break;
//         }
//     };
//
//     return (
//         <Box>
//             <Typography variant="h4" component="h1" gutterBottom>
//                 구매 요청 생성
//             </Typography>
//             <Paper elevation={2} sx={{ padding: 3 }}>
//                 <form onSubmit={handleSubmit}>
//                     <Grid container spacing={3}>
//                         {/* 이미지, OCR 정보 기반 폼 필드 */}
//                         <Grid item xs={6}>
//                             <TextField
//                                 fullWidth
//                                 label="사업명"
//                                 name="projectName"
//                                 value={projectName}
//                                 onChange={handleChange}
//                             />
//                         </Grid>
//                         <Grid item xs={6}>
//                             <LocalizationProvider dateAdapter={AdapterDateFns}>
//                                 <DatePicker
//                                     label="요청일"
//                                     value={requestDate}
//                                     onChange={(date) => setRequestDate(date)}
//                                     renderInput={(params) => <TextField {...params} fullWidth />}
//                                 />
//                             </LocalizationProvider>
//                         </Grid>
//                         <Grid item xs={6}>
//                             <TextField
//                                 fullWidth
//                                 label="등록자"
//                                 name="requester"
//                                 value={requester}
//                                 onChange={handleChange}
//                             />
//                         </Grid>
//                         <Grid item xs={6}>
//                             <TextField
//                                 fullWidth
//                                 label="고객사"
//                                 name="customer"
//                                 value={customer}
//                                 onChange={handleChange}
//                             />
//                         </Grid>
//                         <Grid item xs={6}>
//                             <TextField
//                                 fullWidth
//                                 label="사업부서"
//                                 name="department"
//                                 value={department}
//                                 onChange={handleChange}
//                             />
//                         </Grid>
//                         <Grid item xs={6}>
//                             <TextField
//                                 fullWidth
//                                 label="사업담당자"
//                                 name="projectManager"
//                                 value={projectManager}
//                                 onChange={handleChange}
//                             />
//                         </Grid>
//                         <Grid item xs={6}>
//                             <TextField
//                                 fullWidth
//                                 label="담당자 핸드폰"
//                                 name="managerPhone"
//                                 value={managerPhone}
//                                 onChange={handleChange}
//                             />
//                         </Grid>
//                         <Grid item xs={6}>
//                             <TextField
//                                 fullWidth
//                                 label="사업예산"
//                                 name="budget"
//                                 value={budget}
//                                 onChange={handleChange}
//                             />
//                         </Grid>
//                         <Grid item xs={12}>
//                             <TextField
//                                 fullWidth
//                                 label="특기사항"
//                                 name="specialNotes"
//                                 multiline
//                                 rows={4}
//                                 value={specialNotes}
//                                 onChange={handleChange}
//                             />
//                         </Grid>
//                         <Grid item xs={6}>
//                             <TextField
//                                 fullWidth
//                                 label="계약기간"
//                                 name="contractPeriod"
//                                 value={contractPeriod}
//                                 onChange={handleChange}
//                             />
//                         </Grid>
//                         <Grid item xs={6}>
//                             <TextField
//                                 fullWidth
//                                 label="계약금액"
//                                 name="contractAmount"
//                                 value={contractAmount}
//                                 onChange={handleChange}
//                             />
//                         </Grid>
//                         <Grid item xs={12}>
//                             <TextField
//                                 fullWidth
//                                 label="계약내용"
//                                 name="contractDetails"
//                                 multiline
//                                 rows={4}
//                                 value={contractDetails}
//                                 onChange={handleChange}
//                             />
//                         </Grid>
//                         <Grid item xs={12}>
//                             <Button
//                                 variant="contained"
//                                 color="primary"
//                                 type="submit"
//                             >
//                                 저장
//                             </Button>
//                         </Grid>
//                     </Grid>
//                 </form>
//             </Paper>
//         </Box>
//     );
// }
//
// export default PurchaseRequestCreatePage;
