// app/page.tsx
import CreateOrJoinCard from './components/CreateOrJoinCard';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-semibold text-slate-800">誰是臥底</h1>
        <CreateOrJoinCard />
      </div>
    </main>
  );
}
