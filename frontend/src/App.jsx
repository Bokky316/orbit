import React from "react";
import { useSelector } from "react-redux";
import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "@/pages/Home";
import Login from "@/pages/member/Login";
import BiddingListPage from "@/pages/bidding/BiddingListPage";
import BiddingDetailPage from "./pages/bidding/BiddingDetailPage";
import BiddingFormPage from "@/pages/bidding/BiddingFormPage";
import BiddingEvaluationListPage from "./pages/bidding/BiddingEvaluationListPage";
import BiddingEvaluationDetailPage from "./pages/bidding/BiddingEvaluationDetailPage";
import BiddingOrderList from "./pages/bidding/BiddingOrderList";
import BiddingOrderDetail from "./pages/bidding/BiddingOrderDetail";
import ErrorPage from "@/pages/error/ErrorPage";
import ProjectListPage from "@/pages/procurement/ProjectListPage";
import ProjectDetailPage from "@/pages/procurement/ProjectDetailPage";
import ProjectCreatePage from '@/pages/procurement/ProjectCreatePage';
import ProjectEditPage from '@/pages/procurement/ProjectEditPage';
import PurchaseRequestListPage from "@/pages/procurement/PurchaseRequestListPage";
import PurchaseRequestDetailPage from "@/pages/procurement/PurchaseRequestDetailPage";
import PurchaseRequestCreatePage from "@/pages/procurement/PurchaseRequestCreatePage";
import PurchaseRequestEditPage from "@/pages/procurement/PurchaseRequestEditPage";
import ApprovalListPage from "@/pages/approval/ApprovalListPage";
import ApprovalDetailPage from "@/pages/approval/ApprovalDetailPage";
import ApprovalManagementPage from "@/pages/approval/ApprovalManagementPage";
import InspectionsListPage from "@/pages/inspection/InspectionsListPage"
import InspectionDetailPage from "@/pages/inspection/InspectionDetailPage"
import InspectionFormPage from "@/pages/inspection/InspectionFormPage"
import InvoicesListPage from "@/pages/invoice/InvoicesListPage"
import InvoiceCreatePage from "@/pages/invoice/InvoiceCreatePage"
import PaymentListPage from '@/pages/payment/PaymentListPage';
import PaymentProcessPage from '@/pages/payment/PaymentProcessPage';

/**
 * AppContent 컴포넌트: 라우팅 설정 및 페이지 레이아웃 관리
 * @returns {JSX.Element} - 전체 앱 콘텐츠
 */
function AppContent() {
  const { isLoggedIn } = useSelector((state) => state.auth);

  // 대시보드 페이지 임시 컴포넌트
  const DashboardPage = () => <div>대시보드 페이지</div>;

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {isLoggedIn ? (
            <Route element={<Home />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* 입찰 관리 */}
              <Route path="/biddings" element={<BiddingListPage />} />
              <Route path="/biddings/:id" element={<BiddingDetailPage />} />
              <Route
                path="/biddings/new"
                element={<BiddingFormPage mode="create" />}
              />
              <Route
                path="/biddings/edit/:id"
                element={<BiddingFormPage mode="edit" />}
              />
              <Route
                path="/biddings/evaluations"
                element={<BiddingEvaluationListPage />}
              />
              <Route
                path="/biddings/evaluations/:id"
                element={<BiddingEvaluationDetailPage />}
              />
              <Route path="/biddings/orders" element={<BiddingOrderList />} />
              <Route
                path="/biddings/orders/:id"
                element={<BiddingOrderDetail />}
              />

              {/* 프로젝트 관리 */}
                <Route path="/projects" element={<ProjectListPage />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
                <Route path="/projects/new" element={<ProjectCreatePage />} />
                <Route path="/projects/edit/:id" element={<ProjectEditPage />} />

                {/* 구매 요청 관리 */}
                <Route
                  path="/purchase-requests"
                  element={<PurchaseRequestListPage />}
                />
                <Route path="/purchase-requests/:id" element={<PurchaseRequestDetailPage />} />
                <Route path="/purchase-requests/new" element={<PurchaseRequestCreatePage />}/>
                <Route path="/purchase-requests/edit/:id" element={<PurchaseRequestEditPage />}/>


              {/* 승인 관리 */}
              <Route path="/approvals" element={<ApprovalListPage />} />
              <Route path="/approvals/:id" element={<ApprovalDetailPage />} />
              <Route path="/approval-management" element={<ApprovalManagementPage />} /> {/* 추가 */}

                {/* 검수 관리 */}
                <Route path="/inspections" element={<InspectionsListPage />} />
                <Route path="/inspections/:id" element={<InspectionDetailPage />} />
                <Route path="/inspections/:id/edit" element={<InspectionFormPage />} />

                {/* 송장 관리 */}
                <Route path="/invoices" element={<InvoicesListPage />} />
                <Route path="/invoices/create" element={<InvoiceCreatePage />} />
                <Route path="/payments" element={<PaymentListPage />} />
                <Route path="/payments/:invoiceId" element={<PaymentProcessPage />} />

              {/* 404 페이지 */}
              <Route path="*" element={<ErrorPage type="notFound" />} />
            </Route>
          ) : (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          )}
        </Routes>
      </div>
    </BrowserRouter>
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