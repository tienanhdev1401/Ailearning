import React, { useEffect, useMemo, useState } from "react";
import styles from "../styles/ProfilePage.module.css";
import userService from "../../services/userService";
import LoadingSpinner from "../../component/LoadingSpinner";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const data = await userService.getCurrentUser();
        if (!isMounted) return;
        setProfile(data);
        setError("");
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || "Không thể tải hồ sơ");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayName = useMemo(
    () => profile?.name?.trim() || "Học viên AelanG",
    [profile]
  );

  const displayEmail = profile?.email || "Đang cập nhật";

  const joinedDate = useMemo(() => {
    if (!profile?.startedAt) return "Chưa cập nhật";
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(profile.startedAt));
  }, [profile?.startedAt]);

  const initials = useMemo(() => {
    const clean = displayName.trim();
    if (!clean) return "👤";
    const segments = clean.split(" ").filter(Boolean);
    if (segments.length === 1) return segments[0].charAt(0).toUpperCase();
    return `${segments[0].charAt(0)}${segments[segments.length - 1].charAt(0)}`.toUpperCase();
  }, [displayName]);

  const personalInfo = useMemo(
    () => [
      { label: "Email", value: displayEmail },
      { label: "Số điện thoại", value: profile?.phone ?? "0123 456 789" },
      { label: "Ngày sinh", value: profile?.birthday ?? "20/10/1998" },
      { label: "Giới tính", value: profile?.gender ?? "Nam" },
      { label: "Trạng thái tài khoản", value: profile?.status ?? "Đang hoạt động" },
      { label: "Địa chỉ", value: profile?.address ?? "TP. Hồ Chí Minh, Việt Nam" },
    ],
    [displayEmail, profile]
  );

  const quickStats = useMemo(
    () => [
      { label: "Giờ học", value: "36", badge: "+8%", tone: "teal" },
      { label: "Bài đã hoàn thành", value: "48", badge: "+3", tone: "purple" },
      { label: "Chuỗi ngày", value: "12", badge: "🔥", tone: "amber" },
      { label: "Điểm TOEIC cao nhất", value: "785", badge: "Goal 850", tone: "blue" },
    ],
    []
  );



  const focusNotes = useMemo(
    () => [
      "Tăng tốc phản xạ giao tiếp trong 7 ngày tới",
      "Hoàn thành 3 bài luyện phát âm nâng cao",
      "Ôn lại 40 từ vựng chủ đề Business",
    ],
    []
  );

  const recentActivities = useMemo(
    () => [
      {
        title: "Hoàn thành bài luyện nghe Unit 6",
        status: "Đã hoàn thành",
        date: "08/11/2025",
      },
      {
        title: "Luyện phát âm với AI Coach",
        status: "Đang học",
        date: "07/11/2025",
      },
      {
        title: "Thi thử TOEIC Reading",
        status: "Đã hoàn thành",
        date: "06/11/2025",
      },
    ],
    []
  );

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <LoadingSpinner />
        <p>Đang tải hồ sơ học tập...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <span>⚠️</span>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Thử lại</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <section className={styles.heroCard}>
        <div className={styles.heroContent}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatar}>{initials}</div>
          </div>
          <div className={styles.identity}>
            <h1>{displayName}</h1>
            <p className={styles.role}>TOEIC Learner</p>
            <div className={styles.metaRow}>
              <span>📧 {displayEmail}</span>
              <span>📅 Tham gia {joinedDate}</span>
            </div>
            <div className={styles.heroActions}>
              <button className={styles.primaryBtn}>Tiếp tục học ngay</button>
              <button className={styles.secondaryBtn}>Cập nhật mục tiêu</button>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.statsRow}>
        {quickStats.map((item) => (
          <article key={item.label} className={`${styles.statCard} ${styles[item.tone]}`}>
            <div className={styles.statTop}>
              <span className={styles.statLabel}>{item.label}</span>
              <span className={styles.statBadge}>{item.badge}</span>
            </div>
            <strong className={styles.statValue}>{item.value}</strong>
          </article>
        ))}
      </section>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <article className={styles.card}>
            <header className={styles.cardHeader}>
              <h2>Thông tin cá nhân</h2>
            </header>
            <div className={styles.cardBody}>
              <ul className={styles.infoList}>
                {personalInfo.map((item) => (
                  <li key={item.label}>
                    <span className={styles.infoLabel}>{item.label}</span>
                    <span className={styles.infoValue}>{item.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <article className={styles.card}>
            <header className={styles.cardHeader}>
              <h2>Tiến độ tuần này</h2>
            </header>
            <div className={styles.cardBody}>
              <p className={styles.sectionNote}>Tập trung chính</p>
              <ul className={styles.noteList}>
                {focusNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <div className={styles.progressModule}>
                <div className={styles.progressLabel}>
                  <span>Hoàn thành 5 / 7 nhiệm vụ</span>
                  <span>68%</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: "68%" }} />
                </div>
              </div>
            </div>
          </article>
        </aside>

        <main className={styles.main}>
          <article className={styles.card}>
            <header className={styles.cardHeader}>
              <h2>Thống kê học tập</h2>
              <button className={styles.linkBtn}>Xem lịch sử</button>
            </header>
            <div className={styles.cardBody}>
              <div className={styles.statGrid}>
                <div>
                  <strong>24</strong>
                  <span>Ngữ pháp đã học</span>
                </div>
                <div>
                  <strong>310</strong>
                  <span>Từ vựng đã học</span>
                </div>
                <div>
                  <strong>9</strong>
                  <span>Bài test đã làm</span>
                </div>
              </div>
            </div>
          </article>

          <article className={styles.card}>
            <header className={styles.cardHeader}>
              <h2>Hoạt động gần đây</h2>
              <button className={styles.linkBtn}>Xem tất cả</button>
            </header>
            <div className={styles.cardBody}>
              <ul className={styles.activityList}>
                {recentActivities.map((activity) => (
                  <li key={activity.title}>
                    <div>
                      <strong>{activity.title}</strong>
                      <span>{activity.status}</span>
                    </div>
                    <time>{activity.date}</time>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;
