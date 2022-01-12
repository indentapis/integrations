import { Octokit } from '@octokit/rest'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
})

function getACLBlock(content: string, label: string) {
  let matched = [],
    inBlock = false

  for (let line of content.split('\n')) {
    if (inBlock) {
      matched.push(line)
    }

    if (line.trim() === `//indent:managed start ${label}`) {
      inBlock = true
      matched.push(line)
    } else if (inBlock && line.trim().includes(`//indent:managed end`)) {
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

type RoleUpdater = (roleBlock: string) => string

export async function getAndUpdateACL(
  {
    path,
    githubRepo,
    resolvedLabel,
  }: {
    path: string
    githubRepo: string
    resolvedLabel: string
  },
  updater: RoleUpdater
) {
  const [owner, repo] = githubRepo.split('/')
  const file = await getFile({ owner, repo, path })
  const fileContent = Buffer.from(file.content, 'base64').toString('ascii')
  const sourceACL = getACLBlock(fileContent, resolvedLabel)
  const updatedACL = updater(sourceACL)

  if (!sourceACL) {
    console.error(
      JSON.stringify({
        githubRepo,
        path,
        fileContent,
        resolvedLabel,
      })
    )
    throw new Error('no sourceACL found')
  }

  console.log(
    JSON.stringify({
      githubRepo,
      path,
      sourceACL,
      updatedACL,
    })
  )

  const newContentBody = fileContent.replace(sourceACL, updatedACL)
  const newContent = Buffer.from(newContentBody, 'ascii').toString('base64')

  if (newContent === file.content) {
    console.warn('No changes to be applied')
    return { sourceACL, fileContent, newContent }
  }

  const updateResult = await updateFile({
    owner,
    repo,
    path,
    newContent,
    sha: file.sha,
  })

  return { updateResult, sourceACL, updatedACL }
}

export async function getFile({
  owner,
  repo,
  path,
}: {
  owner: string
  repo: string
  path: string
}) {
  const repoContents = await octokit.repos.getContent({ owner, repo, path })
  if ('content' in repoContents.data) {
    if (Array.isArray(repoContents.data)) {
      throw new Error(
        `@indent/webhook.getFile(): failed. Returned a directory instead of a single file`
      )
    }

    const responseType = repoContents.data.type
    switch (responseType) {
      case 'file':
        return repoContents.data
      default:
        throw new Error(
          `@indent/webhook.getFile(): failed. Returned repoContents of type ${responseType}`
        )
    }
  }
}

async function updateFile({
  owner,
  repo,
  path,
  sha,
  newContent,
}: {
  owner: string
  repo: string
  path: string
  sha: string
  newContent: string
}) {
  return await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    sha,
    content: newContent,
    message: 'chore(acl): update roles',
    committer: {
      name: 'Indent Bot',
      email: 'github-bot@noreply.indentapis.com',
    },
    author: {
      name: 'Indent Bot',
      email: 'github-bot@noreply.indentapis.com',
    },
  })
}

