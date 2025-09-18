<<<<<<< HEAD
'use client'
import { useEffect, useMemo, useState } from 'react'

type Severity = 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown'

type AlertItem = {
  id: string
  headline: string
  severity: Severity
  sent?: string
  effective?: string
  expires?: string
  areaDesc?: string
  link?: string
  source?: string
  category?: string
  county?: string
}

const TW_TZ = 'Asia/Taipei'

function fmtTime(iso?: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('zh-TW', {
      timeZone: TW_TZ,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    })
  } catch { return iso }
}

function sevCls(sev: Severity) {
  switch (sev) {
    case 'Extreme': return 'bg-red-600 text-white'
    case 'Severe': return 'bg-orange-600 text-white'
    case 'Moderate': return 'bg-yellow-500 text-black'
    case 'Minor': return 'bg-emerald-500 text-black'
    default: return 'bg-slate-400 text-black'
  }
}

export default function Page() {
  const [county, setCounty] = useState('屏東縣')
  const [sev, setSev] = useState<Severity | 'ALL'>('ALL')
  const [alerts, setAlerts] = useState<AlertItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      setError(null)
      const qs = new URLSearchParams({ county, minSeverity: sev === 'ALL' ? 'Unknown' : sev })
      const res = await fetch(`/api/alerts?${qs}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`http ${res.status}`)
      const data = (await res.json()) as AlertItem[]
      setAlerts(data)
    } catch (e: any) {
      setError('無法連線資料源（已使用快取或範例）')
    }
  }

  useEffect(() => { load() }, [county, sev])
  useEffect(() => { const id = setInterval(load, 60_000); return () => clearInterval(id) }, [county, sev])

  const filtered = useMemo(() => alerts ?? [], [alerts])
=======
// app/page.tsx
import CreateOrJoinCard from './components/CreateOrJoinCard';
>>>>>>> de95443501ec69b283a4b1cc11f21b9a8f5d2ef6

export default function Home() {
  return (
<<<<<<< HEAD
    <div>
      <header className="sticky top-0 z-10 backdrop-blur bg-white/80 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">屏東示警儀表板</h1>
          <div className="text-xs text-slate-500">資料每分鐘更新；時間以台灣時間</div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <section className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200">
            <label className="block text-xs text-slate-500 mb-1">縣市</label>
            <select className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white" value={county} onChange={(e) => setCounty(e.target.value)}>
              {['屏東縣','高雄市','台東縣','花蓮縣','台南市','台中市','新北市','台北市','宜蘭縣','嘉義縣','嘉義市','桃園市','新竹縣','新竹市','苗栗縣','彰化縣','南投縣','雲林縣','基隆市','澎湖縣','金門縣','連江縣'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200">
            <label className="block text-xs text-slate-500 mb-1">嚴重度</label>
            <select className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white" value={sev} onChange={(e) => setSev(e.target.value as any)}>
              <option value="ALL">全部</option>
              <option value="Extreme">Extreme</option>
              <option value="Severe">Severe</option>
              <option value="Moderate">Moderate</option>
              <option value="Minor">Minor</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>

          <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-500">資料來源</div>
              <div className="text-sm font-medium">NCDR ATOM / CAP</div>
            </div>
            {error ? (
              <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">{error}</span>
            ) : (
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">連線正常</span>
            )}
          </div>
        </section>

        <section className="space-y-3">
          {filtered.length === 0 && (
            <div className="p-6 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-sm">
              目前沒有符合條件的生效中示警。
            </div>
          )}

          {filtered.map(a => (
            <article key={a.id} className="group p-4 md:p-5 rounded-2xl bg-white shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base md:text-lg font-semibold leading-snug">{a.headline}</h2>
                <span className={`text-xs px-2 py-1 rounded-full ${sevCls(a.severity)}`}>{a.severity}</span>
              </div>

              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex flex-wrap gap-2">
                  {a.category && (<span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">{a.category}</span>)}
                  {a.county && (<span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">{a.county}</span>)}
                  {a.source && (<span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">{a.source}</span>)}
                </div>
                <div className="text-right text-xs text-slate-500">
                  發布：{fmtTime(a.sent)}
                  {a.expires ? (<><span className="mx-1">·</span>有效至：{fmtTime(a.expires)}</>) : null}
                </div>
              </div>

              {a.areaDesc && (<p className="mt-2 text-sm text-slate-700">受影響區域：{a.areaDesc}</p>)}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {a.link && (
                  <a href={a.link} className="text-sm px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800" target="_blank" rel="noreferrer">查看來源</a>
                )}
                <a
                  href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(a.link || location.href)}`}
                  target="_blank" rel="noreferrer"
                  className="text-sm px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  分享到 LINE
                </a>
              </div>
            </article>
          ))}
        </section>

        <footer className="mt-10 text-xs text-slate-500 text-center">
          資料來源：民生示警公開資料平台（生效中的示警 → CAP）。伺服器端已設 60 秒快取。
        </footer>
      </main>
    </div>
  )
}
=======
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-semibold text-slate-800">誰是臥底</h1>
        <CreateOrJoinCard />
      </div>
    </main>
  );
}
>>>>>>> de95443501ec69b283a4b1cc11f21b9a8f5d2ef6
