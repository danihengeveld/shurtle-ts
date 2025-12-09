import { db } from '@/db';
import { shurtles } from '@/db/schema';
import { lt, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * This API route is used to clean up expired Shurtles. It is intended to be called by a cron job.
 * It checks for the presence of an Authorization header with a specific secret.
 * If the header is valid, it deletes all shurtles that have an expiresAt date in the past.
 */
export async function GET(req: NextRequest) {
  console.info('Cleanup cron job started');
  const authHeader = req.headers.get('Authorization');

  // Check for the presence of the Authorization header
  if (!authHeader) {
    console.warn('Unauthorized cleanup attempt: Missing Authorization header');
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Check for the correct authorization header
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('Unauthorized cleanup attempt: Invalid Authorization token');
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Perform the cleanup operation
  // This will delete all shurtles that have an expiresAt date in the past
  // and return the count of deleted rows.
  try {
    console.info('Executing expired shurtles cleanup');
    const { rowCount } = await cleanupExpiredShurtlesPrepared.execute()
    
    console.info(`Cleanup completed: ${rowCount} expired shurtles deleted`);
    return NextResponse.json({
      success: true,
      deleted: rowCount
    })
  } catch (error) {
    console.error('Error during cleanup:', error);
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

const cleanupExpiredShurtlesPrepared = db.delete(shurtles)
  .where(lt(shurtles.expiresAt, sql`NOW()`))
  .prepare('cleanupExpiredShurtles')