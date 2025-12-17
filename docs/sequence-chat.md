sequenceDiagram
    participant Learner
    participant LearnerUI as SupportChatWidget
    participant AuthController as SupportController
    participant SupportService
    participant ConvRepo as supportConversationRepo
    participant MsgRepo as supportMessageRepo
    participant DB
    participant SocketNS as /support-chat (server)
    participant StaffUI as AdminChatPanel
    participant StaffSocket as StaffSocket

    %% 1. Open / load session
    Learner->>LearnerUI: Open widget
    LearnerUI->>AuthController: GET /chat/session
    AuthController->>SupportService: getOrCreateUserSession(userId)
    SupportService->>ConvRepo: findActiveConversation(userId) / create if none
    ConvRepo->>DB: SELECT/INSERT conversation
    SupportService->>MsgRepo: load messages
    MsgRepo->>DB: SELECT messages
    SupportService-->>AuthController: {conversation, messages}
    AuthController-->>LearnerUI: 200 OK {conversation, messages}

    %% 2. Learner connects socket & joins room
    LearnerUI->>SocketNS: connect
    LearnerUI->>SocketNS: emit join_conversation {conversationId}
    SocketNS-->>LearnerUI: joined room ack

    %% 3. Learner sends message (REST path)
    Learner->>LearnerUI: type message -> Send
    LearnerUI->>AuthController: POST /chat/send {content}
    AuthController->>SupportService: sendUserMessage(userId, content)
    SupportService->>MsgRepo: create & save message
    MsgRepo->>DB: INSERT message
    SupportService->>ConvRepo: update lastMessageAt/status
    ConvRepo->>DB: UPDATE conversation
    SupportService->>SocketNS: emitSupportChatEvent(conversationId, "support_message", messageDTO)
    SupportService-->>AuthController: {conversation, message}
    AuthController-->>LearnerUI: 200 OK {message}

    %% 4. Staff receives message in real-time
    SocketNS--)StaffSocket: support_message (messageDTO)
    StaffSocket-->>StaffUI: display incoming message / bump list

    %% 5. Staff replies
    Staff->>StaffUI: compose reply -> Send
    StaffUI->>AuthController: POST /admin/chat/{conversationId}/message {content}
    AuthController->>SupportService: sendStaffMessage(conversationId, staffId, content)
    SupportService->>MsgRepo: create & save staff message
    MsgRepo->>DB: INSERT message
    SupportService->>ConvRepo: update assignee/lastMessageAt/status
    ConvRepo->>DB: UPDATE conversation
    SupportService->>SocketNS: emitSupportChatEvent(conversationId, "support_message", messageDTO)
    SupportService-->>AuthController: {conversation, message}
    AuthController-->>StaffUI: 200 OK {message}

    %% 6. Learner receives staff reply
    SocketNS--)LearnerUI: support_message (messageDTO)
    LearnerUI-->>LearnerUI: append message, mark unread if closed

    %% 7. Status updates (resolve/close)
    StaffUI->>AuthController: PATCH /admin/chat/{conversationId}/status {status}
    AuthController->>SupportService: updateConversationStatus(conversationId, staffId, status)
    SupportService->>ConvRepo: update status
    SupportService->>SocketNS: emitSupportChatEvent(conversationId, "support_status", conversationDTO)
    SocketNS--)LearnerUI: support_status (conversationDTO)
    SocketNS--)StaffSocket: support_status (conversationDTO)