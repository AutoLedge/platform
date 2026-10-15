import { useLoaderData, useSubmit, type LoaderFunctionArgs } from 'react-router'
import App from '@/App'
import { sessionContext } from '@/lib/auth'

export async function dashboardLoader({ context }: LoaderFunctionArgs) {
  const user = context.get(sessionContext).user
  const metadata = user.user_metadata
  const firstName = typeof metadata.first_name === 'string' ? metadata.first_name : ''
  const lastName = typeof metadata.last_name === 'string' ? metadata.last_name : ''
  const metadataName = typeof metadata.full_name === 'string' ? metadata.full_name : ''
  const email = user.email ?? ''
  return { user: { name: `${firstName} ${lastName}`.trim() || metadataName || email || 'AutoLedge User', email } }
}

export default function Dashboard() {
  const { user } = useLoaderData<typeof dashboardLoader>()
  const submit = useSubmit()

  return <App user={user} onSignOut={() => submit(null, { method: 'post', action: '/logout' })} />
}
