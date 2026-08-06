export const PLAN_CONFIG = {
  free: {
    label: '無料プラン',
    ownedLists: 1
  }
} as const

export type PlanName = keyof typeof PLAN_CONFIG

export const DEFAULT_PLAN: PlanName = 'free'

export type ListQuota = {
  planName: PlanName
  current: number
  limit: number
  canCreate: boolean
}

export const createOwnedListLimitMessage = (planName: PlanName = DEFAULT_PLAN): string => {
  const plan = PLAN_CONFIG[planName]
  return `${plan.label}では、自分のリストを${plan.ownedLists}つまで作成できます。`
}

export class OwnedListLimitError extends Error {
  public readonly code = 'OWNED_LIST_LIMIT_REACHED'
  public readonly limit: number

  constructor(
    public readonly current: number,
    public readonly planName: PlanName = DEFAULT_PLAN
  ) {
    const plan = PLAN_CONFIG[planName]
    super(createOwnedListLimitMessage(planName))
    this.limit = plan.ownedLists
    this.name = 'OwnedListLimitError'
  }
}
