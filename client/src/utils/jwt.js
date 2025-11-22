export const decodeToken = (token) => {
  if (!token) return null;
  try {
    const payloadPart = token.split(".")[1];
    const decoded = atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Token decode failed", error);
    return null;
  }
};
