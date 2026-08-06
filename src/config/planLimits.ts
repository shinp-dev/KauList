export type PlanName = 'free'

export type ListQuota = {
  current: number
  limit: number
  canCreate: boolean
}

export const DEFAULT_PLAN: PlanName = 'free'

export const PLAN_LIMITS: Record<PlanName, { ownedLists: number }> = {
  free: {
    ownedLists: 1
  }
}

export const createOwnedListLimitMessage = (limit: number): string => {
  return `無料プランでは、自分のリストを${limit}つまで作成できます。`
}

export class OwnedListLimitError extends Error {
  public code = 'OWNED_LIST_LIMIT_REACHED'

  constructor(public current: number, public limit: number) {
    super(createOwnedListLimitMessage(limit))
    this.name = 'OwnedListLimitError'
  }
}
