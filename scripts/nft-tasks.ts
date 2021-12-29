import { task, subtask } from "hardhat/config";
import { run, ethers } from "hardhat";
import { BigNumber } from "ethers";
import {AbiItem} from 'web3-utils';

import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-web3";
import "@typechain/hardhat";

const callback = function (err: any, res: any) {
	if (err) { console.log("An error occured", err); return; }
	console.log("Hash of the transaction: " + res)
};

const contractName = "MyNft";

// hh DeployNft --name MyNft --symbol MyN --baseuri http://ipfs/
task("DeployNft", "")
	.addParam("name", "Name of the Nft")
	.addParam("symbol", "Symbol of the Nft")
	.addParam("baseuri", "Base URI")
	.setAction(async (taskArgs, hre) => {
        const contract = await hre.ethers.getContractFactory(contractName);
        const deployed = await contract.deploy(taskArgs.name, taskArgs.symbol, taskArgs.baseuri);

        await deployed.deployed();

        console.log(deployed.address);
    });


task("DeployAndSafeMint", "")
.setAction(async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("MyNft");
    const contract = await Contract.deploy("MyNft", "MyN", "http://ipfs/");
    await contract.deployed();
    console.log("Nft deployed to:", contract.address);

    const tokenId = 1;
    const mintTx = await contract.safeMint("0xFe0Cbd2526340F49Ce414a84e7F7E9621669063f", tokenId);
    await mintTx.wait();

    const tokenUri = await contract.tokenURI(tokenId);
    console.log({ tokenUri: tokenUri});
  });

// hh SafeMint --contract 0xFd73B36b4A5600Fd1bC73c47d35e179086446B7e
task("SafeMint", "")
  .addParam("contract", "Hash of the Nft")
  .setAction(async (taskArgs, hre) => {
      const Contract = await hre.ethers.getContractFactory("MyNft");

      const contract = Contract.attach(taskArgs.contract);

      const totalSupply = await contract.totalSupply();
      const tokenId = totalSupply.add(1);
      const mintTx = await contract.safeMint("0xFe0Cbd2526340F49Ce414a84e7F7E9621669063f", tokenId);

      await mintTx.wait();
  
      const tokenUri = await contract.tokenURI(tokenId);
      console.log({ tokenUri: tokenUri});
    });


// hh SafeMintWithUri --contract ${CONTRACT_HASH} --uri faruk.png  --network avalanche
task("SafeMintWithUri", "")
  .addParam("contract", "Hash of the Nft")
  .addParam("uri", "URI")
  .setAction(async (taskArgs, hre) => {
      const Contract = await hre.ethers.getContractFactory("MyNft");

      const contract = Contract.attach(taskArgs.contract);

      const totalSupply = await contract.totalSupply();
      const tokenId = totalSupply.add(1);
      const mintTx = await contract.safeMintWithUri("0xFe0Cbd2526340F49Ce414a84e7F7E9621669063f", tokenId, taskArgs.uri);

      await mintTx.wait();
  
      const tokenUri = await contract.tokenURI(tokenId);
      console.log({ tokenUri: tokenUri});
    });


// hh MintNft --contract 0xDe709C78d323e3A28EECc92f3C1B8FeAA9Bf8Ddc --recipient 0xFe0Cbd2526340F49Ce414a84e7F7E9621669063f --tokenuri .
task("MintNft", "")
	.addParam("contract", "Hash of the Nft")
  .addParam("recipient", "Recipient")
  .addParam("tokenuri", "Token URI")
	.setAction(async (taskArgs, hre) => {
        console.log(`Nft is being minted...`);

        const web3 = hre.web3;

        const accounts = await web3.eth.getAccounts();
        const senderAccount = accounts[0];

        const artifact = await hre.artifacts.readArtifact(contractName);
        const abi : AbiItem[] = artifact.abi;

        let contract = new web3.eth.Contract(abi, taskArgs.contract);

        await contract.methods
        .mintNFT(taskArgs.recipient, taskArgs.tokenuri)
        .send({from: senderAccount}, 
          async function (err: any, txhash: any) {
            if (err) {
              console.log("An error occured", err)
              return
            }
            console.log(`Tx: ${txhash}`);
          }
        )

    });

// hh SendNft --contract 0xDe709C78d323e3A28EECc92f3C1B8FeAA9Bf8Ddc --recipient 0x90EFfDed766b6b2e88144558FA397A5C3523D39E --tokenid 1
task("SendNft", "")
	.addParam("contract", "Hash of the Nft")
    .addParam("recipient", "Recipient")
    .addParam("tokenid", "Token Id")
	.setAction(async (taskArgs, hre) => {
        console.log(`Nft is being sent...`);

        const web3 = hre.web3;

        const accounts = await web3.eth.getAccounts();
        const senderAccount = accounts[0];

        const artifact = await hre.artifacts.readArtifact(contractName);
        const abi : AbiItem[] = artifact.abi;

        let contract = new web3.eth.Contract(abi, taskArgs.contract);

        await contract.methods
        .safeTransferFrom(senderAccount, taskArgs.recipient, taskArgs.tokenid)
        .send({from: senderAccount}, 
          async function (err: any, txhash: any) {
            if (err) {
              console.log("An error occured", err)
              return
            }
            console.log(`Tx: ${txhash}`);
          }
        )

    });