import DashboardIcon, { type DashboardIconName } from '@/components/DashboardIcon'

type ComingSoonPageProps = {
  title: string
  icon: DashboardIconName
}

export default function ComingSoonPage({ title, icon }: ComingSoonPageProps) {
  return (
    <main className="page-content coming-soon">
      <p className="eyebrow">FINANCIAL WORKSPACE</p>
      <h1>{title}</h1>
      <p className="page-subtitle">This section is coming soon.</p>
      <div className="coming-card">
        <span className="coming-icon"><DashboardIcon name={icon} size={24} /></span>
        <h2>{title} will appear here</h2>
        <p>We’re laying the groundwork for your financial workspace.</p>
      </div>
    </main>
  )
}
