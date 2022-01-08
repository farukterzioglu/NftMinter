import { ethers } from "hardhat";
import { MyToken, MyToken__factory } from "../typechain"

async function main() {
  const [owner] = await ethers.getSigners();
  const contractFac : MyToken__factory = await ethers.getContractFactory("MyToken", owner);

  const tokenHash = "0x6eB8398f2fADAE9BBcb0016A4c51c62db44926Ea";
  const contract = contractFac.attach(tokenHash);

  const tokenDecimal = await contract.decimals();

  const ownerBalance = await contract.balanceOf(owner.address);
  const ownerBalanceDecimal = ethers.utils.formatUnits(ownerBalance, tokenDecimal); 
  console.log({ ownerBalance: ownerBalanceDecimal});

  const receiver = '0xeDaa1D0cbf0053788BdD93A8DA57336808B75eF5';

  const reiceverBalanceBefore = await contract.balanceOf(receiver);
  const reiceverBalanceEthBefore = ethers.utils.formatUnits(reiceverBalanceBefore, tokenDecimal);
  console.log({reiceverBalanceEthBefore: reiceverBalanceEthBefore});

  let amountEth = ethers.utils.parseEther("1");
  const tx = await contract.transfer(receiver, amountEth); 
  console.log({txhash: tx.hash});
  await tx.wait();

  const reiceverBalanceAfter = await contract.balanceOf(receiver);
  const reiceverBalanceEthAfter = ethers.utils.formatUnits(reiceverBalanceAfter, tokenDecimal)
  console.log({reiceverBalanceEthAfter: reiceverBalanceEthAfter});
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
