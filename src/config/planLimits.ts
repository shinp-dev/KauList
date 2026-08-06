export const PLAN_LIMITS = {
  free: {
    ownedLists: 1,
  },
} as const

export type PlanName = keyof typeof PLAN_LIMITS

export const DEFAULT_PLAN: PlanName = 'free'

export class OwnedListLimitError extends Error {
  code = 'OWNED_LIST_LIMIT_REACHED' as const

  constructor(
    public current: number,
    public limit: number
  ) {
    super('無料プランでは自分のリストを1つまで作成できます')
    this.name = 'OwnedListLimitError'
  }
}
