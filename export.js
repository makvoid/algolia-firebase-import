const algoliasearch = require('algoliasearch')
const { eachOf } = require('async')
const { backups } = require('firestore-export-import')
const fbAdmin = require('firebase-admin')
const fs = require('fs').promises
const { stringify } = require('ndjson')
const { cluster } = require('radash')

const config = require('./config.json')
const fbServiceAccount = require('./serviceAccount.json')

// Connect and authenticate with your Algolia app
const client = algoliasearch(config.algoliaAppId, config.algoliaWriteApiKey)

const exportCollections = async () => {
  // Init Firebase App
  fbAdmin.initializeApp({
    credential: fbAdmin.credential.cert(fbServiceAccount)
  })

  // Grab the raw data for all collections configured
  const rawData = await backups(config.collections)
  const data = Object.keys(rawData).map(collectionName =>
    // Add the additional fields the extension expects
    Object.keys(rawData[collectionName]).map(objId => ({
      objectID: objId,
      ...rawData[collectionName][objId],
      path: `${collectionName}/${objId}`,
      lastmodified: new Date().getTime()
    }))
  )

  // If file export was requested
  if (config.exportFiles) {
    // Export the results to a file
    console.log('Exported the following files:')
    const exportPromises = []
    data.forEach((collection, index) => {
      let output = ''
      let fileFormat
      // Output the requested format (json, ndjson)
      if (config.fileFormat === 'json') {
        // Export the data as a single array of the records
        output = JSON.stringify(collection, null, 0)
        fileFormat = 'json'
      } else {
        const stream = stringify()
        // Append the rows into the output automatically
        stream.on('data', line => {
          output += `${line}`
        })
        // Write each record into the stream
        collection.forEach(record => stream.write(record))
        fileFormat = 'ndjson'
      }
      // Save the file
      const fileName = `export-${config.collections[index]}.${fileFormat}`
      exportPromises.push(fs.writeFile(fileName, output))
      console.log('+', fileName)
    })
    await Promise.all(exportPromises)
    return
  }

  // If we should upload automatically to Algolia
  console.log('Synced the following collections to Algolia:')
  eachOf(data, async (collection, index) => {
    // Sync each collection/chunk one at a time
    const algoliaIndex = client.initIndex(config.collections[index])
    // Upload in chunks of 10k. If you run into size issues, lower this amount
    for (const chunk of cluster(collection, 10000)) {
      await algoliaIndex.saveObjects(chunk)
    }
    console.log('+', config.collections[index])
  })
}

exportCollections()
