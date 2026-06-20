import PreferencePanel from '@/components/PreferencePanel'
import RouteDisplay from '@/components/RouteDisplay'
import RouteDiff from '@/components/RouteDiff'
import ExportButton from '@/components/ExportButton'
import { Landmark } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-museum-ivory">
      <header className="bg-museum-teal-dark text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-museum-gold/20 flex items-center justify-center">
            <Landmark size={22} className="text-museum-gold" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold tracking-wide">
              市立博物馆
            </h1>
            <p className="text-xs text-museum-ivory-dark/70">
              参观路线规划系统
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <aside className="space-y-4">
            <PreferencePanel />
            <ExportButton />
          </aside>

          <section className="space-y-4">
            <RouteDiff />
            <RouteDisplay />
          </section>
        </div>
      </main>

      <footer className="border-t border-museum-ivory-dark/40 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center text-xs text-museum-charcoal-light">
          市立博物馆 · 参观路线规划系统 · 数据仅供参考
        </div>
      </footer>
    </div>
  )
}
