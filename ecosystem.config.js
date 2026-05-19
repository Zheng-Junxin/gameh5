module.exports = {
  apps: [{
    name: 'gameh5',
    script: 'server.js',
    cwd: '/home/ubuntu/gameh5',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 80
    },
    // Auto restart if memory exceeds 200M
    max_memory_restart: '200M',
    // Log config
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/home/ubuntu/gameh5/logs/error.log',
    out_file: '/home/ubuntu/gameh5/logs/out.log',
    merge_logs: true,
    // Restart if app crashes
    autorestart: true,
    max_restarts: 10,
    restart_delay: 1000
  }]
};
