export function compact(obj: any[]): any[]
export function compact(obj: { [key: string]: any }): { [key: string]: any }
export default function compact(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.filter(val => ![undefined, null].includes(val)) as any[]
  } else {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null))
  }
}
