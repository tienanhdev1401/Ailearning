const dashboardNav = { label: 'Dashboard', icon: 'bi-speedometer2', path: '/admin' };

const secondaryNav = [
  // { label: 'Reports', icon: 'bi-file-earmark-text', path: '/admin/reports' },
  { label: 'Chat', icon: 'bi-chat-dots', path: '/admin/messages' },
  // { label: 'Calendar', icon: 'bi-calendar-event', path: '/admin/calendar' },
  { label: 'Roadmap', icon: 'bi-map', path: '/admin/roadmaps' },
  { label: 'Video Lesson', icon: 'bi-youtube', path: '/admin/lessons' },
];

const makeUserNavItem = (role) => {
  if (role === 'admin') {
    return {
      label: 'User',
      icon: 'bi-people',
      submenuId: 'users-management',
      children: [
        { label: 'Learner', icon: 'bi-people', path: '/admin/users' },
        { label: 'Staff', icon: 'bi-person-badge', path: '/admin/staff' }
      ]
    };
  }

  return { label: 'Users', icon: 'bi-people', path: '/admin/users' };
};

const baseSearchIndex = [
  { title: 'Dashboard', path: '/admin', type: 'Page' },
  // { title: 'Reports', path: '/admin/reports', type: 'Page' },
  { title: 'Chat', path: '/admin/messages', type: 'Page' },
  // { title: 'Calendar', path: '/admin/calendar', type: 'Page' },
  { title: 'Roadmaps', path: '/admin/roadmaps', type: 'Page' },
  { title: 'Video Lessons', path: '/admin/lessons', type: 'Page' }
];

export const buildNavigation = (role) => {
  const primary = [dashboardNav, makeUserNavItem(role), ...secondaryNav];
  const admin = [];

  const searchIndex = [
    { title: 'Users', path: '/admin/users', type: 'Page' },
    ...(role === 'admin' ? [{ title: 'Staff', path: '/admin/staff', type: 'Page' }] : []),
    ...baseSearchIndex
  ];

  return {
    primary,
    admin,
    searchIndex
  };
};
