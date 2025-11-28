const warn = () => {
  if (process.env.NODE_ENV !== "production") {
    console.warn("ChatService has been removed. Please migrate integrations to Tawk.to.");
  }
  throw new Error("ChatService is no longer available");
};

export const ChatService = {
  getConversations: warn,
  getMessages: warn,
};
