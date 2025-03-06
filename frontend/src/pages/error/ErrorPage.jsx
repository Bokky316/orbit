import React from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

const ErrorPage = ({ type = "notFound" }) => {
  const errorMessages = {
    notFound: {
      title: "페이지를 찾을 수 없습니다.",
      description: "요청하신 페이지가 존재하지 않거나 삭제되었습니다."
    },
    unauthorized: {
      title: "접근 권한이 없습니다.",
      description: "해당 페이지에 접근할 권한이 없습니다."
    },
    serverError: {
      title: "서버 오류",
      description:
        "현재 서비스에 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
    }
  };

  const { title, description } = errorMessages[type];

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">{title}</h1>
        <p className="text-gray-600 mb-6">{description}</p>
        <Link
          to="/"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
          메인 페이지로 돌아가기
        </Link>
      </div>
    </div>
  );
};

// PropTypes를 사용하여 타입 검사
ErrorPage.propTypes = {
  type: PropTypes.oneOf(["notFound", "unauthorized", "serverError"])
};

export default ErrorPage;
