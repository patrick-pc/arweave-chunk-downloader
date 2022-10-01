const fs = require('fs')
const axios = require('axios')
const base64url = require('base64url')

const tx = process.argv[3]
const output = process.argv[5]

if (process.argv[2] !== '--transaction' || process.argv[4] !== '--output') {
  console.error('Invalid command')
  return
}

const getTxOffset = async (tx) => {
  try {
    const res = await axios.get(`https://arweave.net/tx/${tx}/offset`)
    return res.data
  } catch (error) {
    throw new Error(`Failed to get transaction offset`)
  }
}

const getChunkData = async (offset) => {
  try {
    const res = await axios.get(`https://arweave.net/chunk/${offset}`)
    return base64url.toBuffer(res.data.chunk)
  } catch (error) {
    throw new Error(`Failed to get chunk`)
  }
}

const downloadChunks = async (tx) => {
  console.log('Downloading...')
  const res = await getTxOffset(tx)
  const size = parseInt(res.size)
  const endOffset = parseInt(res.offset)
  const startOffset = endOffset - size + 1

  const data = new Uint8Array(size)
  let byte = 0

  while (byte < size) {
    console.log(`${startOffset + byte} - [${byte}/${size}]`)
    const chunkData = await getChunkData(startOffset + byte)

    if (chunkData) {
      data.set(chunkData, byte)
      byte += chunkData.length
    } else {
      throw new Error(`Error at ${startOffset + byte} - [${byte}/${size}]`)
    }
  }

  fs.writeFile(`./${output}`, data, (error) => {
    if (error) return console.error(error)
    console.log('Download complete!')
  })
}

downloadChunks(tx)
