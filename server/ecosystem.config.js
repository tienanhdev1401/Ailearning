module.exports = {
  apps: [
    {
      name: "aelang-backend",
      script: "dist/main.js",
      autorestart: true,
      env: {
        NODE_ENV: "production",
      },
      pre_start: "npm install && npm run build",
    },
  ],
};
