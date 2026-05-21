import React from 'react';
import { Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const TermsOfServicePage = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    // Kiểm tra xem có lịch sử duyệt web trước đó trong ứng dụng không (React Router v6)
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      // Nếu không có, thử đóng tab (khi mở ở tab mới)
      window.close();
      // Fallback nếu trình duyệt không cho phép đóng tab
      navigate('/login');
    }
  };

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', padding: '40px 0' }}>
      <Container style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', maxWidth: '800px' }}>
        <button 
          onClick={handleBack} 
          style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 'bold', marginBottom: '20px', cursor: 'pointer', padding: 0 }}
        >
          &larr; Quay lại
        </button>
        <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#333', fontWeight: 'bold' }}>Điều Khoản Dịch Vụ</h1>
        
        <section style={{ marginBottom: '24px' }}>
          <h4 style={{ color: '#444', fontWeight: 'bold' }}>1. Chấp nhận điều khoản</h4>
          <p style={{ lineHeight: '1.6', color: '#555' }}>
            Bằng việc truy cập và sử dụng ứng dụng AelanG, bạn đồng ý tuân thủ các điều khoản và điều kiện dưới đây. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, vui lòng không sử dụng dịch vụ của chúng tôi.
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h4 style={{ color: '#444', fontWeight: 'bold' }}>2. Mô tả dịch vụ</h4>
          <p style={{ lineHeight: '1.6', color: '#555' }}>
            AelanG cung cấp nền tảng học tiếng Anh trực tuyến với sự hỗ trợ của AI, bao gồm nhưng không giới hạn ở các tính năng luyện nghe, nói, đọc, viết, flashcard và theo dõi tiến độ. Chúng tôi có quyền sửa đổi, tạm ngưng hoặc ngừng cung cấp dịch vụ bất cứ lúc nào mà không cần thông báo trước.
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h4 style={{ color: '#444', fontWeight: 'bold' }}>3. Tài khoản người dùng</h4>
          <ul style={{ lineHeight: '1.6', color: '#555', paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}>Bạn cam kết cung cấp thông tin chính xác và đầy đủ khi đăng ký tài khoản.</li>
            <li style={{ marginBottom: '8px' }}>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động diễn ra dưới tài khoản của mình.</li>
            <li style={{ marginBottom: '8px' }}>AelanG có quyền khóa tài khoản nếu phát hiện hành vi gian lận, vi phạm pháp luật hoặc vi phạm các điều khoản này.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h4 style={{ color: '#444', fontWeight: 'bold' }}>4. Quyền sở hữu trí tuệ</h4>
          <p style={{ lineHeight: '1.6', color: '#555' }}>
            Toàn bộ nội dung, tài liệu, bài giảng và phần mềm trên AelanG thuộc quyền sở hữu của chúng tôi và được bảo vệ bởi luật sở hữu trí tuệ. Bạn không được phép sao chép, phân phối hoặc sử dụng cho mục đích thương mại khi chưa có sự cho phép bằng văn bản.
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h4 style={{ color: '#444', fontWeight: 'bold' }}>5. Chính sách thanh toán và hoàn tiền</h4>
          <p style={{ lineHeight: '1.6', color: '#555' }}>
            Các gói đăng ký và dịch vụ trả phí sẽ được thanh toán qua các cổng thanh toán được hỗ trợ. Chúng tôi không áp dụng chính sách hoàn tiền sau khi giao dịch đã được xác nhận thành công, trừ trường hợp lỗi hệ thống từ phía AelanG.
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h4 style={{ color: '#444', fontWeight: 'bold' }}>6. Chính sách bảo mật</h4>
          <p style={{ lineHeight: '1.6', color: '#555' }}>
            Việc thu thập và sử dụng thông tin cá nhân của bạn được quy định chi tiết trong Chính sách Bảo mật của chúng tôi. Bằng việc sử dụng dịch vụ, bạn đồng ý với việc thu thập và sử dụng dữ liệu theo chính sách này.
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h4 style={{ color: '#444', fontWeight: 'bold' }}>7. Thay đổi điều khoản</h4>
          <p style={{ lineHeight: '1.6', color: '#555' }}>
            Chúng tôi có thể cập nhật Điều Khoản Dịch Vụ này theo thời gian. Các thay đổi sẽ có hiệu lực ngay khi được đăng tải trên trang web hoặc ứng dụng. Việc bạn tiếp tục sử dụng dịch vụ sau khi có thay đổi đồng nghĩa với việc bạn chấp nhận các điều khoản mới.
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h4 style={{ color: '#444', fontWeight: 'bold' }}>8. Liên hệ</h4>
          <p style={{ lineHeight: '1.6', color: '#555' }}>
            Nếu bạn có bất kỳ câu hỏi nào về Điều Khoản Dịch Vụ này, vui lòng liên hệ với chúng tôi qua email: support@aelang.com.
          </p>
        </section>
        
        <p style={{ textAlign: 'center', marginTop: '40px', color: '#888', fontSize: '14px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
        </p>
      </Container>
    </div>
  );
};

export default TermsOfServicePage;
