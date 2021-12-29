import * as fs from 'fs';
import { create, Options } from 'ipfs-http-client';

const client = create( { url: "https://ipfs.infura.io:5001/api/v0"} )

async function uploadImageToIpfs(filePath :string) : Promise<string> {
  const file = fs.readFileSync(filePath);

  const added = await client.add(file);
  const url = `https://ipfs.infura.io/ipfs/${added.path}`;
  return url;
}

async function uploadMetadataToIpfs(imagePath:string, name:string, desc:string) : Promise<string> {
  const metadata = {
    "description": desc,
    "image": imagePath,
    "name": name
  };

  const addedMetadata = await client.add(JSON.stringify(metadata));
  const metadataUrl = `https://ipfs.infura.io/ipfs/${addedMetadata.path}`;

  return metadataUrl;
}

// TODO: Upload to the base url
async function uploadNftImages(nftImagesPath: string, baseUrl: string) : Promise<string[]> {
  // Read images
  const ntfImageList = new Array<string>();
  fs.readdirSync(nftImagesPath).forEach(file => {
    ntfImageList.push(file);
  });

  // Upload images
  const ntfImageUrlList = new Array<string>();
  for (let i = 0; i < ntfImageList.length; i++) {
    const file = ntfImageList[i];

    const uploadedPath = await uploadImageToIpfs(`${nftImagesPath}/${file}`);
    const metadataUrl = await uploadMetadataToIpfs(uploadedPath, file, file);

    ntfImageUrlList.push(metadataUrl);
  };

  return ntfImageUrlList;
}

// hh run scripts/upload.ts
async function main() {
  const baseUrl = "";

  const ntfImageList = await uploadNftImages("files/nftimages", baseUrl);
  ntfImageList.forEach(nftImagesPath => { console.log(`${nftImagesPath}`); });

  // TODO: Create NFT and mint for the list

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
