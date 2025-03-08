import React from "react";
import { useSelector } from "react-redux";
import { Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// 페이지 컴포넌트 임포트
import Home from "@/pages/Home";
import Login from "@/pages/member/Login";
import BiddingListPage from "@/pages/bidding/BiddingListPage";
import BiddingFormPage from "@/pages/bidding/BiddingFormPage";
import BiddingPriceTestPage from "@/pages/bidding/BiddingPriceTestPage";
import ErrorPage from "@/pages/error/ErrorPage";
import ProjectListPage from "@/pages/procurement/ProjectListPage";
import ProjectDetailPage from "@/pages/procurement/ProjectDetailPage";
import PurchaseRequestListPage from "@/pages/procurement/PurchaseRequestListPage";
import PurchaseRequestDetailPage from "@/pages/procurement/PurchaseRequestDetailPage";
import PurchaseRequestCreatePage from "@/pages/procurement/PurchaseRequestCreatePage";
import ApprovalListPage from "@/pages/procurement/ApprovalListPage";
import ApprovalDetailPage from "@/pages/procurement/ApprovalDetailPage";

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
              <Route
                path="/biddings/new"
                element={<BiddingFormPage mode="create" />}
              />
              <Route
                path="/biddings/edit/:id"
                element={<BiddingFormPage mode="edit" />}
              />
              <Route
                path="/biddings/price-test"
                element={<BiddingPriceTestPage />}
              />

              {/* 프로젝트 관리 */}
              <Route path="/projects" element={<ProjectListPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />

              {/* 구매 요청 관리 */}
              <Route
                path="/purchase-requests"
                element={<PurchaseRequestListPage />}
              />
              <Route
                path="/purchase-requests/:id"
                element={<PurchaseRequestDetailPage />}
              />
              <Route
                path="/purchase-requests/:id"
                element={<PurchaseRequestDetailPage />}
              />
              <Route
                path="/purchase-requests/new"
                element={<PurchaseRequestCreatePage />}
              />

              {/* 승인 관리 */}
              <Route path="/approvals" element={<ApprovalListPage />} />
              <Route path="/approvals/:id" element={<ApprovalDetailPage />} />

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
