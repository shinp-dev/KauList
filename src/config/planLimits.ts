export const PLAN_CONFIG = {
  free: {
    label: '無料プラン',
    ownedLists: 1
  }
} as const

export type PlanName = keyof typeof PLAN_CONFIG

export const DEFAULT_PLAN: PlanName = 'free'

export type ListQuota = {
  current: number
  limit: number
  canCreate: boolean
}

export const createOwnedListLimitMessage = (planName: PlanName = DEFAULT_PLAN): string => {
  const plan = PLAN_CONFIG[planName]
  return `${plan.label}では、自分のリストを${plan.ownedLists}つまで作成できます。`
}

export class OwnedListLimitError extends Error {
  public code = 'OWNED_LIST_LIMIT_REACHED'

  constructor(
    public current: number,
    public limit: number,
    planName: PlanName = DEFAULT_PLAN
  ) {
    super(createOwnedListLimitMessage(planName))
    this.name = 'OwnedListLimitError'
  }
}
