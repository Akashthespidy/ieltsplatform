import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/linguatrack";

// Safe postgres connection client for serverless/pooled connections
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
