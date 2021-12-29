git init  
npm init  
npm install --save-dev hardhat  
npx hardhat // Select Advanced ts project  
cp .env.example .env
// Update .env file  
npx hardhat accounts --network ropsten  
// or set the default network as ropsten then  
npx hardhat accounts  

// Hardhat shorthand `hh`  
sudo npm i -g hardhat-shorthand  
// Try `hh accounts` (same as `npx hardhat accounts`)  

// Install dependencies  
npm install @truffle/hdwallet-provider  
npm install --save-dev @openzeppelin/contracts  
npm install --save-dev @nomiclabs/hardhat-web3 web3  

// Update/Add your contract code  
// Update scripts/deploy.ts  
hh run scripts/deploy.ts  

// Deploy via task  
hh compile  
export CONTRACT_HASH=$(hh DeployNft --name MyNft --symbol MyN --baseuri http://ipfs/)  

// Run tests over deployed contract (uses contract hash at CONTRACT_HASH)  
hh test



https://docs.avax.network/build/tutorials/smart-contracts/using-hardhat-with-the-avalanche-c-chain  


// Deploy to Avalanche  
```
hh DeployNft --name Faces --symbol FCS --baseuri https://ipfs.io/ipfs/QmXpnzx5nStjNHZ3YR3dJhmoYjtHcSnkvc9TxxbL5kpcjn --network avalanche
export CONTRACT_HASH=0xDD80b8F3313BCA1177C22138de895D904c792Dd0
hh SafeMintWithUri --contract ${CONTRACT_HASH} --uri faruk.png  --network avalanche
```


Base url  
https://ipfs.io/ipfs/QmXpnzx5nStjNHZ3YR3dJhmoYjtHcSnkvc9TxxbL5kpcjn  

Sub files  
https://ipfs.io/ipfs/QmXpnzx5nStjNHZ3YR3dJhmoYjtHcSnkvc9TxxbL5kpcjn/faruk.png  
https://ipfs.io/ipfs/QmXpnzx5nStjNHZ3YR3dJhmoYjtHcSnkvc9TxxbL5kpcjn/turgut.png  



# Default project readme  
# Advanced Sample Hardhat Project

This project demonstrates an advanced Hardhat use case, integrating other tools commonly used alongside Hardhat in the ecosystem.

The project comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts. It also comes with a variety of other tools, preconfigured to work with the project code.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.ts
TS_NODE_FILES=true npx ts-node scripts/deploy.ts
npx eslint '**/*.{js,ts}'
npx eslint '**/*.{js,ts}' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```

# Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/sample-script.ts
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```

# Performance optimizations

For faster runs of your tests and scripts, consider skipping ts-node's type checking by setting the environment variable `TS_NODE_TRANSPILE_ONLY` to `1` in hardhat's environment. For more details see [the documentation](https://hardhat.org/guides/typescript.html#performance-optimizations).
