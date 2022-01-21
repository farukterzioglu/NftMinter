import * as fs from 'fs';
import { strictEqual } from 'assert';
import { CID, create, globSource, Options } from 'ipfs-http-client';
import { string } from 'hardhat/internal/core/params/argumentTypes';
import { ethers } from "hardhat";

const auth = 'Basic ' + Buffer.from(process.env.IPFS_PROJECTID + ':' + process.env.IPFS_SECRET).toString('base64')
const remoteClient = create( { 
  url: "https://ipfs.infura.io:5001/api/v0",
  headers: {
    authorization: auth
  }
})

const ipfsClient = create( { 
  url: "http://127.0.0.1:5001"
})

class FileUploadResponse
{
  FolderCid : string;
  FileNames: string[];

  constructor(){
    this.FileNames = new Array<string>()
    this.FolderCid = "";
  }
}
async function uploadFolderToIpfs(folderPath :string) : Promise<FileUploadResponse> {
  const addOptions = {
    pin: true,
    wrapWithDirectory: true,
    timeout: 60000
  };
  const globSourceOptions = { hidden: false };

  const uploadDetails = new FileUploadResponse();
  for await (const file of ipfsClient.addAll(globSource(folderPath, "**/*", globSourceOptions), addOptions)) {
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
  image:string;
  name:string; 
  description:string;

  constructor(imagePath:string, name:string, desc:string)
  {
    this.image = imagePath;
    this.name = name;
    this.description = desc;
  }
}

class MetadataUploadResponse
{
  FolderCid : string;
  FileNames: string[];

  constructor(){
    this.FileNames = new Array<string>();
    this.FolderCid = "";
  }
}

async function uploadMetadataListToIpfs(metadataList : Metadata[]) : Promise<MetadataUploadResponse> {
  console.log( { metadataList: metadataList });
  let jsonList : Array<string> = metadataList.map( metadata => JSON.stringify(metadata));

  const addOptions = {
    pin: true,
    wrapWithDirectory: true,
    timeout: 60000
  };

  // TODO: Upload with file name (e.g. `baseuri/1.json` )
  const metadataUploadResponse = new MetadataUploadResponse();
  let i: number = 0;
  for await (const file of ipfsClient.addAll(jsonList, addOptions)) {
    // Last item is the folder CID
    if(i == (metadataList.length) )
    {
      metadataUploadResponse.FolderCid = file.cid.toString();
    }
    else 
    {
      metadataUploadResponse.FileNames.push(file.cid.toString());
      i++;
    }
  }
  console.log({metadataUploadDetails:metadataUploadResponse});

  return metadataUploadResponse;
}

class FileNameMetadataPair
{
  fileName :string;
  metaDataUri: string;
  metaDataIpfsUri: string;
  metaDataGatewayURL: string;

  constructor(fileName :string, metaDataUri: string, metaDataIpfsUri: string, metaDataPublicUri: string = ""){
    this.fileName = fileName;
    this.metaDataUri = metaDataUri;
    this.metaDataIpfsUri = metaDataIpfsUri;
    this.metaDataGatewayURL = metaDataPublicUri;
  }

}
async function uploadNftImages(nftImagesPath: string, baseUrl: string) : Promise<FileNameMetadataPair[]> {
  // Upload all images under a folder 
  const uploadDetails :FileUploadResponse = await uploadFolderToIpfs(nftImagesPath);

  // Create metadata for uploaded images
  let metadaList : Array<Metadata> = uploadDetails.FileNames.map( fn => 
    new Metadata(`ipfs://${uploadDetails.FolderCid}/${fn}`, fn, `A ${fn} NFT`));

  // Upload metadata list to a IPFS folder
  const metadataUploadDetails: MetadataUploadResponse = await uploadMetadataListToIpfs(metadaList);

  // Create filename-metadataUri pairs
  const fileNameMetadataPairs = new Array<FileNameMetadataPair>();
  for (let i = 0; i < metadataUploadDetails.FileNames.length; i++) {
    const fileName = metadataUploadDetails.FileNames[i];
    const metaDataUri = `${metadataUploadDetails.FolderCid}/${fileName}`;

    remoteClient.pin.add(metaDataUri); // no need to wait

    fileNameMetadataPairs.push(new FileNameMetadataPair(
      uploadDetails.FileNames[i], 
      metaDataUri,
      `ipfs://${metaDataUri}`, 
      `https://ipfs.infura.io/ipfs/${metaDataUri}`
    ));
  }
  console.log({fileNameMetadataPairs: fileNameMetadataPairs});
  return fileNameMetadataPairs;
}

// hh run scripts/upload.ts
async function main() {
  const baseUrl = "";

  const fileNameMetadataPairs = await uploadNftImages("files/nftimages", baseUrl);
  // fileNameMetadataPairs.forEach(fileNameMetadataPair => { console.log(`${fileNameMetadataPair.fileName} \t ${fileNameMetadataPair.metaDataUri}`); });

  const GenericNft = await ethers.getContractFactory("GenericNft");
  const genericNft = await GenericNft.deploy("MatrixPosters", "MTRX", "ipfs://");
  await genericNft.deployed();

  console.log(`Nft deployed to: ${genericNft.address}`);

  const [owner] = await ethers.getSigners();
  for (let i = 0; i < fileNameMetadataPairs.length; i++) {
    const element = fileNameMetadataPairs[i];
    
    const mintTx = await genericNft.safeMintWithUri(owner.address, i, element.metaDataUri);
    console.log(`Minted ${element.fileName} at tx ${mintTx.hash}`);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// Notes 

// async function uploadFolderToIpfs1(nftImagesPath: string) : Promise<string[]>{
//   // Read images
//   const ntfImageList = new Array<string>();
//   fs.readdirSync(nftImagesPath).forEach(file => {
//     ntfImageList.push(file);
//   });

//   // Upload images
//   const ntfImageUrlList = new Array<string>();
//   for (let i = 0; i < ntfImageList.length; i++) {
//     const filePath = ntfImageList[i];
//     const file = fs.readFileSync(filePath);

//     const ipfsPath = '/nft/' + file
//     // TODO:
//     // const { cid: assetCid } = await client.add({ path: ipfsPath, file })
//     // ntfImageUrlList.push(metadataUrl);
//   };

//   return ntfImageUrlList;
// }

// function uploadWithFileName()
// {
//   for (let i = 0; i < metadataList.length; i++) {
//     const metadata = metadataList[i];

//     const { cid: metadataCid } = await client.add({ 
//       path: `/nft/${metadata.name}.json`, 
//       content: JSON.stringify(metadata)
//     })
//     console.log({ metadataCid: `${metadataCid}/${metadata.name}.json`});
    
//   }
// }
// async function uploadMetadataToIpfs(imagePath:string, name:string, desc:string) : Promise<string> {
//   const metadata = {
//     "description": desc,
//     "image": imagePath,
//     "name": name
//   };

//   const addedMetadata = await client.add(JSON.stringify(metadata));
//   const metadataUrl = `https://ipfs.infura.io/ipfs/${addedMetadata.path}`;

//   return metadataUrl;
// }

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