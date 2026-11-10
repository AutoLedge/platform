import { Link, NavLink, Outlet, useLoaderData, useNavigate, useParams, useSubmit, type LoaderFunctionArgs } from 'react-router'
import ProfilePopup from '@/components/ProfilePopup'
import BusinessSwitcher from '@/components/BusinessSwitcher'
import DashboardIcon, { type DashboardIconName } from '@/components/DashboardIcon'
import { sessionContext } from '@/lib/auth'

type DashboardUser = {
  name: string
  email: string
}

type DashboardRoute = {
  label: string
  path: string // relative to /b/:businessId ('' = Overview)
  icon: DashboardIconName
}

const primaryRoutes: DashboardRoute[] = [
  { label: 'Overview (Ahmed)', path: '', icon: 'overview' },
  { label: 'Reconciliation (Ahmed)', path: 'reconciliation', icon: 'reconciliation' },
  { label: 'Transactions (Sebastian)', path: 'transactions', icon: 'transactions' },
  { label: 'Invoices (Sebastian)', path: 'invoices', icon: 'invoices' },
]

const secondaryRoutes: DashboardRoute[] = [
  { label: 'Connections', path: 'connections', icon: 'connections' },
  { label: 'Settings', path: 'settings', icon: 'settings' },
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

function businessPath(businessId: string, path: string) {
  return path ? `/b/${businessId}/${path}` : `/b/${businessId}`
}

function SidebarLink({ route, businessId }: { route: DashboardRoute; businessId: string | undefined }) {
  const content = <><DashboardIcon name={route.icon} /><span>{route.label}</span></>

  // No business in the URL (home, onboarding): Overview leads home, the rest is dimmed and inert,
  // so nothing can link to a business page without a business id.
  if (!businessId) {
    if (route.path === '') return <Link className="nav-link active" to="/" aria-current="page">{content}</Link>
    return <span className="nav-link disabled" aria-disabled="true">{content}</span>
  }

  return (
    <NavLink
      to={businessPath(businessId, route.path)}
      end={route.path === ''}
      className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
    >
      {content}
    </NavLink>
  )
}

function Sidebar({ user, onSignOut }: { user: DashboardUser; onSignOut: () => void }) {
  const navigate = useNavigate()
  const { businessId } = useParams()

  return (
    <aside className="sidebar">
      <Link className="brand" to="/" aria-label="AutoLedge home">
        <span className="brand-mark" aria-hidden="true" />
        <span>AutoLedge</span>
      </Link>
      <nav className="navigation" aria-label="Main navigation">
        <div className="nav-group">{primaryRoutes.map((route) => <SidebarLink key={route.path} route={route} businessId={businessId} />)}</div>
        <div className="nav-divider" />
        <div className="nav-group">{secondaryRoutes.map((route) => <SidebarLink key={route.path} route={route} businessId={businessId} />)}</div>
      </nav>
      <div className="sidebar-footer">
        <BusinessSwitcher currentId={businessId} />
        <ProfilePopup
          name={user.name}
          email={user.email}
          onPreferences={businessId ? () => navigate(businessPath(businessId, 'settings')) : undefined}
          onSignOut={onSignOut}
        />
      </div>
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
