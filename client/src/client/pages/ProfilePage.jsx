import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/ProfilePage.module.css";
import userService from "../../services/userService";
import api from "../../api/api";
import LoadingSpinner from "../../component/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";
import Cropper from "react-easy-crop";
import { getCroppedImage } from "../../utils/imageCropper";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    birthday: "",
    gender: "",
  });
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState("");
  const [pendingAvatarFile, setPendingAvatarFile] = useState(null);
  const [activeRoadmapState, setActiveRoadmapState] = useState({
    loading: true,
    data: null,
    error: "",
  });
  const { logout } = useAuth();
  const navigate = useNavigate();

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

  useEffect(() => {
    if (!profile) return;

    setEditForm({
      name: profile.name || "",
      phone: profile.phone || "",
      birthday: profile.birthday ? new Date(profile.birthday).toISOString().slice(0, 10) : "",
      gender: profile.gender || "",
    });

    setAvatarPreview(profile.avatarUrl || "");
  }, [profile]);

  useEffect(() => {
    if (!formSuccess) return;
    const timer = setTimeout(() => setFormSuccess(""), 3000);
    return () => clearTimeout(timer);
  }, [formSuccess]);

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  useEffect(() => {
    return () => {
      if (pendingAvatarUrl && pendingAvatarUrl.startsWith("blob:")) {
        URL.revokeObjectURL(pendingAvatarUrl);
      }
    };
  }, [pendingAvatarUrl]);

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

  const genderLabels = {
    MALE: "Nam",
    FEMALE: "Nữ",
    OTHER: "Khác",
  };

  const enrollmentStatusLabels = {
    active: "Đang học",
    paused: "Tạm dừng",
    completed: "Hoàn thành",
    dropped: "Đã huỷ",
  };

  const statusLabels = {
    ACTIVE: 'Hoạt động',
    INACTIVE: 'Ngưng',
    BANNED: 'Bị cấm'
  };

  const formattedBirthday = useMemo(() => {
    if (!profile?.birthday) return "Chưa cập nhật";
    try {
      return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(profile.birthday));
    } catch (err) {
      console.error("Không thể định dạng ngày sinh", err);
      return "Chưa cập nhật";
    }
  }, [profile?.birthday]);

  const genderLabel = profile?.gender ? genderLabels[profile.gender] : "";
  const statusLabel = statusLabels[profile?.status] || "Chưa cập nhật";

  const personalInfo = useMemo(
    () => [
      { label: "Email", value: displayEmail },
      { label: "Số điện thoại", value: profile?.phone || "Chưa cập nhật" },
      { label: "Ngày sinh", value: formattedBirthday },
  { label: "Giới tính", value: genderLabel },
      { label: "Trạng thái tài khoản", value: statusLabel },
      { label: "Địa chỉ", value: profile?.address ?? "TP. Hồ Chí Minh, Việt Nam" },
    ],
    [displayEmail, formattedBirthday, genderLabel, statusLabel, profile]
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

  const heroAvatarUrl = (isEditing && avatarPreview) || profile?.avatarUrl || "";

  const handleCropComplete = useCallback((_, croppedArea) => {
    setCroppedAreaPixels(croppedArea);
  }, []);

  const handleCropCancel = useCallback(() => {
    if (pendingAvatarUrl && pendingAvatarUrl.startsWith("blob:")) {
      URL.revokeObjectURL(pendingAvatarUrl);
    }
    setPendingAvatarUrl("");
    setPendingAvatarFile(null);
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setIsCropping(false);
  }, [pendingAvatarUrl]);

  const handleCropConfirm = useCallback(async () => {
    if (!pendingAvatarUrl || !croppedAreaPixels) {
      setIsCropping(false);
      return;
    }

    try {
      const mimeType = pendingAvatarFile?.type || "image/jpeg";
      const fileName = pendingAvatarFile?.name || "avatar.jpg";
      const { file, url } = await getCroppedImage(
        pendingAvatarUrl,
        croppedAreaPixels,
        fileName,
        mimeType
      );

      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }

      if (pendingAvatarUrl.startsWith("blob:")) {
        URL.revokeObjectURL(pendingAvatarUrl);
      }

      setAvatarPreview(url);
      setAvatarFile(file);
      setPendingAvatarUrl("");
      setPendingAvatarFile(null);
      setCroppedAreaPixels(null);
      setIsCropping(false);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setFormError("");
    } catch (err) {
      console.error("Không thể cắt ảnh", err);
      setFormError("Không thể cắt ảnh. Vui lòng thử lại.");
    }
  }, [
    pendingAvatarUrl,
    croppedAreaPixels,
    pendingAvatarFile,
    avatarPreview,
  ]);

  const handleOpenEdit = () => {
    if (!profile) return;
    setFormError("");
    setFormSuccess("");
    setAvatarFile(null);
    if (pendingAvatarUrl && pendingAvatarUrl.startsWith("blob:")) {
      URL.revokeObjectURL(pendingAvatarUrl);
    }
    setPendingAvatarUrl("");
    setPendingAvatarFile(null);
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setIsCropping(false);
    setAvatarPreview(profile.avatarUrl || "");
    setEditForm({
      name: profile.name || "",
      phone: profile.phone || "",
      birthday: profile.birthday ? new Date(profile.birthday).toISOString().slice(0, 10) : "",
      gender: profile.gender || "",
    });
    setIsEditing(true);
  };

  const handleCloseEdit = () => {
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    if (pendingAvatarUrl && pendingAvatarUrl.startsWith("blob:")) {
      URL.revokeObjectURL(pendingAvatarUrl);
    }
    setAvatarPreview(profile?.avatarUrl || "");
    setAvatarFile(null);
    setPendingAvatarUrl("");
    setPendingAvatarFile(null);
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setIsCropping(false);
    setFormError("");
    setIsEditing(false);
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (event) => {
    const value = event.target.value;
    if (!/^[0-9+()\s-]*$/u.test(value)) {
      return;
    }
    setEditForm((prev) => ({ ...prev, phone: value }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Vui lòng chọn định dạng ảnh hợp lệ (JPG, PNG, GIF, WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError("Ảnh đại diện không được vượt quá 5MB");
      return;
    }

    if (pendingAvatarUrl && pendingAvatarUrl.startsWith("blob:")) {
      URL.revokeObjectURL(pendingAvatarUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setPendingAvatarUrl(previewUrl);
    setPendingAvatarFile(file);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setIsCropping(true);
    setFormError("");
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout thất bại", err);
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    if (!profile) return;

    const trimmedName = editForm.name.trim();
    if (!trimmedName) {
      setFormError("Họ tên không được để trống");
      return;
    }

    setIsSaving(true);
    setFormError("");

    try {
      let avatarUrl = profile.avatarUrl || null;
      if (avatarFile) {
        const { url } = await userService.uploadAvatar(avatarFile, `users/${profile.id}`);
        avatarUrl = url;
      } else if (avatarPreview && !avatarPreview.startsWith("blob:")) {
        avatarUrl = avatarPreview;
      }

      const payload = {
        name: trimmedName,
        avatarUrl,
        phone: editForm.phone?.trim() ? editForm.phone.trim() : null,
        birthday: editForm.birthday || null,
        gender: editForm.gender || null,
      };

      const updatedUser = await userService.updateProfile(payload);
      setProfile(updatedUser);
      setFormSuccess("Cập nhật hồ sơ thành công");

      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }

      setAvatarFile(null);
      setAvatarPreview(updatedUser.avatarUrl || "");
      setIsEditing(false);
    } catch (err) {
      setFormError(err.message || "Không thể cập nhật hồ sơ");
    } finally {
      setIsSaving(false);
    }
  };

  const fetchActiveRoadmap = useCallback(async () => {
    if (!profile?.id) {
      setActiveRoadmapState({ loading: false, data: null, error: "" });
      return;
    }

    setActiveRoadmapState((prev) => ({ ...prev, loading: true, error: "" }));

    try {
      const response = await api.get(`/roadmap_enrollments/user/${profile.id}/active`);
      const payload = response.data || {};
      const enrollment = payload.enrollment || payload.roadmap_enrollement || null;
      const roadmap =
        payload.roadmap ||
        enrollment?.roadmap ||
        payload.roadmap_enrollement?.roadmap ||
        null;
      const progressSummary = payload.progressSummary || payload.progress_summary || null;
      const hasActive = payload.hasActive ?? Boolean(enrollment || roadmap);

      setActiveRoadmapState({
        loading: false,
        data: { enrollment, roadmap, progressSummary, hasActive },
        error: "",
      });
    } catch (err) {
      setActiveRoadmapState({
        loading: false,
        data: null,
        error: err?.message || "Không thể tải lộ trình đang học",
      });
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchActiveRoadmap();
  }, [fetchActiveRoadmap]);

  const activeRoadmap = activeRoadmapState.data;

  const activeRoadmapMeta = useMemo(() => {
    if (!activeRoadmap?.roadmap) return null;
    const summary = activeRoadmap.progressSummary || {};
    const totalDays =
      Number(summary.totalDays) ||
      activeRoadmap.roadmap.totalDays ||
      activeRoadmap.roadmap.days?.length ||
      0;
    const completedDays = Number(summary.lastCompletedDay) || 0;
    const lastTouchedDay = Number(summary.lastTouchedDay) || 0;
    const resumeDay = Number(summary.resumeDay) || (lastTouchedDay ? lastTouchedDay + 1 : 1);
    const percent = totalDays > 0 ? Math.min(100, Math.round((completedDays / totalDays) * 100)) : 0;
    const startedAt = activeRoadmap.enrollment?.started_at || activeRoadmap.enrollment?.startedAt || null;

    return {
      totalDays,
      completedDays,
      lastTouchedDay,
      resumeDay,
      percent,
      startedAt,
    };
  }, [activeRoadmap]);

  const roadmapStartedAt = useMemo(() => {
    if (!activeRoadmapMeta?.startedAt) return "Chưa cập nhật";
    try {
      return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(activeRoadmapMeta.startedAt));
    } catch (err) {
      console.error("Không thể định dạng ngày bắt đầu lộ trình", err);
      return "Chưa cập nhật";
    }
  }, [activeRoadmapMeta?.startedAt]);

  const handleContinueRoadmap = useCallback(() => {
    const roadmapId = activeRoadmap?.roadmap?.id;
    if (roadmapId) {
      navigate(`/roadmaps/${roadmapId}/days`);
      return;
    }
    navigate("/roadmaps");
  }, [activeRoadmap?.roadmap?.id, navigate]);

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
      {formSuccess && <div className={styles.toastSuccess}>{formSuccess}</div>}
      <section className={styles.heroCard}>
        <div className={styles.heroContent}>
          <div className={styles.avatarWrapper}>
            <div
              className={styles.avatar}
              style={
                heroAvatarUrl
                  ? { backgroundImage: `url(${heroAvatarUrl})` }
                  : undefined
              }
            >
              {!heroAvatarUrl && initials}
            </div>
          </div>
          <div className={styles.heroDetails}>
            <div className={styles.identity}>
              <h1>{displayName}</h1>
              <div className={styles.metaRow}>
                <span>📧 {displayEmail}</span>
                <span>📅 Tham gia {joinedDate}</span>
                <span>📋 Trạng thái {statusLabel}</span>
              </div>
            </div>
            <div className={styles.heroActions}>
              <div className={styles.heroActionGroup}>
                <button className={styles.secondaryBtn} onClick={handleOpenEdit}>
                  Chỉnh sửa hồ sơ
                </button>
              </div>
              <button className={styles.logoutBtn} onClick={handleLogout}>
                Đăng xuất
              </button>
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
              <h2>Lộ trình đang học</h2>
              {!activeRoadmapState.loading && activeRoadmap?.hasActive && (
                <button className={styles.linkBtn} onClick={handleContinueRoadmap}>
                  Đi tới lộ trình
                </button>
              )}
            </header>
            <div className={styles.cardBody}>
              {activeRoadmapState.loading ? (
                <div className={styles.roadmapLoading}>Đang tải lộ trình của bạn...</div>
              ) : activeRoadmapState.error ? (
                <div className={styles.roadmapError}>
                  <span>{activeRoadmapState.error}</span>
                  <button className={styles.linkBtn} onClick={fetchActiveRoadmap}>
                    Thử lại
                  </button>
                </div>
              ) : !activeRoadmap?.hasActive ? (
                <div className={styles.roadmapEmpty}>
                  <div>
                    <strong>Bạn chưa chọn lộ trình học</strong>
                    <p>Chọn ngay một lộ trình để bắt đầu theo dõi tiến độ của bạn.</p>
                  </div>
                  <button className={styles.primaryBtn} onClick={handleContinueRoadmap}>
                    Chọn lộ trình
                  </button>
                </div>
              ) : (
                <div className={styles.roadmapSummary}>
                  <div className={styles.roadmapHeaderRow}>
                    <div>
                      <p className={styles.roadmapEyebrow}>Lộ trình hiện tại</p>
                      <h3 className={styles.roadmapTitle}>
                        {activeRoadmap?.roadmap?.displayName ||
                          activeRoadmap?.roadmap?.title ||
                          activeRoadmap?.roadmap?.levelName ||
                          "Lộ trình"}
                      </h3>
                      <div className={styles.roadmapMeta}>
                        <span className={styles.roadmapChip}>{activeRoadmap?.roadmap?.levelName || "Đang cập nhật"}</span>
                        <span className={`${styles.roadmapChip} ${styles.roadmapChipMuted}`}>
                          {enrollmentStatusLabels[activeRoadmap?.enrollment?.status] || "Đang cập nhật"}
                        </span>
                        <span className={`${styles.roadmapChip} ${styles.roadmapChipMuted}`}>
                          Bắt đầu {roadmapStartedAt}
                        </span>
                      </div>
                    </div>
                  </div>

                  {activeRoadmapMeta ? (
                    <div className={styles.roadmapProgressBlock}>
                      <div className={styles.progressLabel}>
                        <span>
                          {activeRoadmapMeta.totalDays > 0
                            ? `Đã hoàn thành ${activeRoadmapMeta.completedDays} / ${activeRoadmapMeta.totalDays} ngày`
                            : "Lộ trình chưa có ngày học"}
                        </span>
                        <span>{activeRoadmapMeta.percent}%</span>
                      </div>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${activeRoadmapMeta.percent}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className={styles.roadmapEmpty}>Không tìm thấy dữ liệu tiến độ.</div>
                  )}
                </div>
              )}
            </div>
          </article>

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

          {isEditing && (
            <div className={styles.editOverlay}>
              <div className={styles.editDialog} role="dialog" aria-modal="true">
                <div className={styles.editHeader}>
                  <h2>Chỉnh sửa hồ sơ</h2>
                  <button
                    type="button"
                    className={styles.closeBtn}
                    onClick={handleCloseEdit}
                    aria-label="Đóng hộp thoại chỉnh sửa"
                  >
                    ×
                  </button>
                </div>
                <form className={styles.editForm} onSubmit={handleSaveProfile}>
                  {formError && <div className={styles.formError}>{formError}</div>}

                  <label className={styles.field}>
                    <span>Họ và tên</span>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={handleInputChange("name")}
                      placeholder="Nhập họ và tên"
                      maxLength={120}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Ảnh đại diện</span>
                    <div className={styles.avatarInputRow}>
                      <div
                        className={styles.avatarPreview}
                        style={
                          avatarPreview
                            ? { backgroundImage: `url(${avatarPreview})` }
                            : undefined
                        }
                      >
                        {!avatarPreview && initials}
                      </div>
                      <label className={styles.uploadBtn}>
                        Chọn ảnh
                        <input type="file" accept="image/*" onChange={handleAvatarChange} />
                      </label>
                    </div>
                    <span className={styles.fieldHint}>Hỗ trợ JPG, PNG, GIF, WEBP (tối đa 5MB)</span>
                  </label>

                  <label className={styles.field}>
                    <span>Số điện thoại</span>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={handlePhoneChange}
                      placeholder="Ví dụ: 0901234567"
                      maxLength={20}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Ngày sinh</span>
                    <input
                      type="date"
                      value={editForm.birthday}
                      onChange={handleInputChange("birthday")}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Giới tính</span>
                    <select value={editForm.gender} onChange={handleInputChange("gender")}>
                      <option value="">Chọn giới tính</option>
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </label>

                  <div className={styles.formActions}>
                    <button
                      type="button"
                      className={styles.cancelBtn}
                      onClick={handleCloseEdit}
                    >
                      Hủy
                    </button>
                    <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                      {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {isCropping && pendingAvatarUrl && (
            <div className={styles.cropOverlay}>
              <div className={styles.cropDialog} role="dialog" aria-modal="true">
                <div className={styles.cropArea}>
                  <Cropper
                    image={pendingAvatarUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    objectFit="contain"
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={handleCropComplete}
                  />
                </div>
                <div className={styles.cropControls}>
                  <label htmlFor="avatarZoom">Thu phóng</label>
                  <input
                    id="avatarZoom"
                    className={styles.zoomRange}
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(event) => setZoom(Number(event.target.value))}
                  />
                  <div className={styles.cropActions}>
                    <button type="button" className={styles.cancelBtn} onClick={handleCropCancel}>
                      Hủy
                    </button>
                    <button type="button" className={styles.saveBtn} onClick={handleCropConfirm}>
                      Áp dụng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
    </div>
  );
};

export default ProfilePage;
