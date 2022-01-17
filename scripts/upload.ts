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
    console.log( {image: file});
    uploadDetails.FileNames.push(file.path);
    uploadDetails.FolderCid = file.cid.toString();
  }   
  uploadDetails.FileNames.splice(uploadDetails.FileNames.length -1);

  console.log( {uploadedImages: uploadDetails});
  return uploadDetails;
}

class Metadata 
{
  imagePath:string;
  name:string; 
  desc:string;

  constructor(imagePath:string, name:string, desc:string)
  {
    this.imagePath = imagePath;
    this.name = name;
    this.desc = desc;
  }
}

class MetadataPair {
  CID : string;
  Path : string;

  constructor(cid: string, path: string) {
    this.CID = cid;
    this.Path = path;
  }
}
class MetadataUploadDetails
{
  FolderCid : string;
  MetadataFileNameUriPairs: MetadataPair[];

  constructor(){
    this.MetadataFileNameUriPairs = new Array<MetadataPair>();
    this.FolderCid = "";
  }
}

async function uploadMetadataListToIpfs(metadataList : Metadata[]) : Promise<MetadataUploadDetails> {
  console.log( { metadataList: metadataList });
  let jsonList : Array<string> = metadataList.map( metadata => JSON.stringify(metadata));
  console.log( { metadataJsonList: jsonList} );

  const addOptions = {
    pin: true,
    wrapWithDirectory: true,
    timeout: 60000
  };

  const metadataUploadDetails = new MetadataUploadDetails();
  let i: number = 0;
  for await (const file of client.addAll(jsonList, addOptions)) {
    // Last item is the folder CID
    if(i == (metadataList.length) )
    {
      metadataUploadDetails.FolderCid = file.cid.toString();
    }
    else 
    {
      const pair = new MetadataPair(file.cid.toString(), file.path);
      console.log(pair);
      metadataUploadDetails.MetadataFileNameUriPairs.push(pair);
      i++;
    }
  }   
  // metadataUploadDetails.MetadataFileNameUriPairs.splice(metadataUploadDetails.MetadataFileNameUriPairs.length -1);
  console.log({metadataUploadDetails:metadataUploadDetails});

  return metadataUploadDetails;
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
  // Upload all images under a folder 
  const uploadDetails :UploadDetails = await uploadFolderToIpfs(`${nftImagesPath}`);

  // Create metadata for uploaded images
  let metadaList : Array<Metadata> = uploadDetails.FileNames.map( fn => 
    new Metadata(`https://ipfs.infura.io/ipfs/${uploadDetails.FolderCid}/${fn}`, fn, `A ${fn} NFT`));

  // Upload metadata list to a IPFS folder
  const metadataUploadDetails: MetadataUploadDetails = await uploadMetadataListToIpfs(metadaList);

  // Create filename-metadataUri pairs
  const fileNameMetadataPairs = new Array<FileNameMetadataPair>();
  for (let i = 0; i < metadataUploadDetails.MetadataFileNameUriPairs.length; i++) {
    const fileNameUriPair = metadataUploadDetails.MetadataFileNameUriPairs[i];
    const fileUri = `https://ipfs.infura.io/ipfs/${metadataUploadDetails.FolderCid}/${fileNameUriPair.CID}`;

    fileNameMetadataPairs.push(new FileNameMetadataPair(uploadDetails.FileNames[i], fileUri));
  }
  console.log({fileNameMetadataPairs: fileNameMetadataPairs});

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