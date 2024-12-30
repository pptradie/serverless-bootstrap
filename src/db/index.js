"use strict";

const { Sequelize } = require("sequelize");
const { applyExtraSetup } = require("./extra-setup");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    timezone: "Australia/Sydney",
    pool: {
      /*
       * Lambda functions process one request at a time but your code may issue multiple queries
       * concurrently. Be wary that `sequelize` has methods that issue 2 queries concurrently
       * (e.g. `Model.findAndCountAll()`). Using a value higher than 1 allows concurrent queries to
       * be executed in parallel rather than serialized. Careful with executing too many queries in
       * parallel per Lambda function execution since that can bring down your database with an
       * excessive number of connections.
       *
       * Ideally you want to choose a `max` number where this holds true:
       * max * EXPECTED_MAX_CONCURRENT_LAMBDA_INVOCATIONS < MAX_ALLOWED_DATABASE_CONNECTIONS * 0.8
       */
      max: 2,
      /*
       * Set this value to 0 so connection pool eviction logic eventually cleans up all connections
       * in the event of a Lambda function timeout.
       */
      min: 0,
      /*
       * Set this value to 0 so connections are eligible for cleanup immediately after they're
       * returned to the pool.
       */
      idle: 0,
      // Choose a small enough value that fails fast if a connection takes too long to be established.
      acquire: 3000,
      /*
       * Ensures the connection pool attempts to be cleaned up automatically on the next Lambda
       * function invocation, if the previous invocation timed out.
       */
      evict: 10000,
    },
    // logging: (msg) => {
    //   console.log("DB Query ::: ", msg);
    // },
    logging: false,
  }
);

const modelDefiners = [
  require("./models/deal.model"),
  require("./models/deal_note.model"),
];

// We define all models according to their files.
for (const modelDefiner of modelDefiners) {
  modelDefiner(sequelize);
}

// We execute any extra setup after the models are defined, such as adding associations.
applyExtraSetup(sequelize);

// We export the sequelize connection instance to be used around our app.
module.exports = sequelize;
