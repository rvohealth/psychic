import rootPath from '../../config/helpers/rootPath'

export default function filePath(path: string, { dist = true }: { dist?: boolean } = {}) {
  return rootPath({ dist }) + '/' + path
}
