// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function isBidiPage(page: any): boolean {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return typeof page === 'object' && page !== null && !!page.mouse
}
