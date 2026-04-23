module.exports = {
  apps: [{
    name: 'epaper-cms',
    script: '.next/standalone/server.js',
    cwd: '/home/newsone/epaper-final/epaper-final',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    
    node_args: '--max-old-space-size=1024',
    env_file: '/home/newsone/epaper-final/epaper-final/.env',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
