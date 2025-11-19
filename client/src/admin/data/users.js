export const INITIAL_USERS = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    status: 'active',
    lastActive: '2 minutes ago',
    joinDate: '2023-01-15',
    avatar: '/assets/images/avatar-placeholder.svg',
    phone: '+1 (555) 123-4567',
    department: 'Engineering'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
    status: 'active',
    lastActive: '1 hour ago',
    joinDate: '2023-02-20',
    avatar: '/assets/images/avatar-placeholder.svg',
    phone: '+1 (555) 987-6543',
    department: 'Marketing'
  },
  {
    id: 3,
    name: 'Mike Johnson',
    email: 'mike@example.com',
    role: 'moderator',
    status: 'pending',
    lastActive: '1 day ago',
    joinDate: '2023-03-10',
    avatar: '/assets/images/avatar-placeholder.svg',
    phone: '+1 (555) 456-7890',
    department: 'Support'
  },
  {
    id: 4,
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    role: 'user',
    status: 'active',
    lastActive: '5 minutes ago',
    joinDate: '2023-04-05',
    avatar: '/assets/images/avatar-placeholder.svg',
    phone: '+1 (555) 321-0987',
    department: 'Sales'
  },
  {
    id: 5,
    name: 'Bob Brown',
    email: 'bob@example.com',
    role: 'user',
    status: 'inactive',
    lastActive: '1 week ago',
    joinDate: '2023-01-30',
    avatar: '/assets/images/avatar-placeholder.svg',
    phone: '+1 (555) 654-3210',
    department: 'HR'
  },
  {
    id: 6,
    name: 'Alice Davis',
    email: 'alice@example.com',
    role: 'admin',
    status: 'active',
    lastActive: '30 minutes ago',
    joinDate: '2022-12-01',
    avatar: '/assets/images/avatar-placeholder.svg',
    phone: '+1 (555) 789-0123',
    department: 'Engineering'
  },
  {
    id: 7,
    name: 'Tom Miller',
    email: 'tom@example.com',
    role: 'user',
    status: 'active',
    lastActive: '3 hours ago',
    joinDate: '2023-05-15',
    avatar: '/assets/images/avatar-placeholder.svg',
    phone: '+1 (555) 147-2580',
    department: 'Design'
  },
  {
    id: 8,
    name: 'Lisa Garcia',
    email: 'lisa@example.com',
    role: 'moderator',
    status: 'active',
    lastActive: '1 hour ago',
    joinDate: '2023-03-25',
    avatar: '/assets/images/avatar-placeholder.svg',
    phone: '+1 (555) 369-1470',
    department: 'Support'
  }
];

export const RECENT_USER_ACTIVITIES = [
  {
    id: 1,
    user: 'John Doe',
    action: 'Đăng nhập',
    time: '2 phút trước',
    type: 'login',
    icon: 'bi-box-arrow-in-right',
    details: 'Đăng nhập từ Chrome (Windows)'
  },
  {
    id: 2,
    user: 'Jane Smith',
    action: 'Cập nhật hồ sơ',
    time: '1 giờ trước',
    type: 'update',
    icon: 'bi-person-gear',
    details: 'Thay đổi thông tin liên hệ'
  },
  {
    id: 3,
    user: 'Mike Johnson',
    action: 'Tạo tài khoản',
    time: '1 ngày trước',
    type: 'create',
    icon: 'bi-person-plus',
    details: 'Kích hoạt tài khoản mới'
  },
  {
    id: 4,
    user: 'Sarah Wilson',
    action: 'Đổi mật khẩu',
    time: '2 ngày trước',
    type: 'security',
    icon: 'bi-shield-lock',
    details: 'Đổi mật khẩu định kỳ'
  },
  {
    id: 5,
    user: 'Bob Brown',
    action: 'Đăng xuất',
    time: '1 tuần trước',
    type: 'logout',
    icon: 'bi-box-arrow-right',
    details: 'Đăng xuất trên tất cả thiết bị'
  }
];

export const SYSTEM_ALERTS = [
  {
    id: 1,
    title: 'Cảnh báo đăng ký',
    message: 'Người dùng mới cần được duyệt thủ công',
    type: 'warning',
    time: '5 phút trước'
  },
  {
    id: 2,
    title: 'Sao lưu hoàn tất',
    message: 'Sao lưu hệ thống đã chạy thành công',
    type: 'success',
    time: '1 giờ trước'
  },
  {
    id: 3,
    title: 'Thông báo bảo trì',
    message: 'Database sẽ bảo trì lúc 23:00',
    type: 'info',
    time: '2 giờ trước'
  }
];

export const ACTIVE_RATE_SERIES = [65, 70, 80, 85, 90, 95, 88];
export const USER_GROWTH_SERIES = [5, 8, 12, 15, 10, 18, 22];
export const USER_GROWTH_CATEGORIES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
