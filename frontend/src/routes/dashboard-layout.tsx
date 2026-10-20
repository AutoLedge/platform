import { Link, NavLink, Outlet, useLoaderData, useNavigate, useSubmit, type LoaderFunctionArgs } from 'react-router'
import ProfilePopup from '@/components/ProfilePopup'
import DashboardIcon, { type DashboardIconName } from '@/components/DashboardIcon'
import { sessionContext } from '@/lib/auth'

type DashboardUser = {
  name: string
  email: string
}

type DashboardRoute = {
  label: string
  path: string
  icon: DashboardIconName
}

const primaryRoutes: DashboardRoute[] = [
  { label: 'Overview (Ahmed)', path: '/', icon: 'overview' },
  { label: 'Reconciliation (Ahmed)', path: '/reconciliation', icon: 'reconciliation' },
  { label: 'Transactions (Sebastian)', path: '/transactions', icon: 'transactions' },
  { label: 'Invoices (Sebastian)', path: '/invoices', icon: 'invoices' },
]

const secondaryRoutes: DashboardRoute[] = [
  { label: 'Connections', path: '/connections', icon: 'connections' },
  { label: 'Settings', path: '/settings', icon: 'settings' },
]

export async function dashboardLoader({ context }: LoaderFunctionArgs) {
  const user = context.get(sessionContext).user
  const metadata = user.user_metadata
  const firstName = typeof metadata.first_name === 'string' ? metadata.first_name : ''
  const lastName = typeof metadata.last_name === 'string' ? metadata.last_name : ''
  const metadataName = typeof metadata.full_name === 'string' ? metadata.full_name : ''
  const email = user.email ?? ''

  return {
    user: {
      name: `${firstName} ${lastName}`.trim() || metadataName || email || 'AutoLedge User',
      email,
    },
  }
}

function SidebarLink({ route }: { route: DashboardRoute }) {
  return (
    <NavLink
      to={route.path}
      end={route.path === '/'}
      className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
    >
      <DashboardIcon name={route.icon} />
      <span>{route.label}</span>
    </NavLink>
  )
}

function Sidebar({ user, onSignOut }: { user: DashboardUser; onSignOut: () => void }) {
  const navigate = useNavigate()

  return (
    <aside className="sidebar">
      <Link className="brand" to="/" aria-label="AutoLedge home">
        <span className="brand-mark" aria-hidden="true" />
        <span>AutoLedge</span>
      </Link>
      <nav className="navigation" aria-label="Main navigation">
        <div className="nav-group">{primaryRoutes.map((route) => <SidebarLink key={route.path} route={route} />)}</div>
        <div className="nav-divider" />
        <div className="nav-group">{secondaryRoutes.map((route) => <SidebarLink key={route.path} route={route} />)}</div>
      </nav>
      <ProfilePopup
        name={user.name}
        email={user.email}
        onPreferences={() => navigate('/settings')}
        onSignOut={onSignOut}
      />
    </aside>
  )
}

function Topbar() {
  return (
    <header className="topbar">
      <button className="icon-button notification-button" type="button" aria-label="Notifications">
        <DashboardIcon name="bell" size={21} />
        <span className="notification-dot" />
      </button>
    </header>
  )
}

export default function DashboardLayout() {
  const { user } = useLoaderData<typeof dashboardLoader>()
  const submit = useSubmit()

  return (
    <div className="app-shell">
      <Sidebar user={user} onSignOut={() => submit(null, { method: 'post', action: '/logout' })} />
      <div className="main-column">
        <Topbar />
        <Outlet />
      </div>
    </div>
  )
}
