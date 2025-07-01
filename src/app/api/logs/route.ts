import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

/**
 * This endpoint receives logs from the client and forwards them to the server logger
 * This is useful for tracking client-side events, errors, and user interactions
 */
export async function POST(req: NextRequest) {
  try {
    const logEvent = await req.json();
    
    // Log the event using the appropriate level
    switch (logEvent.level) {
      case 'info':
        logger.info(`[Client] ${logEvent.message}`, logEvent.data);
        break;
      case 'warn':
        logger.warn(`[Client] ${logEvent.message}`, logEvent.data);
        break;
      case 'debug':
        logger.debug(`[Client] ${logEvent.message}`, logEvent.data);
        break;
      case 'error':
        logger.error(`[Client] ${logEvent.message}`, logEvent.data);
        break;
      default:
        logger.info(`[Client] ${logEvent.message}`, logEvent.data);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error processing client log:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
