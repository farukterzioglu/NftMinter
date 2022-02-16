import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { MyNft, ExposedMyNft } from "../typechain";

let contract: MyNft;

describe("Initial State", () => {
  before(async () => {  
    const Contract = await ethers.getContractFactory("MyNft");
    contract = await Contract.deploy("MyNft", "MyN", "http://ipfs/");
    await contract.deployed();
  })

  it("Should have 'name' and 'symbol' specified at the base constructor.", async() => {
    expect(await contract.name()).to.equal("MyNft");
    expect(await contract.symbol()).to.equal("MyN");
  });

  it("Should have 'base uri' specified at the constructor.", async() => {
    expect(await contract.getBaseURI()).to.equal("http://ipfs/");
  });

  it("Should have not be paused, and set ZERO balances for all accounts at initial state.", async() => {
    expect(await contract.paused()).to.equal(false);
  });
});

describe("Base Uri State", () => {
  before(async () => {  
    const Contract = await ethers.getContractFactory("MyNft");
    contract = await Contract.deploy("MyNft", "MyN", "http://ipfs/");
    await contract.deployed();
  })

  it("Should set 'base uri' specified at the parameter.", async() => {
    await contract.setBaseURI("http://localhost/");
    expect(await contract.getBaseURI()).to.equal("http://localhost/");
  });

  it("Should match the used gas [ @skip-on-coverage ]", async function () {
    const estimation = await contract.estimateGas.safeMint("0xFe0Cbd2526340F49Ce414a84e7F7E9621669063f", 2);
    expect(estimation.toNumber()).to.lessThanOrEqual(152034);
  }).timeout(60000);

  it("Should return the URI when not set", async function () {
    const setBaseUriTx = await contract.setBaseURI("http://ipfs/");
    await setBaseUriTx.wait();

    const totalSupply = await contract.totalSupply();
    const tokenId = totalSupply.add(1);
    const mintTx = await contract.safeMint("0xFe0Cbd2526340F49Ce414a84e7F7E9621669063f", tokenId);
    await mintTx.wait();

    const tokenUri = await contract.tokenURI(tokenId);

    expect(tokenUri).to.equal(`http://ipfs/${tokenId}`);
  });

  it("Should return the URI when set", async function () {
    const setBaseUriTx = await contract.setBaseURI("http://ipfs/");
    await setBaseUriTx.wait();

    const totalSupply = await contract.totalSupply();
    const tokenId = totalSupply.add(1);
    const mintTx = await contract.safeMintWithUri("0xFe0Cbd2526340F49Ce414a84e7F7E9621669063f", tokenId, `subpath/123-${tokenId}`);
    await mintTx.wait();

    const tokenUri = await contract.tokenURI(tokenId);

    expect(tokenUri).to.equal(`http://ipfs/subpath/123-${tokenId}`);
  });

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
  });

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
  });
});

describe("Safe Mint With Uri",  () => {
  before(async () => {
    const Contract = await ethers.getContractFactory("MyNft");
    contract = await Contract.deploy("MyNft", "MyN", "http://ipfs/");
    await contract.deployed();
  });

  it("Should set token uri correct when it has base uri", async () => {
    const tokenId = 1;
    const mintTx = await contract.safeMintWithUri("0xFe0Cbd2526340F49Ce414a84e7F7E9621669063f", tokenId, `${tokenId}`);
    await mintTx.wait();

    expect(await contract.tokenURI(tokenId)).to.equal(`http://ipfs/${tokenId}`);
  });

  it("Should set token uri correct when it doesn't have base uri", async () => {
    const setBaseURITx = await contract.setBaseURI("");
    await setBaseURITx.wait();

    const totalSupply = await contract.totalSupply();
    const tokenId = totalSupply.add(1);

    const mintTx = await contract.safeMintWithUri("0xFe0Cbd2526340F49Ce414a84e7F7E9621669063f", tokenId, `${tokenId}`);
    await mintTx.wait();

    expect(await contract.tokenURI(tokenId)).to.equal(`${tokenId}`);
  });
});

// Mostly taken example from https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/test/security/Pausable.test.js
describe('Pausable',  () => {
  beforeEach(async function () {
    const Contract = await ethers.getContractFactory("MyNft");
    contract = await Contract.deploy("MyNft", "MyN", "http://ipfs/");
    await contract.deployed();
  });

  context('when unpaused', function () {
    beforeEach(async function () {
      expect(await contract.paused()).to.equal(false);
    });

    it('emits a Paused event', async function () {
      await expect(contract.pause()).to.emit(contract, 'Paused');
      await contract.unpause();
    });

    it('can perform normal process in non-pause', async  () => {
      const totalSupply = await contract.totalSupply();
      const tokenId = totalSupply.add(1);
      const mintTx = await contract.safeMintWithUri("0xFe0Cbd2526340F49Ce414a84e7F7E9621669063f", tokenId, `subpath/123-${tokenId}`);
      await mintTx.wait();

      const totalSupplyAfter = await contract.totalSupply();

      expect(totalSupplyAfter).to.equal(totalSupply.add(1));
    });
  });

  context('when paused', function () {
    beforeEach(async function () {
      await contract.pause();
    });

    it('cannot perform normal process in pause', async function () {
      await expect(contract.safeMintWithUri("0xFe0Cbd2526340F49Ce414a84e7F7E9621669063f", 1, "")).to.be.reverted;
    });

    describe('unpausing', function () {
      it('emits an Unpaused event', async function () {
        await expect(contract.unpause()).to.emit(contract, 'Unpaused');
      });

      context('when unpaused', function () {
        beforeEach(async function () {
          await contract.unpause();
        });

        it('should resume allowing normal process', async function () {
          const totalSupply = await contract.totalSupply();
          const tokenId = totalSupply.add(1);
          const mintTx = await contract.safeMintWithUri("0xFe0Cbd2526340F49Ce414a84e7F7E9621669063f", tokenId, `subpath/123-${tokenId}`);
          await mintTx.wait();

          const totalSupplyAfter = await contract.totalSupply();

          expect(totalSupplyAfter).to.equal(totalSupply.add(1));
        });
      });
    });
  });
});

describe('Burnable',  () => {
  let exposedContract: ExposedMyNft;

  beforeEach(async function () {
    const Contract = await ethers.getContractFactory("ExposedMyNft");
    exposedContract = await Contract.deploy();
    await exposedContract.deployed();
  });

  it('should destry the token', async function () {
    const tokenId = 1;
    const address = "0xFe0Cbd2526340F49Ce414a84e7F7E9621669063f";
  
    const mintTx = await exposedContract.safeMint(address, tokenId);
    await mintTx.wait();
    
    let balance = await exposedContract.balanceOf(address);
    expect(balance).to.be.equal(BigNumber.from(1));

    const burnTx = await exposedContract.burn(tokenId);
    await burnTx.wait();

    balance = await exposedContract.balanceOf(address);
    expect(balance).to.be.equal(BigNumber.from(0));
  });
});

describe('SupportsInterface',  () => {
  before(async function () {
    const Contract = await ethers.getContractFactory("MyNft");
    contract = await Contract.deploy("MyNft", "MyN", "http://ipfs/");
    await contract.deployed();
  });

  it('should support ERC721, ERC721, ERC721Enumerable', async function () {
    // ERC721 0x80ac58cd
    // ERC721 0x5b5e139f
    // ERC721Enumerable 0x780e9d63
    expect(await contract.supportsInterface("0x80ac58cd")).to.be.true;
    expect(await contract.supportsInterface("0x5b5e139f")).to.be.true;
    expect(await contract.supportsInterface("0x780e9d63")).to.be.true;
  });
});