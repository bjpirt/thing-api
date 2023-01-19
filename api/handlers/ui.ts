import { send200 } from 'api/lib/httpResponses'
import KeyValuePair from 'api/types/KeyValuePair'
import fs from 'fs'
import ApiHandler from '../types/ApiHandler'

const mimeTypes: KeyValuePair<string, string> = {
  js: 'text/javascript',
  css: 'text/css',
  json: 'application/json',
  ico: 'image/vnd.microsoft.icon',
  png: 'image/png',
  svg: 'image/svg+xml',
  html: 'text/html'
}

const getMime = (file: string): string =>
  mimeTypes[file.split('.').at(-1) ?? 'html'] ?? mimeTypes.html

const fileCache: KeyValuePair<string, string> = {}
const getFile = (fileName: string): string => {
  if (!fileCache[fileName]) {
    fileCache[fileName] = fs.readFileSync(`./ui/build${fileName}`).toString()
  }

  return fileCache[fileName]
}

export const ui: ApiHandler = async (event) => {
  const fileQuery = event.queryStringParameters?.file ?? '/index.html'

  return send200(getFile(fileQuery), { 'Content-Type': getMime(fileQuery) })
}
