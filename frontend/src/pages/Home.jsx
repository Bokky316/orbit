import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@mui/material";

const Home = () => {
  return (
    <div className="container">
      <h1 className="text-3xl font-bold mb-4">Home</h1>
      <Link to="/biddings" style={{ textDecoration: "none" }}>
        <Button variant="contained" color="primary">
          입찰 공고 리스트
        </Button>
      </Link>
    </div>
  );
};

export default Home;
