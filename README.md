# algolia-firebase-import
Utility to automatically import Firestore collections into their respective Algolia indices.

## Prerequisites
1. NodeJS 12+ installed
2. Dependencies installed
    a. Run `yarn install ` or `npm install . `
3. Firebase Service Account
    a. Download the private key for the Firebase Service account via the [Dashboard](https://console.firebase.google.com/u/0/project/_/settings/serviceaccounts)
    b. Save as `serviceAccount.json` within the same folder as the script
4. Algolia App ID and write API key added to `config.json`.
5. Collection names added to `config.json`.
6. Enabled file exporting if desired in `config.json`.
7. If file exporting was enabled, choose between the `json` or `ndjson` file format depending on where you would like to upload the file
    a. If you would like to upload to the Algolia Dashboard, use `json`.
    b. If you would like to use the Algolia CLI, use `ndjson`.

## Getting started
After following the Prerequisites above, you can then just run the script. The script will then automatically upload your collections, or export a file if selected:

```shell
# With file exporting disabled
$ node export.js
Synced the following collections:
+ circuits

# With file exporting enabled
$ node export.js
Exported the following files:
+ export-circuits.json
```
