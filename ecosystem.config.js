module.exports = {
    apps: [
      {
        name: 'infinity_dialog_api',
        script: 'dist/src/main.js',
        instances: 1,
        autorestart: true,
        watch: false,
        env: {
          NODE_ENV: 'production',
        },
        port: 4000,
      },
    ],
  };
    