import { createFileRoute } from '@tanstack/react-router'
import { RedisDashboard } from '../components/RedisDashboard'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  return <RedisDashboard />
}