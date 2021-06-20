import path from 'path'

export default class TelekineticAdapter {
  fileInfo(filePath) {
    return path.parse(filePath)
  }
}
