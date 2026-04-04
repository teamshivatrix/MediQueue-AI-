const serverless = require('serverless-http');
const { app, initializeApp } = require('../../backend/server');

let isInitialized = false;
const expressHandler = serverless(app);

exports.handler = async (event, context) => {
  if (!isInitialized) {
    await initializeApp();
    isInitialized = true;
  }

  return expressHandler(event, context);
};
