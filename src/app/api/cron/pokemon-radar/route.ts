import { NextRequest, NextResponse } from 'next/server';
import { getAllActiveRadarSubscribers, updateRadarLastAlert } from '@/lib/firestore/radar';
import { generateRealisticHotspotSpawn } from '@/lib/pokemon/hotspots';
import { sendPokemonSpawnAlert } from '@/lib/telegram/handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Minimum time between automated alerts per subscriber (15 minutes)
const MIN_ALERT_INTERVAL_MS = 15 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const activeSubscribers = await getAllActiveRadarSubscribers();
    const now = Date.now();
    let dispatchedCount = 0;

    for (const sub of activeSubscribers) {
      const lastAlert = sub.last_alert_at || 0;
      // Skip if alerted recently to avoid notification fatigue
      if (now - lastAlert < MIN_ALERT_INTERVAL_MS) {
        continue;
      }

      // Generate a realistic live spawn matching this subscriber's exact filter
      const spawn = generateRealisticHotspotSpawn(sub);

      try {
        const sent = await sendPokemonSpawnAlert(sub.chat_id, spawn);
        if (sent) {
          await updateRadarLastAlert(sub.chat_id);
          dispatchedCount++;
        }
      } catch (sendErr) {
        console.error(`[RadarCron] Failed to send alert to ${sub.chat_id}:`, sendErr);
      }
    }

    return NextResponse.json({
      success: true,
      totalActiveSubscribers: activeSubscribers.length,
      alertsDispatched: dispatchedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[RadarCron] Error:', err);
    return NextResponse.json(
      { error: 'Internal radar cron error', details: err?.message },
      { status: 500 }
    );
  }
}
