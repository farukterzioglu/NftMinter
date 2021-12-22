import { expect } from "chai";
import { ethers } from "hardhat";

describe("MyNft", function () {
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
    expect(process.env.CONTRACT_HASH, "env.CONTRACT_HASH is not set").to.not.be.undefined;

    const Contract = await ethers.getContractFactory("MyNft");
    const contract = Contract.attach(process.env.CONTRACT_HASH?.toString()!);

    const totalSupply = await contract.totalSupply();
    const tokenId = totalSupply.add(1);
    const mintTx = await contract.safeMint("0xFe0Cbd2526340F49Ce414a84e7F7E9621669063f", tokenId);
    await mintTx.wait();

    const tokenUri = await contract.tokenURI(tokenId);

    expect(tokenUri).to.equal(`http://ipfs/${tokenId}`);
  }).timeout(60000);

  it("Should return the URI when set", async function () {
    expect(process.env.CONTRACT_HASH, "env.CONTRACT_HASH is not set").to.not.be.undefined

    const Contract = await ethers.getContractFactory("MyNft");
    const contract = Contract.attach(process.env.CONTRACT_HASH?.toString()!);

    const totalSupply = await contract.totalSupply();
    const tokenId = totalSupply.add(1);
    const mintTx = await contract.safeMintWithUri("0xFe0Cbd2526340F49Ce414a84e7F7E9621669063f", tokenId, `subpath/${tokenId}`);
    await mintTx.wait();

    const tokenUri = await contract.tokenURI(tokenId);

    expect(tokenUri).to.equal(`http://ipfs/subpath/${tokenId}`);
  }).timeout(60000);
});
