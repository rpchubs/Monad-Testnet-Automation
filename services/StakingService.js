const { ethers } = require("ethers");
const BaseService = require("./BaseService");
const config = require("../config/config.json");

class StakingService extends BaseService {
  constructor(contractAddress, wallet) {
    super(wallet, wallet.provider);
    this.contractAddress = contractAddress;
  }

  async stake(amount) {
    const maxRetries = 5;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const tx = {
          to: this.contractAddress,
          data: "0xd5575982", 
          gasLimit: BigInt(config.gas.stake),
          value: amount,
        };

        const txResponse = await this.wallet.sendTransaction(tx);
        const receipt = await txResponse.wait();

        return {
          status: receipt.status === 1 ? "Success" : "Failed",
        };
      } catch (error) {
        // console.error(`stake error, attempt ${attempt}:`, error.message);
        if (attempt === maxRetries) {
          throw error;
        }
        await this.utils.delay(1000);
      }
    }
  }

  async unstake(amount) {
    const maxRetries = 5;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const formattedAmount = amount.toString(16).padStart(64, "0");

        const tx = {
          to: this.contractAddress,
          data: "0x6fed1ea7" + formattedAmount,
          gasLimit: BigInt(config.gas.unstake),
        };

        const txResponse = await this.wallet.sendTransaction(tx);
        const receipt = await txResponse.wait();

        return {
          status: receipt.status === 1 ? "Success" : "Failed",
        };
      } catch (error) {
        // console.error(`unstake error, attempt ${attempt}:`, error.message);
        if (attempt === maxRetries) {
          throw error;
        }
        await this.utils.delay(1000);
      }
    }
  }
}

module.exports = StakingService;
