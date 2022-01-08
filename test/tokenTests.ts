import { expect } from "chai"
import { ethers } from "hardhat"
import { MyToken, MyToken__factory } from "../typechain"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Wallet } from "ethers";

let contract: MyToken;
let owner : SignerWithAddress;
let tokenDecimal : number;

describe("MyToken Tests", function(){
    this.timeout(180000);

    before(async () => {
        [owner] = await ethers.getSigners();
        console.log({owner: owner.address});
    
        const contractFac : MyToken__factory = await ethers.getContractFactory("MyToken", owner);
    
        if(process.env.TOKEN_HASH != null) 
        {
            contract = contractFac.attach(process.env.TOKEN_HASH.toString()!);
            console.log(`Attached to the contact at ${process.env.TOKEN_HASH}`);
    
            const totalSupply = await contract.totalSupply();
            const totalSupplyDecimal = ethers.utils.formatUnits(totalSupply, tokenDecimal);
            console.log({totalSupply: totalSupplyDecimal})
        }
        else 
        {
            const totalSupply = (10 ** 9).toString();
            const totalSupplyEth = ethers.utils.parseEther(totalSupply);
            
            console.log(`Deploying My Token with total supply ${totalSupplyEth}`);
            contract = await contractFac.deploy(totalSupplyEth);
            await contract.deployed();
            console.log(`Deployed to ${contract.address}`);
        }
        tokenDecimal = await contract.decimals();
    
        const ownerBalance = await contract.balanceOf(owner.address);
        const ownerBalanceDecimal = ethers.utils.formatUnits(ownerBalance, tokenDecimal);
        console.log({ ownerBalance: ownerBalanceDecimal});
    })

    it("should be total suppy == balance", async function (){
        // This test valid only if it deployed just now
        if(process.env.TOKEN_HASH != null) {
            return;
        }

        const ownerBalance = await contract.balanceOf(owner.address);
        const totalSupply = await contract.totalSupply();
        expect(totalSupply).to.equal(ownerBalance);
    }).timeout(60000);

    xit("should transfer from owner", async function (){
        const receiver = '0xeDaa1D0cbf0053788BdD93A8DA57336808B75eF5';
        const amount = "1";
        let amountEth = ethers.utils.parseEther(amount); // or ethers.utils.parseUnits(amount, 18);

        const reiceverBalanceBefore = await contract.balanceOf(receiver);
        const reiceverBalanceEthBefore = ethers.utils.formatUnits(reiceverBalanceBefore, tokenDecimal); // ethers.utils.parseUnits(reiceverBalanceBefore, 18);
        console.log({reiceverBalanceEthBefore: reiceverBalanceEthBefore});

        const tx = await contract.transfer(receiver, amountEth);
        console.log({txhash: tx.hash});

        await tx.wait();

        const reiceverBalanceAfter = await contract.balanceOf(receiver);
        const reiceverBalanceEthAfter = ethers.utils.formatUnits(reiceverBalanceAfter, tokenDecimal)
        console.log({reiceverBalanceEthAfter: reiceverBalanceEthAfter});

        expect(reiceverBalanceAfter).to.equal( reiceverBalanceBefore.add(amountEth));
    }).timeout(180000);

    it("should transfer from an account", async function (){
        const [owner] = await ethers.getSigners(); // should get 2. account instead of owner, hadthat configured with 1 account right now
        const contractWithSender = contract.connect(owner);

        const receiver = "0xFe0Cbd2526340F49Ce414a84e7F7E9621669063f";
        const amountEth = ethers.utils.parseUnits("1", 18);
        const tx = await contractWithSender.transfer(receiver, amountEth);
        console.log({txhash: tx.hash});

        await tx.wait();

        const reiceverBalanceAfter = await contract.balanceOf(receiver);
        const reiceverBalanceEthAfter = ethers.utils.formatUnits(reiceverBalanceAfter, tokenDecimal)
        console.log({reiceverBalanceEthAfter: reiceverBalanceEthAfter});

        expect(reiceverBalanceAfter).to.gt(1);
    }).timeout(180000);
})