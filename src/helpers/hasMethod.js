export default function hasMethod (obj, name) {
  const desc = Object.getOwnPropertyDescriptor (obj, name);
  return !!desc && typeof desc.value === 'function';
}
