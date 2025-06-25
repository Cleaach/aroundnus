const serverlessExpress = require('@vendia/serverless-express');
const app = require('../index'); // Import your Express app
module.exports = serverlessExpress({ app });
