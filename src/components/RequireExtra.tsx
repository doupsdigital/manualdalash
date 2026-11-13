import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { usePurchases, type ExtraKey } from '../state/purchases'

export function RequireExtra({ extraKey, children }: { extraKey: ExtraKey; children: ReactNode }) {
  const { isUnlocked } = usePurchases()
  if (!isUnlocked(extraKey)) return <Navigate to="/bonus" replace />
  return children
}
