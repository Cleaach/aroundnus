const serverlessExpress = require('@vendia/serverless-express');
const app = require('../backend/index');

module.exports = serverlessExpress({ app });
