/**
 * PM2 process file for production (EC2).
 * Usage: pm2 start ecosystem.config.cjs
 *
 * Load env from .env on the server (or use pm2 ecosystem env / dotenv-cli).
 */
module.exports = {
  apps: [
    {
      name: "gmb-app",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: process.env.PM2_MAX_MEMORY || "900M",
      kill_timeout: 10_000,
      wait_ready: false,
      listen_timeout: 30_000,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
