import api from '../api/api';
const userService = {
    sendVerificationCode: async (email) => {
        try {
        const response = await api.post("/users/send-verification-code", { email });

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

    
    resetPassword: async ({ email, otp, newPassword }) => {
        try {
        const response = await api.post("/users/reset-password", {
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