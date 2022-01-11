// import * as Indent from '@indent/types'
import { google } from 'googleapis'
import { getAuth } from './google-auth'

const GOOGLE_CUSTOMER_ID = process.env.GOOGLE_CUSTOMER_ID

export async function loadFromGoogleGroups(): Promise<
  { name?: string; displayName?: string; labels?: any }[]
> {
  console.log('Loading data from Google Groups...')
  const auth = await getAuth()
  const service = google.cloudidentity({
    version: 'v1',
    auth,
  })

  const {
    data: { groups },
  } = await service.groups.list({
    parent: `customers/${GOOGLE_CUSTOMER_ID}`,
    view: 'FULL',
  })

  return groups
}

export async function addUserToGroup({ user, group }) {
  const auth = await getAuth()
  const service = google.cloudidentity({ version: 'v1', auth })

  return await service.groups.memberships.create({
    parent: `groups/${group}`,
    requestBody: {
      preferredMemberKey: { id: user },
      roles: [
        {
          name: 'MEMBER',
        },
      ],
    },
  })
}

export async function removeUserFromGroup({ user, group }) {
  const auth = await getAuth()
  const service = google.cloudidentity({ version: 'v1', auth })

  const membershipID = await service.groups.memberships.lookup({
    parent: `groups/${group}`,
    'memberKey.id': user,
  })

  return await service.groups.memberships.delete({
    name: membershipID.data.name,
  })
}
