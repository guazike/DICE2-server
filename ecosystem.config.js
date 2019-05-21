module.exports = {
  apps : [{
    name: 'betGames',
    script: 'BetGamesApp.js',
    cwd: '/root/zerodice/DICE2-server',

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    // args: 'one two',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '6G',
    log_date_format: 'YYYY-MM-DD HH:mm:ss ZZ',
    env: {
      PORT: 6769,
      NODE_ENV: 'development',
    },
    env_production: {
      PORT: 6769,
      NODE_ENV: 'production',
    }
  }
]
};
