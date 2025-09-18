import { NextResponse } from 'next/server';
import { parseAtomLinks, parseCapToAlert, AlertItem } from '@/lib/cap';
import { severityRank, normalizeSeverity } from '@/lib/severity';

const FEED_URL = process.env.FEED_ACTIVE_URL || '';
const CAP_LIMIT = Number(process.env.ALERTS_CAP_LIMIT || 20);
const TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS || 8000);

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal, headers: { 'cache-control': 'no-cache' } });
  } finally {
    clearTimeout(id);
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const county = searchParams.get('county') || '';
  const minSev = normalizeSeverity(searchParams.get('minSeverity') || 'Unknown');

  if (!FEED_URL) {
    const sample: AlertItem[] = [
      {
        id: 'sample-1',
        headline: '強風與豪雨特報：山區慎防坍方與落石',
        severity: 'Severe',
        sent: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        effective: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        expires: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        areaDesc: '屏東縣、台東縣山區',
        link: 'https://alerts.ncdr.nat.gov.tw/',
        source: '中央氣象署',
        category: '氣象',
        county: '屏東縣',
      },
      {
        id: 'sample-2',
        headline: '部分路段強風預告：將採取高側風管制',
        severity: 'Moderate',
        sent: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        effective: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        areaDesc: '南迴公路、台1線部分路段',
        link: 'https://alerts.ncdr.nat.gov.tw/',
        source: '公路局',
        category: '道路',
        county: '屏東縣',
      },
    ];
    return NextResponse.json(sample, {
      headers: { 'Cache-Control': 'public, max-age=30' },
    });
  }

  try {
    const feedRes = await fetchWithTimeout(FEED_URL, TIMEOUT_MS);
    if (!feedRes.ok) throw new Error(`feed http ${feedRes.status}`);
    const atomXml = await feedRes.text();
    const links = parseAtomLinks(atomXml).slice(0, CAP_LIMIT);

    const capXmlList = await Promise.allSettled(
      links.map((u) => fetchWithTimeout(u, TIMEOUT_MS).then((r) => r.text()))
    );

    const all: AlertItem[] = [];
    for (let i = 0; i < capXmlList.length; i++) {
      const it = capXmlList[i];
      if (it.status === 'fulfilled') {
        const alert = parseCapToAlert(it.value, links[i]);
        if (alert) all.push(alert);
      }
    }

    const filtered = all.filter((a) => {
      const sevOK = severityRank[a.severity] >= severityRank[minSev];
      const countyOK = county ? (a.county ? a.county === county : (a.areaDesc || '').includes(county)) : true;
      return sevOK && countyOK;
    });

    filtered.sort((a, b) => {
      const sv = severityRank[b.severity] - severityRank[a.severity];
      if (sv !== 0) return sv;
      const ta = a.sent ? Date.parse(a.sent) : 0;
      const tb = b.sent ? Date.parse(b.sent) : 0;
      return tb - ta;
    });

    return NextResponse.json(filtered, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'fetch_failed', message: e?.message || 'unknown' },
      { status: 502 }
    );
  }
}