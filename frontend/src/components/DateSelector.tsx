import DashboardIcon from '@/components/DashboardIcon'

type DateSelectorProps = {
  label: string
}

export default function DateSelector({ label }: DateSelectorProps) {
  return (
    <button className="date-selector" type="button">
      <DashboardIcon name="calendar" size={16} />
      <span>{label}</span>
      <span className="chevron" />
    </button>
  )
}
