import React from "react";

const TAWK_DASHBOARD_URL = "https://dashboard.tawk.to/#/dashboard/6929ba072912be196153122f";

const MessagesPage = () => {
	const handleOpenDashboard = () => {
		window.open(TAWK_DASHBOARD_URL, "_blank", "noopener,noreferrer");
	};

	return (
		<div className="container py-5">
			<div className="row justify-content-center">
				<div className="col-lg-6">
					<div className="card shadow-sm border-0">
						<div className="card-body text-center p-5">
							<h1 className="h3 mb-3">Quản lý Hỗ trợ Trực tuyến</h1>
							<div className="d-flex justify-content-center gap-3">
								<button type="button" className="btn btn-success" onClick={handleOpenDashboard}>
									Mở Tawk.to Dashboard
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default MessagesPage;
