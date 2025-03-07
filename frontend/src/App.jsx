import React from "react";
import { CircularProgress } from "@mui/material";
import { useSelector } from "react-redux";
import { Routes, Route, Navigate } from "react-router-dom";
import { Provider } from 'react-redux';
import { store } from './redux/store';
import Home from "./pages/Home";
import BiddingListPage from "./pages/bidding/BiddingListPage";
import BiddingFormPage from "./pages/bidding/BiddingFormPage";
import ErrorPage from "./pages/error/ErrorPage";
import ProjectListPage from "./pages/procurement/ProjectListPage";
import ProjectDetailPage from "./pages/procurement/ProjectDetailPage";
import PurchaseRequestListPage from "./pages/procurement/PurchaseRequestListPage";
import PurchaseRequestDetailPage from "./pages/procurement/PurchaseRequestDetailPage";
import PurchaseRequestCreatePage from './pages/procurement/PurchaseRequestCreatePage';
import ApprovalListPage from "./pages/procurement/ApprovalListPage";
import ApprovalDetailPage from "./pages/procurement/ApprovalDetailPage";
import Login from "./pages/member/Login";
// import Header from "./layouts/Header";
// import Footer from "./layouts/Footer";
// import Layout from "./layouts/Layout";

/**
 * 인증된 사용자만 접근 가능한 Protected Route 컴포넌트
 * @param {object} { children } - 자식 컴포넌트
 * @returns {JSX.Element} - 인증되지 않은 경우 로그인 페이지로 리다이렉트
 */
const ProtectedRoute = ({ children }) => {
    const { isLoggedIn } = useSelector((state) => state.auth);
    return isLoggedIn ? children : <Navigate to="/login" replace />;
};

/**
 * AppContent 컴포넌트: 라우팅 설정 및 페이지 레이아웃 관리
 * @returns {JSX.Element} - 전체 앱 콘텐츠
 */
function AppContent() {
    const { isLoggedIn } = useSelector((state) => state.auth);

    return (
        <div className="App">
            {/* <Header /> */}
            {/* <Layout> */}
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Home />} />
                <Route path="/biddings" element={<ProtectedRoute><BiddingListPage /></ProtectedRoute>} />
                <Route path="/biddings/new" element={<ProtectedRoute><BiddingFormPage mode="create" /></ProtectedRoute>} />
                <Route path="/biddings/edit/:id" element={<ProtectedRoute><BiddingFormPage mode="edit" /></ProtectedRoute>} />
                <Route path="/projects" element={<ProtectedRoute><ProjectListPage /></ProtectedRoute>} />
                <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
                <Route path="/purchase-requests" element={<ProtectedRoute><PurchaseRequestListPage /></ProtectedRoute>} />
                <Route path="/purchase-requests/:id" element={<ProtectedRoute><PurchaseRequestDetailPage /></ProtectedRoute>} />
                <Route path="/purchase-requests/new" element={<PurchaseRequestCreatePage />} />
                <Route path="/approvals" element={<ProtectedRoute><ApprovalListPage /></ProtectedRoute>} />
                <Route path="/approvals/:id" element={<ProtectedRoute><ApprovalDetailPage /></ProtectedRoute>} />
                <Route path="*" element={<ErrorPage type="notFound" />} />
            </Routes>
            {/* </Layout> */}
            {/* <Footer /> */}
        </div>
    );
}

function App() {
    return (
        <Provider store={store}>
            <AppContent />
        </Provider>
    );
}

export default App;
