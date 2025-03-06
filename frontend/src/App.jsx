import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import BiddingListPage from "./pages/bidding/BiddingListPage";
import BiddingFormPage from "./pages/bidding/BiddingFormPage";
import ErrorPage from "./pages/error/ErrorPage";
// import { fetchWithAuth } from "./utils/fetchWithAuth";
// import { API_URL, SERVER_URL2 } from "./constant";
// import Header from "../components/layout/Header";
// import Footer from "../components/layout/Footer";
// import NavBar from "../components/layout/NavBar";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/biddings" element={<BiddingListPage />} />
        <Route
          path="/biddings/new"
          element={<BiddingFormPage mode="create" />}
        />
        <Route
          path="/biddings/edit/:id"
          element={<BiddingFormPage mode="edit" />}
        />
        <Route path="*" element={<ErrorPage type="notFound" />} />
      </Routes>
    </>
  );
}

export default App;
