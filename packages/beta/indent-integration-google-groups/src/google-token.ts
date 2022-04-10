import * as fs from 'fs'
import { Auth, google } from 'googleapis'
import * as path from 'path'
import * as readline from 'readline'
import { promisify } from 'util'

const readFile = promisify(fs.readFile).bind(fs)
const writeFile = promisify(fs.writeFile).bind(fs)

const SCOPES = ['https://www.googleapis.com/auth/admin.directory.group']
const TOKEN_PATH = '../token.json'

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
export async function authorize(credentials): Promise<Auth.OAuth2Client> {
  const { client_secret, client_id, redirect_uris } = credentials.installed
  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  )

  // Check if we have previously stored a token.
  try {
    let token = await readFile(path.resolve(__dirname, TOKEN_PATH))
    oauth2Client.credentials = JSON.parse(token.toString())
    return oauth2Client
  } catch (err) {
    return new Promise((resolve, reject) =>
      getNewToken(oauth2Client, (err, token) => {
        if (err) return reject(err)
        resolve(token)
      })
    )
  }
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
export function getNewToken(oauth2Client, callback) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  })
  console.log('Authorize this app by visiting this url:', authUrl)
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close()
    oauth2Client.getToken(code, (err, token) => {
      if (err) {
        return callback({ message: 'Error retrieving access token', err })
      }
      oauth2Client.credentials = token
      storeToken(token)
      callback(null, oauth2Client)
    })
  })
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
export async function storeToken(token) {
  try {
    return await writeFile(
      path.resolve(__dirname, TOKEN_PATH),
      JSON.stringify(token)
    )
  } catch (err) {
    if (err) return console.warn(`Token not stored to ${TOKEN_PATH}`, err)
    console.log(`Token stored to ${TOKEN_PATH}`)
  }
}
