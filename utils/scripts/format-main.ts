import fsPromises from 'fs/promises'

const updateTerraformMain = async (fileName, tfVars: string) => {
  try {
    const mainTf = await fsPromises.readFile(fileName, 'utf-8')
    const mainTfByLine = mainTf.split('\n')
    const mainTfPrefix = getIndentationPrefix(mainTfByLine[0])
    const entries = mainTfByLine.filter(
      (m) => !m.includes('    # replaceme:env')
    )
    const newEntries = entries.filter((e) => !e.includes(tfVars))

    newEntries.push(mainTfPrefix + tfVars)

    await fsPromises.writeFile(
      fileName,
      [mainTfPrefix, ...newEntries, mainTfByLine[mainTfByLine.length - 1]].join(
        '\n'
      ),
      'utf-8'
    )
  } catch (err) {
    console.error(err)
  }
}

function getIndentationPrefix(str: string) {
  return str.match(/^[\s\uFEFF\xA0]+/g)
}

function getACLBlock(content: string, label: string) {
  let matched = [],
    inBlock = false

  for (let line of content.split('\n')) {
    if (inBlock) {
      matched.push(line)
    }

    if (line.trim() === `# replaceme:env start ${label}`) {
      inBlock = true
      matched.push(line)
    } else if (inBlock && line.trim().includes(`# replaceme:env end`)) {
      inBlock = false
      // prevent matching multiple acl blocks
      break
    }
  }

  if (matched.length < 2) {
    return ''
  }

  return matched.join('\n')
}

updateTerraformMain('main.tf', 'PAGERDUTY_KEY = var.pagerduty_key')
