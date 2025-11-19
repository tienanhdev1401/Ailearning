export const EMOJIS = ['😀', '😃', '😄', '😁', '😊', '😍', '🥰', '😘', '👍', '👏', '🎉', '❤️', '🔥', '💯', '😂', '🤔'];

const baseAvatar = '/assets/images/avatar-placeholder.svg';

export const INITIAL_CONVERSATIONS = [
  {
    id: 'john-smith',
    name: 'John Smith',
    avatar: baseAvatar,
    type: 'Customer',
    online: true,
    lastMessage: 'Thank you for the quick response!',
    lastMessageTime: '2m ago',
    lastSeen: '2m ago',
    unread: 2,
    messages: [
      { id: 'js-1', text: 'Hi! I have a question about my recent order.', time: '10:30 AM', sent: false },
      { id: 'js-2', text: "Hello John! I'd be happy to help you with your order. What seems to be the issue?", time: '10:32 AM', sent: true },
      { id: 'js-3', text: "I haven't received a tracking number yet, and it's been 3 days since I placed the order.", time: '10:33 AM', sent: false },
      { id: 'js-4', text: 'Let me check that for you right away. Can you please provide your order number?', time: '10:35 AM', sent: true },
      { id: 'js-5', text: "Sure! It's ORD-2025-001", time: '10:36 AM', sent: false },
      { id: 'js-6', text: 'Perfect! It was shipped yesterday and the tracking number is TR123456789.', time: '10:38 AM', sent: true },
      { id: 'js-7', text: 'Thank you for the quick response!', time: '10:40 AM', sent: false }
    ]
  },
  {
    id: 'sarah-johnson',
    name: 'Sarah Johnson',
    avatar: baseAvatar,
    type: 'Team',
    online: true,
    lastMessage: 'The new dashboard looks great!',
    lastMessageTime: '1h ago',
    lastSeen: '45m ago',
    unread: 1,
    messages: [
      { id: 'sj-1', text: 'Hey! Can you review the new dashboard design when you get a chance?', time: '9:15 AM', sent: false },
      { id: 'sj-2', text: "Absolutely! Let me take a look now.", time: '9:18 AM', sent: true },
      { id: 'sj-3', text: 'The new dashboard looks great! I love the updated charts and the clean layout.', time: '9:45 AM', sent: false }
    ]
  },
  {
    id: 'mike-davis',
    name: 'Mike Davis',
    avatar: baseAvatar,
    type: 'Vendor',
    online: false,
    lastMessage: "I'll get back to you with the pricing.",
    lastMessageTime: '3h ago',
    lastSeen: '2h ago',
    unread: 0,
    messages: [
      { id: 'md-1', text: "Hi Mike! We're looking to place a bulk order. Can you send us a quote?", time: '8:30 AM', sent: true },
      { id: 'md-2', text: 'Sure thing! What quantities are you looking at?', time: '8:45 AM', sent: false },
      { id: 'md-3', text: 'We need about 500 units of the premium package.', time: '8:47 AM', sent: true },
      { id: 'md-4', text: "I'll get back to you with the pricing.", time: '8:50 AM', sent: false }
    ]
  },
  {
    id: 'emily-brown',
    name: 'Emily Brown',
    avatar: baseAvatar,
    type: 'Customer',
    online: false,
    lastMessage: 'Perfect, thanks!',
    lastMessageTime: '1d ago',
    lastSeen: '18h ago',
    unread: 0,
    messages: [
      { id: 'eb-1', text: 'Is there a way to cancel my subscription?', time: 'Yesterday 2:30 PM', sent: false },
      { id: 'eb-2', text: 'Yes, you can cancel anytime from your account settings. Need me to guide you?', time: 'Yesterday 2:35 PM', sent: true },
      { id: 'eb-3', text: 'That would be great, thank you!', time: 'Yesterday 2:36 PM', sent: false },
      { id: 'eb-4', text: "Go to Settings > Billing > Cancel Subscription. You'll see a red button at the bottom.", time: 'Yesterday 2:37 PM', sent: true },
      { id: 'eb-5', text: 'Perfect, thanks!', time: 'Yesterday 2:40 PM', sent: false }
    ]
  },
  {
    id: 'david-wilson',
    name: 'David Wilson',
    avatar: baseAvatar,
    type: 'Support',
    online: true,
    lastMessage: 'The issue has been resolved.',
    lastMessageTime: '2d ago',
    lastSeen: '1d ago',
    unread: 0,
    messages: [
      { id: 'dw-1', text: "We've received reports of slow loading times on the dashboard.", time: '2 days ago', sent: false },
      { id: 'dw-2', text: "Thanks for reporting this. I'll investigate right away.", time: '2 days ago', sent: true },
      { id: 'dw-3', text: 'The issue has been resolved.', time: '2 days ago', sent: false }
    ]
  }
];

export const QUICK_RESPONSES = [
  'Thanks for the update! 🙌',
  "I'll look into this right away.",
  'Can we schedule a quick call tomorrow?',
  'Appreciate the context — talk soon!'
];
