const { createApp } = require('./app');
const { env } = require('./config/env');
const { initializeDatabase } = require('./config/database');
const chatRoutes = require('./routes/chatRoutes');
const integrationRoutes = require('./routes/integrationRoutes');

app.use('/api', integrationRoutes);
app.use('/api', chatRoutes);
const startServer = async () => {
  try {
    const database = await initializeDatabase();
    const app = createApp({ database });

    app.listen(env.port, '0.0.0.0', () => {
      console.log(`Mentora backend listening on port ${env.port} (${database.mode} mode)`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
