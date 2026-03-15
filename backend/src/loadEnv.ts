/**
 * Load .env before any other module reads process.env.
 * Must be imported first in the entry point.
 */
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });
