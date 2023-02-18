import { readFile, unlink, writeFile } from 'fs/promises'
import { CatalogItem } from './catalog'

export async function writeLicense(_item: CatalogItem, path) {
  // import template from file
  const template = await readFile(path + '/LICENSE.example', 'utf-8')
  await unlink(path + '/LICENSE.example')
  return await writeFile(path + '/LICENSE', template, 'utf-8')
}
