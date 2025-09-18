import { XMLParser } from 'fast-xml-parser';
import { Severity, normalizeSeverity } from './severity';

export type AlertItem = {
  id: string;
  headline: string;
  severity: Severity;
  sent?: string;      // ISO
  effective?: string; // ISO
  expires?: string;   // ISO
  areaDesc?: string;
  link?: string;      // CAP 來源 URL
  source?: string;    // senderName
  category?: string;  // event / category
  county?: string;    // 粗略由 areaDesc 判斷
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  removeNSPrefix: true,
  trimValues: true,
});

export function parseAtomLinks(atomXml: string): string[] {
  const obj = parser.parse(atomXml);
  const entries = obj?.feed?.entry;
  if (!entries) return [];
  const arr = Array.isArray(entries) ? entries : [entries];
  return arr
    .map((e: any) => {
      if (e?.link?.href) return e.link.href;
      if (Array.isArray(e?.link)) {
        const l = e.link.find((x: any) => x.href);
        if (l?.href) return l.href;
      }
      return undefined;
    })
    .filter(Boolean);
}

export function parseCapToAlert(xml: string, capUrl?: string): AlertItem | null {
  const obj = parser.parse(xml);
  const a = obj?.alert;
  if (!a) return null;
  const info = Array.isArray(a.info) ? a.info[0] : a.info;
  const area = info?.area ? (Array.isArray(info.area) ? info.area[0] : info.area) : undefined;
  const areaDesc = typeof area?.areaDesc === 'string' ? area.areaDesc : undefined;
  const county = areaDesc ? guessCounty(areaDesc) : undefined;

  return {
    id: a.identifier || a.incidents || a.references || capUrl || `cap-${Math.random().toString(36).slice(2)}`,
    headline: info?.headline || info?.event || '示警',
    severity: normalizeSeverity(info?.severity),
    sent: a?.sent || info?.onset || undefined,
    effective: info?.effective || a?.sent || undefined,
    expires: info?.expires || undefined,
    areaDesc,
    link: capUrl,
    source: info?.senderName || a?.sender || undefined,
    category: info?.event || (Array.isArray(info?.category) ? info.category[0] : info?.category) || undefined,
    county,
  };
}

const COUNTY_KEYWORDS = [
  '台北市','新北市','基隆市','桃園市','新竹市','新竹縣','苗栗縣','台中市','彰化縣','南投縣','雲林縣','嘉義市','嘉義縣','台南市','高雄市','屏東縣','宜蘭縣','花蓮縣','台東縣','澎湖縣','金門縣','連江縣'
];

function guessCounty(text: string): string | undefined {
  for (const k of COUNTY_KEYWORDS) if (text.includes(k)) return k;
  return undefined;
}