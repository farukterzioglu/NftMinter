import { expect } from "chai";
import { ethers } from "hardhat";
import { MyNft } from "../typechain";

let contract: MyNft;

xdescribe("MyNft", function () {
  before(async () => {  
    if(process.env.CONTRACT_HASH == null) {
      console.log("env.CONTRACT_HASH is not set, by passing MyNft test.");
      return;
    }
    expect(process.env.CONTRACT_HASH, "env.CONTRACT_HASH is not set").to.not.be.undefined;
  
    const Contract = await ethers.getContractFactory("MyNft");
    contract = Contract.attach(process.env.CONTRACT_HASH?.toString()!);
  
    // Set to the default since some tests modifies it
    const setBaseURITx = await contract.setBaseURI("http://ipfs/");
    await setBaseURITx.wait();
  })
  
  xit("Should deploy & return the URI when not set", async function () {
    const Contract = await ethers.getContractFactory("MyNft");
    const contract = await Contract.deploy("MyNft", "MyN", "http://ipfs/");
    await contract.deployed();

    const tokenId = 1;
    const mintTx = await contract.safeMint("0xFe0Cbd2526340F49Ce414a84e7F7E9621669063f", tokenId);
    await mintTx.wait();

    const tokenUri = await contract.tokenURI(tokenId);

    expect(tokenUri).to.equal("http://ipfs/1");
  }).timeout(60000);

  it("Should return the URI when not set", async function () {
    const totalSupply = await contract.totalSupply();
    const tokenId = totalSupply.add(1);
    const mintTx = await contract.safeMint("0xFe0Cbd2526340F49Ce414a84e7F7E9621669063f", tokenId);
    await mintTx.wait();

    const tokenUri = await contract.tokenURI(tokenId);

    expect(tokenUri).to.equal(`http://ipfs/${tokenId}`);
  }).timeout(60000);

  it("Should return the URI when set", async function () {
    const totalSupply = await contract.totalSupply();
    const tokenId = totalSupply.add(1);
    const mintTx = await contract.safeMintWithUri("0xFe0Cbd2526340F49Ce414a84e7F7E9621669063f", tokenId, `subpath/123-${tokenId}`);
    await mintTx.wait();

    const tokenUri = await contract.tokenURI(tokenId);

    expect(tokenUri).to.equal(`http://ipfs/subpath/123-${tokenId}`);
  }).timeout(60000);

  it("Should return the URI when baseURI updated", async function () {
    const currentBaseURI = await contract.getBaseURI();
    
    if(currentBaseURI != "https://gateway.pinata.cloud/ipfs/") {
      const setBaseURITx = await contract.setBaseURI("https://gateway.pinata.cloud/ipfs/");
      await setBaseURITx.wait();
    }

    const totalSupply = await contract.totalSupply();
    const tokenId = totalSupply.add(1);
    const mintTx = await contract.safeMint("0xFe0Cbd2526340F49Ce414a84e7F7E9621669063f", tokenId);
    await mintTx.wait();

    const tokenUri = await contract.tokenURI(tokenId);

    expect(tokenUri).to.equal(`https://gateway.pinata.cloud/ipfs/${tokenId}`);
  }).timeout(60000);

  it("Should return the URI when baseURI updated and when using custom token uri", async function () {
    const currentBaseURI = await contract.getBaseURI();

    if(currentBaseURI != "https://gateway.pinata.cloud/ipfs/") {
      const setBaseURITx = await contract.setBaseURI("https://gateway.pinata.cloud/ipfs/");
      await setBaseURITx.wait();
    }

    const totalSupply = await contract.totalSupply();
    const tokenId = totalSupply.add(1);
    const mintTx = await contract.safeMintWithUri("0xFe0Cbd2526340F49Ce414a84e7F7E9621669063f", tokenId, `subpath/123-${tokenId}`);
    await mintTx.wait();

    const tokenUri = await contract.tokenURI(tokenId);

    expect(tokenUri).to.equal(`https://gateway.pinata.cloud/ipfs/subpath/123-${tokenId}`);
  }).timeout(60000);
});
