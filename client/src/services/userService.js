import api from '../api/api';
const userService = {
    sendVerificationCode: async (email) => {
        try {
        const response = await api.post("/auth/send-verification-code", { email });

        // Kiểm tra status code thành công (2xx)
        if (response.status >= 200 && response.status < 300) {
            return response.data;
        }

        // Nếu server trả về status code lỗi
        throw new Error(response.data.message || 'Lỗi không xác định khi gửi mã');
        } catch (error) {
        // Xử lý lỗi từ server hoặc lỗi mạng
        const errorMessage = error.response?.data?.error
            || error.response?.data?.message
            || 'Không thể kết nối đến server';

        throw new Error(errorMessage);
        }
    },

    getCurrentUser: async () => {
        try {
        const response = await api.get("/auth/me");
        return response.data;
        } catch (error) {
        const errorMessage = error.response?.data?.error
            || error.response?.data?.message
            || 'Không thể lấy thông tin người dùng';
        throw new Error(errorMessage);
        }
    },

    updateProfile: async (payload) => {
        try {
        const response = await api.patch("/auth/me", payload);
        return response.data;
        } catch (error) {
        const errorMessage = error.response?.data?.error
            || error.response?.data?.message
            || 'Không thể cập nhật hồ sơ';
        throw new Error(errorMessage);
        }
    },

    uploadAvatar: async (file, folder) => {
        const formData = new FormData();
        formData.append('avatar', file);
        if (folder) {
            formData.append('folder', folder);
        }

        try {
            const response = await api.post('/uploads/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.error
                || error.response?.data?.message
                || 'Không thể tải ảnh lên';
            throw new Error(errorMessage);
        }
    },

    
    resetPassword: async ({ email, otp, newPassword }) => {
        try {
        const response = await api.post("/auth/reset-password", {
            email,
            otp,
            newPassword
        });
        if (response.status >= 200 && response.status < 300) {
            return response.data;
        }
        throw new Error(response.data.message || 'Đổi mật khẩu thất bại');
        } catch (error) {
        const errorMessage = error.response?.data?.error
            || error.response?.data?.message
            || 'Không thể kết nối đến server';
        throw new Error(errorMessage);
        }
    }
};
 
export default userService;