import React, { useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FiCheckCircle, FiXCircle, FiArrowLeft, FiShoppingBag } from "react-icons/fi";
import { ThemeContext } from "../../context/ThemeContext";
import styles from "../styles/PaymentSuccessPage.module.css";

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  useContext(ThemeContext);

  const responseCode = searchParams.get("vnp_ResponseCode");
  const isSuccess = responseCode === "00";

  const amount = searchParams.get("vnp_Amount");
  const txnRef = searchParams.get("vnp_TxnRef");
  const orderInfo = decodeURIComponent(searchParams.get("vnp_OrderInfo") || "");
  const payDate = searchParams.get("vnp_PayDate");

  const formatAmount = (amt) => {
    if (!amt) return "0 VNĐ";
    const value = parseInt(amt) / 100;
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };

  // Format date (YYYYMMDDHHmmss)
  const formatDate = (dateStr) => {
    if (!dateStr || dateStr.length !== 14) return dateStr;
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(8, 10);
    const minute = dateStr.substring(10, 12);
    const second = dateStr.substring(12, 14);
    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={`${styles.iconWrapper} ${isSuccess ? styles.iconWrapperSuccess : styles.iconWrapperError}`}>
          {isSuccess ? <FiCheckCircle size={44} /> : <FiXCircle size={44} />}
        </div>

        <h2 className={`${styles.title} ${isSuccess ? styles.titleSuccess : styles.titleError}`}>
          {isSuccess ? "Thanh Toán Thành Công!" : "Thanh Toán Thất Bại"}
        </h2>

        <p className={styles.message}>
          {isSuccess
            ? "Cảm ơn bạn đã tin dùng AelanG PRO. Tài khoản của bạn đã được cập nhật gói dịch vụ mới."
            : "Giao dịch không thành công hoặc đã bị hủy. Vui lòng thử lại sau."}
        </p>

        <div className={`${styles.detailsBox} ${!isSuccess ? styles.detailsBoxError : ""}`}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Mã giao dịch</span>
            <span className={styles.detailValue}>{txnRef || "N/A"}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Số tiền</span>
            <span className={`${styles.detailValue} ${styles.detailValuePrimary}`}>
              {formatAmount(amount)}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Nội dung</span>
            <span className={styles.detailValue}>{orderInfo || "N/A"}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Thời gian</span>
            <span className={styles.detailValue}>{formatDate(payDate)}</span>
          </div>
        </div>

        <div className={styles.btnGroup}>
          <button
            className={`${styles.btnPrimary} ${!isSuccess ? styles.btnError : ""}`}
            onClick={() => navigate("/")}
          >
            <FiArrowLeft size={20} /> Quay về Trang chủ
          </button>
          {isSuccess ? (
            <button
              className={styles.btnSecondary}
              onClick={() => navigate("/profile")}
            >
              <FiShoppingBag size={20} /> Xem gói dịch vụ
            </button>
          ) : (
            <button
              className={styles.btnSecondary}
              onClick={() => navigate("/pricing")}
            >
              Thử lại thanh toán
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
