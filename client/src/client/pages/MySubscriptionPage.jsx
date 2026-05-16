import React, { useEffect, useState } from "react";
import styles from "../styles/MySubscriptionPage.module.css";
import subscriptionService from "../../services/subscriptionService";
import paymentService from "../../services/paymentService";
import userService from "../../services/userService";
import LoadingSpinner from "../../component/LoadingSpinner";
import { Link } from "react-router-dom";

const MySubscriptionPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [credits, setCredits] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subData, transData, creditData] = await Promise.all([
          subscriptionService.getMySubscriptions(),
          paymentService.getMyTransactions(),
          userService.getCredits(),
        ]);
        setSubscriptions(subData);
        setTransactions(transData);
        setCredits(creditData);
      } catch (err) {
        console.error("Failed to fetch subscription data", err);
        setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "SUCCESS":
        return <span className={`${styles.badge} ${styles.success}`}>Thành công</span>;
      case "PENDING":
        return <span className={`${styles.badge} ${styles.warning}`}>Đang chờ</span>;
      case "FAILED":
        return <span className={`${styles.badge} ${styles.danger}`}>Thất bại</span>;
      default:
        return <span className={styles.badge}>{status}</span>;
    }
  };

  const calculateRemainingDays = (endDate) => {
    if (!endDate) return "Vĩnh viễn";
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} ngày` : "Hết hạn";
  };

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <LoadingSpinner />
        <p>Đang tải dữ liệu đăng ký...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/profile" className={styles.backLink}>
          ← Quay lại hồ sơ
        </Link>
        <h1>Quản lý gói dịch vụ & Giao dịch</h1>
        <p className={styles.subtitle}>Xem thông tin các gói bạn đã đăng ký và lịch sử thanh toán.</p>
      </header>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <section className={styles.creditDashboard}>
        <div className={styles.creditCard}>
          <div className={styles.creditIcon}>🤖</div>
          <div className={styles.creditInfo}>
            <div className={styles.creditLabelRow}>
              <span className={styles.creditLabel}>AI Conversation Usage</span>
              <span className={styles.creditCount}>
                <strong>{Math.max(0, Math.max(credits?.aiConversationCredits ?? 0, credits?.totalAiConversationCredits ?? 0) - (credits?.aiConversationCredits ?? 0))}</strong> / {Math.max(credits?.aiConversationCredits ?? 0, credits?.totalAiConversationCredits ?? 0)}
              </span>
            </div>
            <div className={styles.progressBarWrapper}>
              <div
                className={styles.progressBarFill}
                style={{
                  width: `${Math.min(100, (Math.max(0, Math.max(credits?.aiConversationCredits ?? 0, credits?.totalAiConversationCredits ?? 0) - (credits?.aiConversationCredits ?? 0)) / (Math.max(credits?.aiConversationCredits ?? 0, credits?.totalAiConversationCredits ?? 0) || 1)) * 100)}%`
                }}
              />
            </div>
            <div className={styles.creditUsageNote}>
              Bạn đã dùng {Math.max(0, Math.max(credits?.aiConversationCredits ?? 0, credits?.totalAiConversationCredits ?? 0) - (credits?.aiConversationCredits ?? 0))} trên tổng số {Math.max(credits?.aiConversationCredits ?? 0, credits?.totalAiConversationCredits ?? 0)} lượt (Còn lại: {credits?.aiConversationCredits ?? 0})
            </div>
          </div>
        </div>

        <div className={styles.creditCard}>
          <div className={styles.creditIcon}>✍️</div>
          <div className={styles.creditInfo}>
            <div className={styles.creditLabelRow}>
              <span className={styles.creditLabel}>Grammar Checker Usage</span>
              <span className={styles.creditCount}>
                <strong>{Math.max(0, Math.max(credits?.grammarCheckerCredits ?? 0, credits?.totalGrammarCheckerCredits ?? 0) - (credits?.grammarCheckerCredits ?? 0))}</strong> / {Math.max(credits?.grammarCheckerCredits ?? 0, credits?.totalGrammarCheckerCredits ?? 0)}
              </span>
            </div>
            <div className={styles.progressBarWrapper}>
              <div
                className={styles.progressBarFill}
                style={{
                  width: `${Math.min(100, (Math.max(0, Math.max(credits?.grammarCheckerCredits ?? 0, credits?.totalGrammarCheckerCredits ?? 0) - (credits?.grammarCheckerCredits ?? 0)) / (Math.max(credits?.grammarCheckerCredits ?? 0, credits?.totalGrammarCheckerCredits ?? 0) || 1)) * 100)}%`
                }}
              />
            </div>
            <div className={styles.creditUsageNote}>
              Bạn đã dùng {Math.max(0, Math.max(credits?.grammarCheckerCredits ?? 0, credits?.totalGrammarCheckerCredits ?? 0) - (credits?.grammarCheckerCredits ?? 0))} trên tổng số {Math.max(credits?.grammarCheckerCredits ?? 0, credits?.totalGrammarCheckerCredits ?? 0)} lượt (Còn lại: {credits?.grammarCheckerCredits ?? 0})
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Gói dịch vụ của tôi</h2>
          <Link to="/pricing" className={styles.upgradeBtn}>
            Nâng cấp gói
          </Link>
        </div>

        {subscriptions.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Bạn chưa đăng ký gói dịch vụ nào.</p>
          </div>
        ) : (
          <div className={styles.subGrid}>
            {subscriptions.map((sub) => (
              <div key={sub.id} className={styles.subCard}>
                <div className={styles.subCardHeader}>
                  <h3>{sub.package?.name}</h3>
                  <span className={styles.price}>
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(sub.package?.price || 0)}
                  </span>
                </div>
                <div className={styles.subCardBody}>
                  <div className={styles.infoRow}>
                    <span>Ngày bắt đầu:</span>
                    <strong>{new Intl.DateTimeFormat("vi-VN").format(new Date(sub.startDate))}</strong>
                  </div>
                  <div className={styles.infoRow}>
                    <span>Ngày hết hạn:</span>
                    <strong>{sub.endDate ? new Intl.DateTimeFormat("vi-VN").format(new Date(sub.endDate)) : "Vĩnh viễn"}</strong>
                  </div>
                  <div className={styles.infoRow}>
                    <span>Thời gian còn lại:</span>
                    <strong className={styles.highlight}>{calculateRemainingDays(sub.endDate)}</strong>
                  </div>
                </div>
                <div className={styles.subCardFooter}>
                  <div className={styles.statusIndicator}>
                    <span className={styles.pulse}></span>
                    Đang hoạt động
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Lịch sử giao dịch</h2>
        </div>

        {transactions.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Chưa có lịch sử giao dịch.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mã giao dịch</th>
                  <th>Gói dịch vụ</th>
                  <th>Số tiền</th>
                  <th>Ngày giao dịch</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id}>
                    <td className={styles.txnId}>#{txn.id.substring(0, 8)}...</td>
                    <td>{txn.package?.name}</td>
                    <td className={styles.amount}>
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(txn.amount)}
                    </td>
                    <td>{new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(txn.createdAt))}</td>
                    <td>{getStatusBadge(txn.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default MySubscriptionPage;
