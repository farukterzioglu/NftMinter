import * as fs from 'fs';
import { strictEqual } from 'assert';
import { CID, create, globSource, Options } from 'ipfs-http-client';
import { string } from 'hardhat/internal/core/params/argumentTypes';

const globSourceOptions = {
  hidden: false
};

const auth = 'Basic ' + Buffer.from(process.env.IPFS_PROJECTID + ':' + process.env.IPFS_SECRET).toString('base64')
const client = create( { 
  url: "https://ipfs.infura.io:5001/api/v0",
  headers: {
    authorization: auth
  }
})

class UploadDetails
{
  FolderCid : string;
  FileNames: string[];

  constructor(){
    this.FileNames = new Array<string>()
    this.FolderCid = "";
  }
}
async function uploadFolderToIpfs(folderPath :string) : Promise<UploadDetails> {
  const uploadDetails = new UploadDetails();

  const addOptions = {
    pin: true,
    wrapWithDirectory: true,
    timeout: 60000
  };

  for await (const file of client.addAll(globSource(folderPath, "**/*", globSourceOptions), addOptions)) {
    uploadDetails.FileNames.push(file.path);
    uploadDetails.FolderCid = file.cid.toString();
  }   
  uploadDetails.FileNames.splice(uploadDetails.FileNames.length -1);

  return uploadDetails;
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

class FileNameMetadataPair
{
  fileName :string;
  metaDataUri: string;

  constructor(fileName :string,metaDataUri: string){
    this.fileName = fileName;
    this.metaDataUri = metaDataUri;
  }

}
async function uploadNftImages(nftImagesPath: string, baseUrl: string) : Promise<FileNameMetadataPair[]> {
  const fileNameMetadataPairs = new Array<FileNameMetadataPair>();

  const uploadDetails = await uploadFolderToIpfs(`${nftImagesPath}`);
  for (let i = 0; i < uploadDetails.FileNames.length; i++) {
    const filename = uploadDetails.FileNames[i];
    const fileUri = `https://ipfs.infura.io/ipfs/${uploadDetails.FolderCid}/${filename}`;
    
    const uri = await uploadMetadataToIpfs(fileUri, filename, filename);
    fileNameMetadataPairs.push(new FileNameMetadataPair(filename, uri));
  }
  return fileNameMetadataPairs;
}

// hh run scripts/upload.ts
async function main() {
  const baseUrl = "";

  const fileNameMetadataPairs = await uploadNftImages("files/nftimages", baseUrl);
  fileNameMetadataPairs.forEach(fileNameMetadataPair => { 
    console.log(`${fileNameMetadataPair.fileName} \t ${fileNameMetadataPair.metaDataUri}`); 
  });

  // TODO: Create NFT and mint for the list

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// Notes 
// async function uploadImageToIpfs(filePath :string) : Promise<string> {
//   const file = fs.readFileSync(filePath);

//   const added = await client.add(file);
//   const url = `https://ipfs.infura.io/ipfs/${added.path}`;
//   return url;
// }

// // old code
// async function readFilesAndupload(nftImagesPath: string) : Promise<string[]>{
//   // Read images
//   const ntfImageList = new Array<string>();
//   fs.readdirSync(nftImagesPath).forEach(file => {
//     ntfImageList.push(file);
//   });

//   // Upload images
//   const ntfImageUrlList = new Array<string>();
//   for (let i = 0; i < ntfImageList.length; i++) {
//     const file = ntfImageList[i];

//     const uploadedPath = await uploadImageToIpfs(`${nftImagesPath}/${file}`);
//     const metadataUrl = await uploadMetadataToIpfs(uploadedPath, file, file);

//     ntfImageUrlList.push(metadataUrl);
//   };

//   return ntfImageUrlList;
// }