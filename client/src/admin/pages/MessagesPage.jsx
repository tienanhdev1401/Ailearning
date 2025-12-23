import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { SupportChatService } from "../../services/supportChatService";
import { createSupportChatSocket } from "../../utils/supportChatSocket";
import { useToast } from "../../context/ToastContext";

const STATUS_OPTIONS = [
	{ value: "open", label: "Đang mở" },
	{ value: "resolved", label: "Đã giải quyết" },
	{ value: "closed", label: "Đã đóng" },
];

const statusLabel = (status) => {
	const found = STATUS_OPTIONS.find((item) => item.value === status);
	return found ? found.label : "";
};

const formatDateTime = (value) => {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "";
	}
	return date.toLocaleString("vi-VN", {
		hour: "2-digit",
		minute: "2-digit",
		day: "2-digit",
		month: "2-digit",
	});
};

const formatTime = (value) => {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "";
	}
	return date.toLocaleTimeString("vi-VN", {
		hour: "2-digit",
		minute: "2-digit",
	});
};

const MessagesPage = () => {
	const toast = useToast();
	const [conversations, setConversations] = useState([]);
	const [loadingConversations, setLoadingConversations] = useState(false);
	const [conversationsError, setConversationsError] = useState(null);

	const [selectedConversationId, setSelectedConversationId] = useState(null);
	const [conversationLoading, setConversationLoading] = useState(false);
	const [conversationError, setConversationError] = useState(null);
	const [messages, setMessages] = useState([]);

	const [messageInput, setMessageInput] = useState("");
	const [sending, setSending] = useState(false);
	const [statusUpdating, setStatusUpdating] = useState(false);
	const [deletingConversationId, setDeletingConversationId] = useState(null);

	const socketRef = useRef(null);
	const chatMessagesRef = useRef(null);

	const sortedConversations = useMemo(() => {
		return [...conversations]
			.sort((a, b) => {
				const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
				const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
				return bTime - aTime;
			});
	}, [conversations]);

	const selectedConversation = useMemo(
		() => conversations.find((item) => item.id === selectedConversationId) ?? null,
		[conversations, selectedConversationId]
	);

	const ensureSocket = useCallback(() => {
		if (!socketRef.current) {
			socketRef.current = createSupportChatSocket();
		}
		return socketRef.current;
	}, []);

	const disconnectSocket = useCallback(() => {
		const socket = socketRef.current;
		if (!socket) {
			return;
		}
		if (socket.connected) {
			socket.disconnect();
		}
		socketRef.current = null;
	}, []);

	const appendMessage = useCallback((message) => {
		setMessages((prev) => {
			if (prev.some((item) => item.id === message.id)) {
				return prev;
			}
			return [...prev, message].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
		});
	}, []);

	const refreshConversations = useCallback(async () => {
		setLoadingConversations(true);
		setConversationsError(null);
		try {
			const data = await SupportChatService.listConversations();
			setConversations(data);
			setSelectedConversationId((current) => {
				if (current && data.some((item) => item.id === current)) {
					return current;
				}
				return data.length ? data[0].id : null;
			});
		} catch (err) {
			const message = err?.response?.data?.message ?? err?.message ?? "Không tải được danh sách";
			setConversationsError(message);
		} finally {
			setLoadingConversations(false);
		}
	}, []);

	const loadConversation = useCallback(
		async (conversationId) => {
			if (!conversationId) {
				setMessages([]);
				return;
			}
			setConversationLoading(true);
			setConversationError(null);
			try {
				const data = await SupportChatService.getConversationMessages(conversationId);
				setConversations((prev) => {
					const next = prev.map((item) => (item.id === data.conversation.id ? data.conversation : item));
					return next;
				});
				setMessages(data.messages);
			} catch (err) {
				const message = err?.response?.data?.message ?? err?.message ?? "Không tải được cuộc trò chuyện";
				setConversationError(message);
				setMessages([]);
			} finally {
				setConversationLoading(false);
			}
		},
		[]
	);

	useEffect(() => {
		refreshConversations();
	}, [refreshConversations]);

	useEffect(() => {
		if (selectedConversationId) {
			loadConversation(selectedConversationId);
		}
	}, [selectedConversationId, loadConversation]);

	useEffect(() => {
		const socket = ensureSocket();

		const handleMessage = (payload) => {
			if (!payload) return;
			let found = false;
			setConversations((prev) =>
				prev.map((item) => {
					if (item.id === payload.conversationId) {
						found = true;
						return { ...item, lastMessageAt: payload.createdAt };
					}
					return item;
				})
			);

			if (!found) {
				refreshConversations();
			}

			if (payload.conversationId === selectedConversationId) {
				appendMessage(payload);
			}
		};

		const handleStatus = (payload) => {
			if (!payload) return;
			setConversations((prev) => prev.map((item) => (item.id === payload.id ? payload : item)));
		};

		socket.on("support_message", handleMessage);
		socket.on("support_status", handleStatus);

		if (!socket.connected) {
			socket.connect();
		}

		return () => {
			socket.off("support_message", handleMessage);
			socket.off("support_status", handleStatus);
		};
	}, [appendMessage, ensureSocket, refreshConversations, selectedConversationId]);

	useEffect(() => {
		return () => {
			disconnectSocket();
		};
	}, [disconnectSocket]);

	useEffect(() => {
		const socket = socketRef.current;
		if (!socket) {
			return;
		}
		const convoId = selectedConversation?.id;
		if (!convoId) {
			return;
		}

		socket.emit("join_conversation", { conversationId: convoId });

		return () => {
			socket.emit("leave_conversation", { conversationId: convoId });
		};
	}, [selectedConversation?.id]);

	useEffect(() => {
		const container = chatMessagesRef.current;
		if (!container) {
			return;
		}
		container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
	}, [messages]);

	const handleSendMessage = async (event) => {
		event.preventDefault();
		if (!selectedConversationId) {
			return;
		}
		const content = messageInput.trim();
		if (!content || sending) {
			return;
		}

		setSending(true);
		try {
			const { message, conversation } = await SupportChatService.sendStaffMessage(
				selectedConversationId,
				content
			);
			if (message) {
				appendMessage(message);
			}
			if (conversation) {
				setConversations((prev) => prev.map((item) => (item.id === conversation.id ? conversation : item)));
			}
			setConversationError(null);
			setMessageInput("");
		} catch (err) {
			const message = err?.response?.data?.message ?? err?.message ?? "Không gửi được tin nhắn";
			setConversationError(message);
		} finally {
			setSending(false);
		}
	};

	const handleStatusChange = async (status) => {
		if (!selectedConversationId || statusUpdating) {
			return;
		}
		setStatusUpdating(true);
		try {
			const updated = await SupportChatService.updateStatus(selectedConversationId, status);
			setConversations((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
			setConversationError(null);
		} catch (err) {
			const message = err?.response?.data?.message ?? err?.message ?? "Không cập nhật được trạng thái";
			setConversationError(message);
		} finally {
			setStatusUpdating(false);
		}
	};

	const handleDeleteConversation = async (conversationId) => {
		if (!conversationId || deletingConversationId === conversationId) {
			return;
		}
		const confirmed = await toast.confirm("Bạn có chắc muốn xóa cuộc trò chuyện này?", { type: 'danger', confirmText: 'Xóa', cancelText: 'Hủy' });
		if (!confirmed) {
			return;
		}
		setConversationsError(null);
		setConversationError(null);
		setDeletingConversationId(conversationId);
		try {
			await SupportChatService.deleteConversation(conversationId);
			setConversations((prev) => prev.filter((item) => item.id !== conversationId));
			if (selectedConversationId === conversationId) {
				setSelectedConversationId(null);
				setMessages([]);
			}
			await refreshConversations();
		} catch (err) {
			const message = err?.response?.data?.message ?? err?.message ?? "Không xóa được cuộc trò chuyện";
			setConversationError(message);
		} finally {
			setDeletingConversationId(null);
		}
	};

	const handleSelectConversation = (conversationId) => {
		setConversationError(null);
		setSelectedConversationId(conversationId);
	};

	return (
		<div className="messages-page py-4">
			<div className="messages-container">
				<div className="messages-layout">
					<aside className="messages-sidebar">
						<div className="messages-header d-flex align-items-center justify-content-between">
							<div>
								<h2 className="h5 mb-1">Cuộc trò chuyện</h2>
								<p className="mb-0 text-muted small">Quản lý và phản hồi khách hàng</p>
							</div>
							<button
								type="button"
								className="btn btn-sm btn-outline-secondary"
								onClick={refreshConversations}
								disabled={loadingConversations}
							>
								Làm mới
							</button>
						</div>

						<div className="conversations-list">
							{loadingConversations ? (
								<div className="p-4 text-center text-muted">Đang tải...</div>
							) : conversationsError ? (
								<div className="p-4 text-center text-danger">{conversationsError}</div>
							) : !sortedConversations.length ? (
								<div className="p-4 text-center text-muted">Chưa có cuộc trò chuyện nào</div>
							) : (
								sortedConversations.map((conversation) => {
									const active = conversation.id === selectedConversationId;
									return (
										<button
											key={conversation.id}
											type="button"
											className={`conversation-item text-start ${active ? "active" : ""}`}
											onClick={() => handleSelectConversation(conversation.id)}
										>
											<div className="conversation-info">
												<h6 className="conversation-name mb-1">
													{conversation.customer?.name ?? "Người dùng"}
												</h6>
												<p className="conversation-preview mb-1">
													{conversation.customer?.email || "Chưa có email"}
												</p>
												<div className="conversation-footer">
													  <span>{formatDateTime(conversation.lastMessageAt) || "Chưa có tin"}</span>
													<span className="badge bg-secondary">{statusLabel(conversation.status)}</span>
												</div>
											</div>
										</button>
									);
								})
							)}
						</div>
					</aside>

					<section className="chat-area">
						{!selectedConversation && !conversationLoading ? (
							<div className="empty-chat">
								<div className="empty-icon">
									<i className="bi bi-chat-dots" aria-hidden="true" />
								</div>
								<h3 className="h5 mb-2">Chọn một cuộc trò chuyện</h3>
								<p className="text-muted mb-0">Hãy chọn khách hàng ở danh sách bên trái để xem chi tiết.</p>
							</div>
						) : (
							<div className="active-chat">
								<div className="chat-header">
									<div className="chat-user-info">
										<div className="chat-details">
											<h6 className="mb-1">
												{selectedConversation ? selectedConversation.customer?.name ?? "Người dùng" : "Đang tải..."}
											</h6>
											{selectedConversation?.customer?.email && (
												<p className="mb-0">{selectedConversation.customer.email}</p>
											)}
										</div>
									</div>
									<div className="d-flex align-items-center gap-2">
										<div className="btn-group">
											{STATUS_OPTIONS.map((option) => (
												<button
													key={option.value}
													type="button"
													className={`btn btn-sm ${
														selectedConversation?.status === option.value ? "btn-primary" : "btn-outline-primary"
													}`}
													onClick={() => handleStatusChange(option.value)}
													disabled={statusUpdating || !selectedConversation}
												>
													{option.label}
												</button>
											))}
										</div>
										<button
											type="button"
											className="btn btn-sm btn-outline-danger"
											onClick={() => handleDeleteConversation(selectedConversationId)}
											disabled={!selectedConversationId || deletingConversationId === selectedConversationId}
										>
											{deletingConversationId === selectedConversationId ? "Đang xóa..." : "Xóa cuộc trò chuyện"}
										</button>
									</div>
								</div>

								{conversationError ? (
									<div className="chat-messages d-flex align-items-center justify-content-center" ref={chatMessagesRef}>
										<div className="alert alert-danger mb-0" role="alert">
											{conversationError}
										</div>
									</div>
								) : (
									<div className="chat-messages" ref={chatMessagesRef}>
										{conversationLoading ? (
											<div className="text-center text-muted py-5">Đang tải hội thoại...</div>
										) : (
											<>
												{messages.map((message) => {
													const isStaff = message.senderRole === "staff";
													return (
														<div
															key={message.id}
															className={`message ${isStaff ? "own-message" : ""}`}
														>
															<div className="message-bubble">
																<div className="fw-semibold mb-2">
																	{message.senderName ?? (isStaff ? "Bạn" : "Khách hàng")}
																</div>
																<div className="mb-2" style={{ whiteSpace: "pre-line" }}>
																	{message.content}
																</div>
																<div className="message-info justify-content-end">
																	<span>{formatTime(message.createdAt)}</span>
																</div>
															</div>
														</div>
													);
												})}
											</>
										)}
									</div>
								)}

								<div className="chat-input">
									<form onSubmit={handleSendMessage} className="message-input w-100">
										<div className="input-container">
											<textarea
												className="form-control border-0 bg-transparent"
												rows={2}
												placeholder="Nhập phản hồi..."
												value={messageInput}
												onChange={(event) => setMessageInput(event.target.value)}
												disabled={!selectedConversation || sending || conversationLoading}
												style={{ resize: "none" }}
											/>
											<button
												type="submit"
												className="btn btn-primary"
												disabled={!selectedConversation || sending || conversationLoading || !messageInput.trim()}
											>
												Gửi
											</button>
										</div>
									</form>
								</div>
							</div>
						)}
					</section>
				</div>
			</div>
		</div>
	);
};

export default MessagesPage;
