import { Link, useLoaderData } from 'react-router'
import type { homeLoader } from '@/routes/business-loaders'

export default function Home() {
  const { businesses } = useLoaderData<typeof homeLoader>()

  if (businesses.length === 0) {
    return (
      <main className="page-content">
        <h1>Overview</h1>
        <p className="page-subtitle">You’re not a member of a business yet.</p>
      </main>
    )
  }

  return (
    <main className="page-content">
      <h1>Choose a business</h1>
      <p className="page-subtitle">You belong to more than one business. Pick one to open.</p>
      <ul className="business-picker">
        {businesses.map((business) => (
          <li key={business.id}>
            <Link className="panel business-picker-item" to={`/b/${business.id}`}>
              <span className="avatar" aria-hidden="true">{business.name.charAt(0).toUpperCase()}</span>
              <span>{business.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
