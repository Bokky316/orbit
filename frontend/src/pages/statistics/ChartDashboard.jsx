import React, { useState, useEffect } from 'react';
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#a4de6c",
  "#d0ed57",
  "#ffc658",
];

// 탭 패널 컴포넌트
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// 탭 접근성 속성
function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const ChartDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  // API에서 가져올 데이터 상태
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [supplierData, setSupplierData] = useState([]);
  const [topItemsData, setTopItemsData] = useState([]);
  const [totalStats, setTotalStats] = useState({
    totalAmount: 0,
    monthlyAvg: 0,
    orderCount: 0,
    avgOrderAmount: 0
  });

  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 월별 데이터 가져오기
        const monthlyResponse = await fetchWithAuth(`${API_URL}statistics/orders/monthly/${year}`);
        if (!monthlyResponse.ok) {
          throw new Error(`HTTP error! status: ${monthlyResponse.status}`);
        }
        const monthlyDataResponse = await monthlyResponse.json();

        // 카테고리별 데이터 가져오기
        const categoryResponse = await fetchWithAuth(`${API_URL}statistics/orders/category/${year}`);
        if (!categoryResponse.ok) {
          throw new Error(`HTTP error! status: ${categoryResponse.status}`);
        }
        const categoryDataResponse = await categoryResponse.json();

        // 공급업체별 데이터 가져오기
        const supplierResponse = await fetchWithAuth(`${API_URL}statistics/orders/supplier/${year}`);
        if (!supplierResponse.ok) {
          throw new Error(`HTTP error! status: ${supplierResponse.status}`);
        }
        const supplierDataResponse = await supplierResponse.json();

        // 상위 품목 데이터 가져오기
        const itemResponse = await fetchWithAuth(`${API_URL}statistics/orders/item/${year}`);
        if (!itemResponse.ok) {
          throw new Error(`HTTP error! status: ${itemResponse.status}`);
        }
        const itemDataResponse = await itemResponse.json();

        // 데이터 형식 변환
        const formattedMonthlyData = Array.isArray(monthlyDataResponse.monthlyData)
          ? monthlyDataResponse.monthlyData.map(item => ({
              month: item.yearMonth,
              amount: item.totalAmount,
              orderCount: item.orderCount
            }))
          : [];

        const formattedCategoryData = Array.isArray(categoryDataResponse)
          ? categoryDataResponse.map(item => ({
              category: item.category,
              amount: item.totalAmount
            }))
          : [];

        const formattedSupplierData = Array.isArray(supplierDataResponse)
          ? supplierDataResponse.map(item => ({
              supplier: item.orderCount, // 주의: 공급업체 이름이 orderCount에 있음
              amount: Number(item.totalAmount)
            }))
          : [];

        const formattedItemData = Array.isArray(itemDataResponse)
          ? itemDataResponse.map(item => ({
              item: item.item,
              orderCount: item.orderCount,
              totalAmount: item.totalAmount
            }))
          : [];

        // 핵심 지표 계산
        if (formattedMonthlyData.length > 0) {
          const totalAmount = formattedMonthlyData.reduce((sum, item) => sum + item.amount, 0);
          const totalOrders = formattedMonthlyData.reduce((sum, item) => sum + item.orderCount, 0);
          setTotalStats({
            totalAmount: totalAmount,
            monthlyAvg: totalAmount / formattedMonthlyData.length,
            orderCount: totalOrders,
            avgOrderAmount: totalOrders > 0 ? totalAmount / totalOrders : 0
          });
        }

        // 상태 업데이트
        setMonthlyData(formattedMonthlyData);
        setCategoryData(formattedCategoryData);
        setSupplierData(formattedSupplierData);
        setTopItemsData(formattedItemData);

      } catch (error) {
        console.error("데이터 조회 중 오류 발생:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year]);

  const formatAmount = (value) => {
    if (!value) return '0원';

    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(value);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        {/* 헤더 및 연도 선택 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0 }}>
            통계
          </Typography>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>연도 선택</InputLabel>
            <Select
              value={year}
              label="연도 선택"
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {Array.from(
                { length: 5 },
                (_, i) => new Date().getFullYear() - i
              ).map((y) => (
                <MenuItem key={y} value={y}>{y}년</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* 핵심 지표 */}
        <Grid container spacing={2} sx={{ mb: 7 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, bgcolor: 'background.paper', height: '100%' }}>
              <Typography variant="body2" color="text.secondary">총 구매액</Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>{formatAmount(totalStats.totalAmount)}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, bgcolor: 'background.paper', height: '100%' }}>
              <Typography variant="body2" color="text.secondary">월평균 구매액</Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>{formatAmount(totalStats.monthlyAvg)}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, bgcolor: 'background.paper', height: '100%' }}>
              <Typography variant="body2" color="text.secondary">총 발주 건수</Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>{totalStats.orderCount}건</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, bgcolor: 'background.paper', height: '100%' }}>
              <Typography variant="body2" color="text.secondary">평균 발주 금액</Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>{formatAmount(totalStats.avgOrderAmount)}</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* 탭 메뉴 및 차트 컨텐츠 */}
        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              aria-label="dashboard tabs"
            >
              <Tab label="발주 건수" {...a11yProps(0)} />
              <Tab label="구매액" {...a11yProps(1)} />
              <Tab label="카테고리" {...a11yProps(2)} />
              <Tab label="공급업체" {...a11yProps(3)} />
              <Tab label="상위품목" {...a11yProps(4)} />
            </Tabs>
          </Box>

          {/* 로딩 상태 */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, height: 400 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* 발주 건수 탭 */}
              <TabPanel value={tabValue} index={0}>
                <Typography variant="h6" gutterBottom>
                  월별 발주 건수
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="orderCount"
                        name="발주 건수"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </TabPanel>

              {/* 구매액 탭 */}
              <TabPanel value={tabValue} index={1}>
                <Typography variant="h6" gutterBottom>
                  월별 구매액
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `${(value / 10000000).toFixed(1)}억`} />
                      <Tooltip formatter={(value) => formatAmount(value)} />
                      <Legend />
                      <Bar dataKey="amount" name="구매 금액" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </TabPanel>

              {/* 카테고리 탭 */}
              <TabPanel value={tabValue} index={2}>
                <Typography variant="h6" gutterBottom>
                  카테고리별 구매 비중
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        innerRadius={60}
                        label={(entry) => entry.category}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatAmount(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </TabPanel>

              {/* 공급업체 탭 */}
              <TabPanel value={tabValue} index={3}>
                <Typography variant="h6" gutterBottom>
                  공급업체별 구매액
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={supplierData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={(value) => `${(value / 10000000).toFixed(1)}억`} />
                      <YAxis type="category" dataKey="supplier" width={120} />
                      <Tooltip formatter={(value) => formatAmount(value)} />
                      <Legend />
                      <Bar dataKey="amount" name="구매 금액" fill="#82ca9d">
                        {supplierData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </TabPanel>

              {/* 상위품목 탭 */}
              <TabPanel value={tabValue} index={4}>
                <Typography variant="h6" gutterBottom>
                  상위 품목별 구매액
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topItemsData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={(value) => `${(value / 10000000).toFixed(1)}억`} />
                      <YAxis type="category" dataKey="item" width={150} />
                      <Tooltip formatter={(value) => formatAmount(value)} />
                      <Legend />
                      <Bar dataKey="totalAmount" name="구매 금액" fill="#8884d8">
                        {topItemsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </TabPanel>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ChartDashboard;