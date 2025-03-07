import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainContainer from "./components/layout/MainContainer";
import Home from "./pages/Home";
import BiddingListPage from "./pages/bidding/BiddingListPage";
import BiddingFormPage from "./pages/bidding/BiddingFormPage";
import BiddingPriceTestPage from "./pages/bidding/BiddingPriceTestPage";
import ErrorPage from "./pages/error/ErrorPage";
// import LoginPage from "./pages/auth/LoginPage"; // 로그인 페이지 (추후 개발)

function App() {
  // 로그인 상태 체크 (추후 구현)
  // const [isLoggedIn, setIsLoggedIn] = useState(true);

  return (
    <BrowserRouter>
      {/* 로그인 페이지 (로그인 완료 되면 로그인 후 MainContainer 나옴)
      {!isLoggedIn ? (
        <Routes>
          <Route path="*" element={<LoginPage onLogin={() => setIsLoggedIn(true)} />} />
        </Routes>
      ) : ( */}
      <MainContainer>
        <Routes>
          {/* 홈 페이지 */}
          <Route path="/" element={<Home />} />

          {/* 입찰 공고, 계약 관리 */}
          <Route path="/biddings" element={<BiddingListPage />} />
          <Route
            path="/biddings/new"
            element={<BiddingFormPage mode="create" />}
          />
          <Route
            path="/biddings/edit/:id"
            element={<BiddingFormPage mode="edit" />}
          />
          {/* 테스트 페이지 */}
          <Route
            path="/biddings/price-test"
            element={<BiddingPriceTestPage />}
          />
          {/* 대시보드 */}
          <Route path="/dashboard" element={<div>대시보드 페이지</div>} />

          {/* 계약 관리 */}
          <Route path="/contracts" element={<div>계약 관리 페이지</div>} />
          <Route path="/contracts/list" element={<div>계약 목록 페이지</div>} />

          {/* 에러 페이지 */}
          <Route path="*" element={<ErrorPage type="notFound" />} />
        </Routes>
      </MainContainer>
      {/* )} */}
    </BrowserRouter>
  );
}

export default App;
