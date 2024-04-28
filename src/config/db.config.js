// src/config/db/connection.js
import mongoose from 'mongoose';
import { DB_URI } from './app.config';

/**
 * Establishes a connection to the MongoDB database.
 *
 * @param {string} [DB_URI] - The URI of the database to connect to. If not provided, the default URI from the app configuration is used.
 * @throws {Error} Throws an error if the database connection fails.
 */
const connect = async (URI) => {
  let databaseURI = URI || DB_URI;
  try {
    await mongoose.connect(databaseURI);
  } catch (err) {
    console.error('Database connection error');
    throw err;
  }
};

/**
 * Closes the connection to the MongoDB database.
 *
 * @throws {Error} Throws an error if the database disconnection fails.
 */
const disconnect = async () => {
  try {
    await mongoose.connection.close();
    console.log('Database disconnected');
  } catch (err) {
    console.error('Database disconnection error');
    throw err;
  }
};

export { connect, disconnect };
