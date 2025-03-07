import React from "react";
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
import ApprovalListPage from "./pages/procurement/ApprovalListPage";
import ApprovalDetailPage from "./pages/procurement/ApprovalDetailPage";
import InspectionsListPage from "./pages/inspection/InspectionsListPage";
import Login from "./pages/member/Login";
// import Header from "./layouts/Header";
// import Footer from "./layouts/Footer";
// import Layout from "./layouts/Layout";

import Home from "@/pages/Home";
import Login from "@/pages/member/Login";
import BiddingListPage from "@/pages/bidding/BiddingListPage";
import BiddingDetailPage from "./pages/bidding/BiddingDetailPage";
import BiddingFormPage from "@/pages/bidding/BiddingFormPage";
import BiddingEvaluationListPage from "./pages/bidding/BiddingEvaluationListPage";
import BiddingEvaluationDetailPage from "./pages/bidding/BiddingEvaluationDetailPage";
//import BiddingOrderList from "./pages/bidding/BiddingOrderList";
import BiddingOrderDetail from "./pages/bidding/BiddingOrderDetail";
import ContractsListPage from "./pages/contract/ContractsListPage";
import ContractCreatePage from "./pages/contract/ContractCreatePage";
import BiddingOrderPage from "./pages/bidding/BiddingOrderPage";
import ErrorPage from "@/pages/error/ErrorPage";
import ProjectListPage from "@/pages/procurement/ProjectListPage";
import ProjectDetailPage from "@/pages/procurement/ProjectDetailPage";
import ProjectCreatePage from "@/pages/procurement/ProjectCreatePage";
import PurchaseRequestListPage from "@/pages/procurement/PurchaseRequestListPage";
import PurchaseRequestDetailPage from "@/pages/procurement/PurchaseRequestDetailPage";
import PurchaseRequestCreatePage from "@/pages/procurement/PurchaseRequestCreatePage";
import ApprovalListPage from "@/pages/approval/ApprovalListPage";
import ApprovalDetailPage from "@/pages/approval/ApprovalDetailPage";
import ApprovalManagementPage from "@/pages/approval/ApprovalManagementPage"; // 추가
import InspectionsListPage from "@/pages/inspection/InspectionsListPage";
import InspectionDetailPage from "@/pages/inspection/InspectionDetailPage";
import InspectionFormPage from "@/pages/inspection/InspectionFormPage";
import InvoicesListPage from "@/pages/invoice/InvoicesListPage";
import InvoiceCreatePage from "@/pages/invoice/InvoiceCreatePage";
import PaymentListPage from "@/pages/payment/PaymentListPage";
import PaymentProcessPage from "@/pages/payment/PaymentProcessPage";

/**
 * AppContent 컴포넌트: 라우팅 설정 및 페이지 레이아웃 관리
 * @returns {JSX.Element} - 전체 앱 콘텐츠
 */
/**
 * AppContent 컴포넌트: 라우팅 설정 및 페이지 레이아웃 관리
 * @returns {JSX.Element} - 전체 앱 콘텐츠
 */
function AppContent() {
  const { isLoggedIn } = useSelector((state) => state.auth);

    return (
        <div className="App">
{/*             <Header /> */}
{/*             <Layout> */}
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
                    <Route path="/approvals" element={<ProtectedRoute><ApprovalListPage /></ProtectedRoute>} />
                    <Route path="/approvals/:id" element={<ProtectedRoute><ApprovalDetailPage /></ProtectedRoute>} />
                    <Route path="/inspections" element={<ProtectedRoute><InspectionsListPage /></ProtectedRoute>} />
                    <Route path="*" element={<ErrorPage type="notFound" />} />
                </Routes>
{/*             </Layout> */}
{/*             <Footer /> */}
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