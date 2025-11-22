export const NAV_PRIMARY = [
  { label: 'Dashboard', icon: 'bi-speedometer2', path: '/admin' },
  { label: 'Users', icon: 'bi-people', path: '/admin/users' },
  { label: 'Reports', icon: 'bi-file-earmark-text', path: '/admin/reports' },
  { label: 'Messages', icon: 'bi-chat-dots', path: '/admin/messages', badge: { text: '3', variant: 'bg-danger' } },
  { label: 'Calendar', icon: 'bi-calendar-event', path: '/admin/calendar' },
  { label: 'Roadmap', icon: 'bi-map', path: '/admin/roadmaps' }
];

export const NAV_ADMIN = [];

export const SEARCH_INDEX = [
  { title: 'Dashboard', path: '/admin', type: 'Page' },
  { title: 'Users', path: '/admin/users', type: 'Page' },
  { title: 'Reports', path: '/admin/reports', type: 'Page' },
  { title: 'Messages', path: '/admin/messages', type: 'Page' },
  { title: 'Calendar', path: '/admin/calendar', type: 'Page' },
  { title: 'Roadmaps', path: '/admin/roadmaps', type: 'Page' }
];
