import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/api";
import { useToast } from "../../context/ToastContext";
import { PACKAGE_TYPE } from "../../enums/packageType.enum";
import "../styles/PackagesPage.css";

const PackagesPage = () => {
  const toast = useToast();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);
  const [roadmaps, setRoadmaps] = useState([]);

  const packageTypes = Object.values(PACKAGE_TYPE);
  const [activeTab, setActiveTab] = useState(packageTypes[0]);

  const formatVNDInput = (value) => {
    if (!value && value !== 0) return "";
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: activeTab,
    price: 0,
    durationInDays: "",
    targetId: "",
    aiConversationCredits: 0,
    grammarCheckerCredits: 0,
  });

  const loadPackages = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await api.get("/packages");
      setPackages(resp.data);
    } catch (err) {
      console.error("Load packages error", err);
      toast.error("Không thể tải danh sách gói nạp");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadRoadmaps = useCallback(async () => {
    try {
      const resp = await api.get("/roadmaps");
      const list = Array.isArray(resp.data) ? resp.data : resp.data?.data || [];
      setRoadmaps(list);
    } catch (err) {
      console.error("Load roadmaps error", err);
    }
  }, []);

  useEffect(() => {
    loadPackages();
    loadRoadmaps();
  }, [loadPackages, loadRoadmaps]);

  const handleOpenModal = (pkg = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        name: pkg.name,
        description: pkg.description || "",
        type: pkg.type,
        price: pkg.price,
        durationInDays: pkg.durationInDays || "",
        targetId: pkg.targetId || "",
        aiConversationCredits: pkg.aiConversationCredits || 0,
        grammarCheckerCredits: pkg.grammarCheckerCredits || 0,
      });
    } else {
      setEditingPackage(null);
      setFormData({
        name: "",
        description: "",
        type: activeTab,
        price: 0,
        durationInDays: (activeTab === PACKAGE_TYPE.AI_CONVERSATION || activeTab === PACKAGE_TYPE.GRAMMAR_CHECKER) ? 30 : "",
        targetId: "",
        aiConversationCredits: 0,
        grammarCheckerCredits: 0,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      price: Number(formData.price),
      durationInDays: (formData.durationInDays === 0 || formData.durationInDays === "0")
        ? 0
        : (formData.durationInDays ? Number(formData.durationInDays) : null),
      targetId: formData.targetId ? Number(formData.targetId) : null,
      aiConversationCredits: Number(formData.aiConversationCredits),
      grammarCheckerCredits: Number(formData.grammarCheckerCredits),
    };

    try {
      if (editingPackage) {
        await api.put(`/packages/${editingPackage.id}`, payload);
        toast.success("Cập nhật gói nạp thành công");
      } else {
        await api.post("/packages", payload);
        toast.success("Tạo gói nạp thành công");
      }
      setShowModal(false);
      loadPackages();
    } catch (err) {
      console.error("Save package error", err);
      toast.error(err.response?.data?.message || "Lỗi khi lưu gói nạp");
    }
  };

  const handleDeleteClick = (id) => {
    setPackageToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!packageToDelete) return;
    try {
      await api.delete(`/packages/${packageToDelete}`);
      toast.success("Xóa gói nạp thành công");
      setShowDeleteModal(false);
      setPackageToDelete(null);
      loadPackages();
    } catch (err) {
      console.error("Delete package error", err);
      toast.error(err.response?.data?.message || "Lỗi khi xóa gói nạp");
    }
  };

  const filteredPackages = packages.filter(p => p.type === activeTab);

  const getIcon = (type) => {
    switch (type) {
      case PACKAGE_TYPE.AI_CONVERSATION: return "bi-robot";
      case PACKAGE_TYPE.ROADMAP_UNLOCK: return "bi-map";
      case PACKAGE_TYPE.VIDEO_LESSON: return "bi-play-circle";
      case PACKAGE_TYPE.GRAMMAR_CHECKER: return "bi-spellcheck";
      default: return "bi-box";
    }
  };

  return (
    <div className="container-fluid p-4 p-lg-5 packages-container">
      {/* UNIFIED HEADER */}
      <div className="admin-page-header">
        <div className="header-info">
          <h1 className="mb-0">Subscription Center</h1>
          <p>Quản lý các gói nạp dịch vụ của hệ thống.</p>
        </div>

        <div className="header-actions">
          <button className="btn-premium" onClick={() => handleOpenModal()}>
            <i className="bi bi-plus-lg"></i>
            Create Package
          </button>
        </div>
      </div>

      {/* CENTERED TABS */}
      <div className="premium-tab-container">
        <div className="premium-tab-bar">
          {packageTypes.map((type) => (
            <button
              key={type}
              className={`premium-tab-item ${activeTab === type ? "active" : ""}`}
              onClick={() => setActiveTab(type)}
            >
              <i className={`bi ${getIcon(type)} me-2`}></i>
              {type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : (
        <div className="row g-4">
          {filteredPackages.length === 0 ? (
            <div className="col-12">
              <div className="bg-body-tertiary rounded-4 border p-5 text-center shadow-sm">
                <i className="bi bi-box2 text-muted display-4 mb-3 d-block"></i>
                <p className="text-muted fw-semibold">No packages found in this category.</p>
                <button className="btn btn-link text-decoration-none" onClick={() => handleOpenModal()}>Create your first one</button>
              </div>
            </div>
          ) : (
            filteredPackages.map((pkg) => (
              <div className="col-xl-3 col-lg-4 col-md-6" key={pkg.id}>
                <div className="package-card p-4 h-100 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <div className={`icon-box type-${pkg.type.toLowerCase()}`}>
                      <i className={`bi ${getIcon(pkg.type)}`}></i>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className="btn-action-card edit"
                        onClick={() => handleOpenModal(pkg)}
                        title="Chỉnh sửa"
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button
                        className="btn-action-card delete"
                        onClick={() => handleDeleteClick(pkg.id)}
                        title="Xóa"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>

                  <h5 className="fw-bold mb-2">{pkg.name}</h5>
                  <p className="text-muted small mb-4 flex-grow-1">
                    {pkg.description || "Manage access and features with this subscription package."}
                  </p>

                  <div className="mt-auto pt-3 border-top">
                    <div className="price-tag mb-3">
                      {new Intl.NumberFormat('vi-VN').format(pkg.price)} <small className="text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>VND</small>
                    </div>

                    <div className="row g-3">
                      <div className="col-12">
                        <div className="section-label">Thời hạn</div>
                        <div className="fw-bold small">
                          {pkg.type === PACKAGE_TYPE.ROADMAP_UNLOCK && (!pkg.durationInDays || pkg.durationInDays === 0)
                            ? "Trọn đời"
                            : `${pkg.durationInDays || 0} ngày`}
                        </div>
                      </div>
                      {(pkg.aiConversationCredits > 0 || pkg.grammarCheckerCredits > 0) && (
                        <div className="col-12 mt-2">
                          <div className="section-label">Credit đi kèm</div>
                          <div className="small">
                            {pkg.aiConversationCredits > 0 && <div><i className="bi bi-robot me-1"></i> {pkg.aiConversationCredits} AI</div>}
                            {pkg.grammarCheckerCredits > 0 && <div><i className="bi bi-spellcheck me-1"></i> {pkg.grammarCheckerCredits} Grammar</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* CLEAN PROFESSIONAL MODAL */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold mb-0">{editingPackage ? "Edit" : "New"} {activeTab.replace(/_/g, ' ')}</h4>
              <button className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="section-label">Package Name</label>
                <input
                  type="text"
                  className="form-control border-secondary-subtle py-2 px-3 shadow-none rounded-3"
                  required
                  placeholder="e.g. Standard AI Plan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <label className="section-label">Description</label>
                <textarea
                  className="form-control border-secondary-subtle py-2 px-3 shadow-none rounded-3"
                  rows="2"
                  placeholder="Briefly describe the package benefits"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="section-label">Type</label>
                  <select
                    className="form-select border-secondary-subtle py-2 shadow-none rounded-3 bg-light"
                    value={formData.type}
                    disabled={true} // Khóa cứng Type
                    onChange={(e) => {
                      const newType = e.target.value;
                      const updates = { type: newType };
                      // Roadmap is always permanent (0), others require days
                      if (newType === PACKAGE_TYPE.ROADMAP_UNLOCK) {
                        updates.durationInDays = 0;
                        updates.aiConversationCredits = 0;
                        updates.grammarCheckerCredits = 0;
                      } else {
                        updates.durationInDays = 30;
                        updates.targetId = ""; // Reset targetId for non-roadmap types
                      }
                      setFormData({ ...formData, ...updates });
                    }}
                  >
                    {packageTypes.map((type) => (
                      <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="col-6">
                  <label className="section-label">Price (VND)</label>
                  <div className="position-relative">
                    <input
                      type="text"
                      className="form-control border-secondary-subtle py-2 shadow-none rounded-3 pe-5"
                      required
                      value={formatVNDInput(formData.price)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, price: raw ? parseInt(raw, 10) : 0 });
                      }}
                    />
                    <span className="position-absolute end-0 top-50 translate-middle-y me-3 text-muted small fw-bold">VNĐ</span>
                  </div>
                </div>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-12">
                  {formData.type === PACKAGE_TYPE.ROADMAP_UNLOCK ? (
                    <div className="bg-primary-subtle p-3 rounded-3 border border-primary-subtle d-flex align-items-center gap-3">
                      <div className="icon-box bg-primary text-white" style={{ width: '32px', height: '32px', fontSize: '1rem' }}>
                        <i className="bi bi-infinity"></i>
                      </div>
                      <div>
                        <div className="fw-bold text-primary small">Vĩnh viễn</div>
                        <div className="text-muted small">Gói Roadmap sẽ luôn có giá trị trọn đời.</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <label className="section-label mb-2">Duration (Days)</label>
                      <input
                        type="number"
                        className={`form-control border-secondary-subtle py-2 shadow-none rounded-3 ${
                          (formData.type === PACKAGE_TYPE.AI_CONVERSATION || formData.type === PACKAGE_TYPE.GRAMMAR_CHECKER) 
                          ? "bg-light" : ""
                        }`}
                        placeholder="Số ngày (ví dụ: 30)"
                        value={formData.durationInDays}
                        required
                        disabled={formData.type === PACKAGE_TYPE.AI_CONVERSATION || formData.type === PACKAGE_TYPE.GRAMMAR_CHECKER}
                        onChange={(e) => setFormData({ ...formData, durationInDays: e.target.value })}
                      />
                      {(formData.type === PACKAGE_TYPE.AI_CONVERSATION || formData.type === PACKAGE_TYPE.GRAMMAR_CHECKER) ? (
                        <small className="text-muted">Hạn sử dụng được cố định là 30 ngày cho loại gói này.</small>
                      ) : (
                        <small className="text-muted">Nhập số ngày hiệu lực của gói nạp.</small>
                      )}
                    </>
                  )}
                </div>

                {/* Conditional Credit Fields */}
                {formData.type === PACKAGE_TYPE.AI_CONVERSATION && (
                  <>
                    <div className="col-12">
                      <label className="section-label">AI Conversation Credits</label>
                      <input
                        type="number"
                        className="form-control border-secondary-subtle py-2 shadow-none rounded-3"
                        value={formData.aiConversationCredits}
                        onChange={(e) => setFormData({ ...formData, aiConversationCredits: e.target.value, grammarCheckerCredits: 0 })}
                      />
                    </div>
                  </>
                )}

                {formData.type === PACKAGE_TYPE.GRAMMAR_CHECKER && (
                  <>
                    <div className="col-12">
                      <label className="section-label">Grammar Credits</label>
                      <input
                        type="number"
                        className="form-control border-secondary-subtle py-2 shadow-none rounded-3"
                        value={formData.grammarCheckerCredits}
                        onChange={(e) => setFormData({ ...formData, grammarCheckerCredits: e.target.value, aiConversationCredits: 0 })}
                      />
                    </div>
                  </>
                )}

                {formData.type === PACKAGE_TYPE.ROADMAP_UNLOCK && (
                  <div className="col-12">
                    <label className="section-label">Select Roadmap (Target ID)</label>
                    <select
                      className="form-select border-secondary-subtle py-2 shadow-none rounded-3"
                      required
                      value={formData.targetId}
                      onChange={(e) => {
                        const val = e.target.value;
                        const alreadyAssigned = packages.find(p =>
                          p.type === PACKAGE_TYPE.ROADMAP_UNLOCK &&
                          String(p.targetId) === String(val) &&
                          p.id !== editingPackage?.id
                        );

                        if (alreadyAssigned) {
                          toast.warning(`Roadmap này đã được gán cho gói "${alreadyAssigned.name}"`);
                        }
                        setFormData({ ...formData, targetId: val });
                      }}
                    >
                      <option value="">-- Choose a Roadmap --</option>
                      {roadmaps
                        .filter(rm => rm.freeDayCount !== -1)
                        .map(rm => {
                          const alreadyAssigned = packages.find(p =>
                            p.type === PACKAGE_TYPE.ROADMAP_UNLOCK &&
                            String(p.targetId) === String(rm.id) &&
                            p.id !== editingPackage?.id
                          );
                          return (
                            <option key={rm.id} value={rm.id} disabled={!!alreadyAssigned}>
                              {alreadyAssigned ? "🚫 " : "🔒 "}{rm.levelName} {alreadyAssigned ? "(Already assigned)" : ""}
                            </option>
                          );
                        })}
                    </select>
                    <small className="text-muted mt-1 d-block">
                      Chỉ những Roadmap có phí (có ngày bị khóa) mới được hiển thị.
                      Mỗi Roadmap chỉ có thể gắn với một gói nạp duy nhất.
                    </small>
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-end align-items-center gap-2 pt-3 border-top mt-4">
                {editingPackage && (
                  <button
                    type="button"
                    className="btn btn-outline-danger px-4 rounded-3 me-auto"
                    onClick={() => {
                      handleDeleteClick(editingPackage.id);
                    }}
                  >
                    <i className="bi bi-trash me-2"></i> Xóa gói
                  </button>
                )}
                <button type="button" className="btn btn-light px-4 rounded-3 fw-semibold" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary px-4 rounded-3 fw-semibold shadow-sm">
                  {editingPackage ? "Cập nhật" : "Tạo gói nạp"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content text-center" style={{ maxWidth: '400px' }}>
            <div className="icon-box bg-danger-subtle text-danger mx-auto mb-4" style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <h4 className="fw-bold mb-3">Xác nhận xóa?</h4>
            <p className="text-muted mb-4">Bạn có chắc chắn muốn xóa gói nạp này? Hành động này không thể hoàn tác và có thể ảnh hưởng đến các dịch vụ liên quan.</p>

            <div className="d-flex gap-2 justify-content-center">
              <button className="btn btn-light px-4 rounded-3 fw-semibold" onClick={() => setShowDeleteModal(false)}>Hủy bỏ</button>
              <button className="btn btn-danger px-4 rounded-3 fw-semibold shadow-sm" onClick={confirmDelete}>Đồng ý xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagesPage;
