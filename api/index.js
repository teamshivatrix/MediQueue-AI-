const { app, initializeApp } = require('../backend/server');

module.exports = async (req, res) => {
  await initializeApp();
  return app(req, res);
};
