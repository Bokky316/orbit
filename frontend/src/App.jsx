import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Provider } from 'react-redux';
import { store } from './redux/store'; // Redux 스토어 import
import { useSelector } from 'react-redux';
import Home from "./pages/Home";
import BiddingListPage from "./pages/bidding/BiddingListPage";
import BiddingFormPage from "./pages/bidding/BiddingFormPage";
import ErrorPage from "./pages/error/ErrorPage";
import ProjectListPage from "./pages/procurement/ProjectListPage.jsx";
import ProjectDetailPage from "./pages/procurement/ProjectDetailPage.jsx";
import PurchaseRequestListPage from "./pages/procurement/PurchaseRequestListPage.jsx";
import PurchaseRequestDetailPage from "./pages/procurement/PurchaseRequestDetailPage.jsx";
import ApprovalListPage from "./pages/procurement/ApprovalListPage.jsx";
import ApprovalDetailPage from "./pages/procurement/ApprovalDetailPage.jsx";
import Login from "./pages/member/Login.jsx";

// ProtectedRoute 컴포넌트 정의
const ProtectedRoute = ({ children }) => {
    const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
    return isLoggedIn ? children : <Navigate to="/login" replace />;
};

function App() {
    return (
        <Provider store={store}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Home />} />
                <Route path="/biddings" element={<ProtectedRoute><BiddingListPage /></ProtectedRoute>} />
                <Route
                    path="/biddings/new"
                    element={<ProtectedRoute><BiddingFormPage mode="create" /></ProtectedRoute>}
                />
                <Route
                    path="/biddings/edit/:id"
                    element={<ProtectedRoute><BiddingFormPage mode="edit" /></ProtectedRoute>}
                />
                <Route path="/projects" element={<ProtectedRoute><ProjectListPage /></ProtectedRoute>} />
                <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
                <Route path="/purchase-requests" element={<ProtectedRoute><PurchaseRequestListPage /></ProtectedRoute>} />
                <Route path="/purchase-requests/:id" element={<ProtectedRoute><PurchaseRequestDetailPage /></ProtectedRoute>} />
                <Route path="/approvals" element={<ProtectedRoute><ApprovalListPage /></ProtectedRoute>} />
                <Route path="/approvals/:id" element={<ProtectedRoute><ApprovalDetailPage /></ProtectedRoute>} />
                <Route path="*" element={<ErrorPage type="notFound" />} />
            </Routes>
        </Provider>
    );
}

export default App;
