# PM2 配置文件
# 文档: https://pm2.keymetrics.io/docs/usage/application-declaration/

module.exports = {
  apps: [
    {
      name: 'wine-mall-api',
      script: 'server/index.ts',
      interpreter: 'tsx',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      // 日志配置
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // 重启策略
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 1000
    }
  ]
};