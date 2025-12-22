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
        COOKIE_SECURE: "true",
        COOKIE_SAMESITE: "strict",
      },
    },
  ],
};
