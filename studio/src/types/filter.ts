export interface TableFilter {
  columnName: string
  value: unknown
  comparisonOperator: FilterComparisonOperator
}

export const FILTER_COMPARISON_OPERATORS = [
  '=',
  '!=',
  'like',
  'not like',
  '<',
  '<=',
  '>',
  '>=',
  'in',
] as const
export type FilterComparisonOperator = (typeof FILTER_COMPARISON_OPERATORS)[number]
