module.exports = {
  apps: [
    {
      name: "aelang-backend",
      cwd: __dirname,
      script: "npm",
      args: "run start:prod",
      autorestart: true,
      env: {
        NODE_ENV: "production",
        PORT: "5000",
        CORS_ORIGINS: "https://app.aelang.online",
        FRONTEND_URL: "https://app.aelang.online",
        PUBLIC_API_URL: "https://api.aelang.online",
        COOKIE_SECURE: "true",
        COOKIE_SAMESITE: "strict",

        // Internal model services running on VPS (Docker published to 127.0.0.1)
        GRAMMAR_SERVICE_URL: "http://127.0.0.1:5001",
        GOP_MODEL_URL: "http://127.0.0.1:5005",
      },
    },
  ],
};
