import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "./schema";

const isDev = process.env.NODE_ENV === 'development'
export const db = drizzle(process.env.POSTGRES_URL!, { schema, logger: isDev })