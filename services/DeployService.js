const { ethers } = require("ethers");
const solc = require("solc");
const BaseService = require("./BaseService");
const config = require("../config/config.json");
const Utils = require("../lib/utils");

class DeployService extends BaseService {
  constructor(wallet) {
    super(wallet, wallet.provider);
    this.wallet = wallet;
    this.provider = wallet.provider;
  }

  async initialize() {
    await super.initialize();
    return true;
  }

  compileContract() {
    const contractSource = `
pragma solidity ^0.8.0;
contract Counter {
  uint256 private count;
  event CountIncremented(uint256 newCount);
  function increment() public {
    count += 1;
    emit CountIncremented(count);
  }
  function getCount() public view returns (uint256) {
    return count;
  }
}
`;
    const input = {
      language: "Solidity",
      sources: { "Counter.sol": { content: contractSource } },
      settings: {
        outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } }
      }
    };
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    const contract = output.contracts["Counter.sol"].Counter;
    return { abi: contract.abi, bytecode: contract.evm.bytecode.object };
  }

  async deployContract(contractName, retry = 0, maxRetries = 5) {
    try {
      const { abi, bytecode } = this.compileContract();
      const factory = new ethers.ContractFactory(abi, bytecode, this.wallet);
      const contract = await factory.deploy();
      await contract.waitForDeployment();
      return {
        status: "Success",
        contractAddress: contract.address,
        txHash: contract.deploymentTransaction.hash
      };
    } catch (error) {
      if (retry < maxRetries) {
        await Utils.delay(1000);
        return this.deployContract(contractName, retry + 1, maxRetries);
      }
      return { status: "Error", error: error.message };
    }
  }

  async deployContracts(numberOfContracts = 1) {
    const results = [];
    for (let i = 0; i < numberOfContracts; i++) {
      const contractName = Utils.generateRandomName ? Utils.generateRandomName() : `Contract${i}`;
      const result = await this.deployContract(contractName);
      results.push(result);
    }
    return results;
  }
}

module.exports = DeployService;
