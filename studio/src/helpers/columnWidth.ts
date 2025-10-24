export default function columnWidth(columnName: string) {
  return Math.max(columnName.length * 20, 120)
}
