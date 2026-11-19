const config = require('./config');
const { createApp, initializeDatabase } = require('./app');
const app = createApp();

// Vercel imports this Express app as a function. Local development still starts a listener.
if (require.main === module) {
  initializeDatabase()
    .then(() => app.listen(config.port, () => console.log(`API listening on http://localhost:${config.port}`)))
    .catch((err) => {
      console.error('Failed to start:', err.message);
      process.exit(1);
    });
}

module.exports = app;
