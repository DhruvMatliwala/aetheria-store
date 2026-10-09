import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSecret } from '@/lib/admin/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RawShinySpawn {
  id: number;
  fi?: number;
  n: string;
  f?: string;
  g?: string;
  cp: number;
  lv: number;
  cc?: string;
  ci?: string;
  dsp: number;
  z?: string;
  ml?: string;
}

interface RawJob {
  id: string;
  status: string;
  stage?: string | null;
  code: string;
  access?: string | null;
  error?: string | null;
  wait?: number | null;
  locked?: string | null;
  ahead?: number;
  age?: number;
  since?: number | null;
  checked?: number | null;
  total?: number | null;
  shinies?: RawShinySpawn[] | null;
}

function getSpriteUrl(pokemonId: number): string {
  return `https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/pokemon_icon_${String(
    pokemonId
  ).padStart(3, '0')}_00.png`;
}

function cleanDigits(code: string): string {
  return code.replace(/\D/g, '').slice(0, 12);
}

export async function POST(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      friendCode?: string;
      customCookie?: string;
    };

    const friendCode = cleanDigits(body.friendCode || '906235879636');
    if (friendCode.length !== 12) {
      return NextResponse.json(
        { error: 'Friend code must be exactly 12 digits.' },
        { status: 400 }
      );
    }

    const cookie =
      body.customCookie?.trim() ||
      process.env.POKEX_SCANNER_COOKIE ||
      '';

    if (!cookie) {
      return NextResponse.json(
        { error: 'No active scanner session cookie configured.' },
        { status: 500 }
      );
    }

    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Referer: 'https://pokexperience.com/shiny-check/',
      Cookie: cookie,
    };

    // 1. Submit shiny check job
    const postRes = await fetch('https://pokexperience.com/shiny-check.php', {
      method: 'POST',
      headers,
      body: JSON.stringify({ code: friendCode, confirm: false }),
      cache: 'no-store',
    });

    let jobData: { ok: boolean; auth?: number; job?: RawJob; error?: string } =
      await postRes.json().catch(() => ({ ok: false }));

    let job = jobData.job;

    // 2. If trial used or error, attempt GET to retrieve most recent cached result
    if (!job || job.status === 'error' || job.error === 'trial_used') {
      const getRes = await fetch('https://pokexperience.com/shiny-check.php', {
        method: 'GET',
        headers,
        cache: 'no-store',
      });
      const getJson = await getRes.json().catch(() => ({ ok: false }));
      if (getJson.ok && getJson.job) {
        job = getJson.job;
      }
    }

    // 3. If job is still queued or running, poll up to 4 times (6 seconds)
    if (job && (job.status === 'queued' || job.status === 'running')) {
      const jobId = job.id;
      for (let attempt = 0; attempt < 4; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const pollRes = await fetch(
          `https://pokexperience.com/shiny-check.php?job=${encodeURIComponent(jobId)}`,
          { method: 'GET', headers, cache: 'no-store' }
        );
        const pollJson = await pollRes.json().catch(() => ({ ok: false }));
        if (pollJson.ok && pollJson.job) {
          const updatedJob: RawJob = pollJson.job;
          job = updatedJob;
          if (updatedJob.status === 'done' || updatedJob.status === 'error') {
            break;
          }
        }
      }
    }

    if (!job) {
      return NextResponse.json(
        {
          error:
            jobData.error ||
            'Scanner backend did not return a valid check job.',
        },
        { status: 502 }
      );
    }

    const nowEpoch = Math.floor(Date.now() / 1000);
    const rawShinies = job.shinies || [];

    const formattedShinies = rawShinies.map((s) => {
      const timeLeftSeconds = Math.max(0, s.dsp - nowEpoch);
      const isDespawned = timeLeftSeconds === 0;

      return {
        id: s.id,
        name: s.n,
        form: s.f || null,
        gender: s.g || 'Neutral',
        cp: s.cp,
        level: s.lv,
        countryCode: s.cc || 'Unknown',
        city: s.ci || 'Unknown Location',
        despawnEpoch: s.dsp,
        despawnIso: new Date(s.dsp * 1000).toISOString(),
        timeLeftSeconds,
        isDespawned,
        discordAlertUrl: s.ml || null,
        coordToken: s.z || null,
        coordWebUrl: s.z ? `https://pokexperience.com/?z=${encodeURIComponent(s.z)}` : null,
        spriteUrl: getSpriteUrl(s.id),
      };
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: job.status,
      error: job.error || null,
      friendCode: job.code || friendCode,
      accessTier: job.access || 'standard',
      checkedSpawns: job.checked || 0,
      totalShinies: formattedShinies.length,
      cachedAgeSeconds: job.age || 0,
      shinies: formattedShinies,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error scanning for shinies.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const cookie = process.env.POKEX_SCANNER_COOKIE || '';
    if (!cookie) {
      return NextResponse.json(
        { error: 'No active scanner session cookie configured.' },
        { status: 500 }
      );
    }

    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      Accept: 'application/json',
      Referer: 'https://pokexperience.com/shiny-check/',
      Cookie: cookie,
    };

    const res = await fetch('https://pokexperience.com/shiny-check.php', {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({ ok: false }));
    if (!data.ok || !data.job) {
      return NextResponse.json(
        { error: 'No cached shiny job found on backend.' },
        { status: 404 }
      );
    }

    const job = data.job;
    const nowEpoch = Math.floor(Date.now() / 1000);
    const rawShinies = job.shinies || [];

    const formattedShinies = rawShinies.map((s: RawShinySpawn) => {
      const timeLeftSeconds = Math.max(0, s.dsp - nowEpoch);
      const isDespawned = timeLeftSeconds === 0;

      return {
        id: s.id,
        name: s.n,
        form: s.f || null,
        gender: s.g || 'Neutral',
        cp: s.cp,
        level: s.lv,
        countryCode: s.cc || 'Unknown',
        city: s.ci || 'Unknown Location',
        despawnEpoch: s.dsp,
        despawnIso: new Date(s.dsp * 1000).toISOString(),
        timeLeftSeconds,
        isDespawned,
        discordAlertUrl: s.ml || null,
        coordToken: s.z || null,
        coordWebUrl: s.z ? `https://pokexperience.com/?z=${encodeURIComponent(s.z)}` : null,
        spriteUrl: getSpriteUrl(s.id),
      };
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: job.status,
      friendCode: job.code,
      accessTier: job.access,
      checkedSpawns: job.checked || 0,
      totalShinies: formattedShinies.length,
      cachedAgeSeconds: job.age || 0,
      shinies: formattedShinies,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch cached shiny status.' },
      { status: 500 }
    );
  }
}
