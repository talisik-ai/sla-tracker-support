import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({
      to: '/dashboard',
    })
  },
  component: Home,
})

function Home() {
  return <div className="p-2">Redirecting to dashboard...</div>
}
