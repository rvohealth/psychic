export default function generateEncryptionKey() {
  return (
    Math.random().toString(36).substr(2, 10) +
    '-' +
    Math.random().toString(36).substr(2, 10) +
    '-' +
    Math.random().toString(36).substr(2, 10) +
    '-' +
    Math.random().toString(36).substr(2, 10) +
    '-' +
    Math.random().toString(36).substr(2, 10) +
    '-' +
    Math.random().toString(36).substr(2, 10) +
    '-' +
    Math.random().toString(36).substr(2, 10) +
    '-' +
    Math.random().toString(36).substr(2, 10) +
    '-' +
    Math.random().toString(36).substr(2, 10) +
    '-' +
    Math.random().toString(36).substr(2, 10) +
    '-' +
    Math.random().toString(36).substr(2, 10)
  )
}
