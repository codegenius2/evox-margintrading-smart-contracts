require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");
require('hardhat-abi-exporter');
require("hardhat-contract-sizer");
require('hardhat-gui');
require('hardhat-deploy');
require("@solarity/hardhat-markup");
require("hardhat-gas-trackooor");
//https://www.npmjs.com/package/hardhat-abi-exporter
/** @type import('hardhat/config').HardhatUserConfig */


module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: "hardhat",
  mocha: {
    timeout: 100000000
  },
  paths: {
    sources: "./contracts", // The directory where your contracts are located
    artifacts: "./artifacts", // The directory where artifact files will be generated
    tests: "./test",
  },
  logging: {
    enabled: true,

  },
  markup: {
    outdir: "./generated-markups",
    onlyFiles: ["./contracts/utils.sol"],
    skipFiles: [],
    noCompile: false,
    verbose: false,
  },
  networks: {
    hardhat: {
      allowBlocksWithSameTimestamp: true,
      // forking: {         
      //   url: "https://rpc.ankr.com/polygon_zkevm_cardona",  // you must change this id    
      // },
      chainId: 2442,
      // forking: {
      //   // Using Alchemy
      //   url: "https://rpc.ankr.com/polygon_zkevm_cardona", // url to RPC node, ${ALCHEMY_KEY} - must be your API key
      //   // Using Infura
      //   // url: `https://mainnet.infura.io/v3/${INFURA_KEY}`, // ${INFURA_KEY} - must be your API key
      //   blockNumber: 2799850, // a specific block number with which you want to work
      // },     
      accounts: [
        { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', balance: '1000000000000000000000' },
        { privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', balance: '1000000000000000000000' },
        { privateKey: '0xd180f7649f382e01bd785dce311671b4e83efc68205be5bc9c0c63d77a167d4d', balance: '1000000000000000000000' },
        { privateKey: '0x5d5cb11a2aedee94e627531e4b930ec004859cde55e515a5fcc50b74fb6272c0', balance: '1000000000000000000000' },
        { privateKey: '0x603c13734233792745d50a6c9c0a55a075ad8b919d3c57d024e72a98a2d86353', balance: '1000000000000000000000' },
        // ... other accounts
      ],
    },
  },
  allowUnlimitedContractSize: true,
};
