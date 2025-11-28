import { useEffect } from "react";

const TawkChat = () => {
  useEffect(() => {
    const propertyId = process.env.REACT_APP_TAWK_PROPERTY_ID;
    const widgetId = process.env.REACT_APP_TAWK_WIDGET_ID;

    if (!propertyId) {
      if (process.env.NODE_ENV === "development") {
        // Helps developers configure the env vars before shipping
        console.warn("TawkChat: missing REACT_APP_TAWK_PROPERTY_ID.");
      }
      return undefined;
    }

    const script = document.createElement("script");
    script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    script.async = true;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      const iframe = document.querySelector('iframe[src*="tawk.to"]');
      if (iframe && iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };
  }, []);

  return null;
};

export default TawkChat;
