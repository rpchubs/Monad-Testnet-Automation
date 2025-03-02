const { ethers } = require("ethers");
const BaseService = require("./BaseService");
const Utils = require("../lib/utils");
const config = require("../config/config.json");

class KitsuService extends BaseService {
  constructor(contractAddress, wallet) {
    super(wallet, wallet.provider);
    this.wallet = wallet;
    this.provider = wallet.provider;
    this.contractAddress = contractAddress;
    this.gasLimitStake = BigInt(500000);
    this.gasLimitUnstake = BigInt(800000);
    this.stakeAmount = this.getRandomAmount();
  }

  async initialize() {
    await super.initialize();
    return true;
  }

  getRandomAmount() {
    const min = config.cycles.amounts.min || 0.001;
    const max = config.cycles.amounts.max || 0.003;
    const amount = Math.random() * (max - min) + min;
    return ethers.parseEther(amount.toFixed(6));
  }

  async stakeMON(retry = 0, maxRetries = 5) {
    try {
      const tx = {
        to: this.contractAddress,
        data: "0xd5575982",
        gasLimit: this.gasLimitStake,
        value: this.stakeAmount,
      };
      const txResponse = await this.wallet.sendTransaction(tx);
      await txResponse.wait();
      return { status: "Success" };
    } catch (error) {
      if (retry < maxRetries) {
        await Utils.delay(1000);
        return this.stakeMON(retry + 1, maxRetries);
      }
      return { status: "Error", error: error.message };
    }
  }

  async unstakeGMON(retry = 0, maxRetries = 5) {
    try {
      const functionSelector = "0x6fed1ea7";
      const hexAmount = "0x" + this.stakeAmount.toString(16);
      const paddedAmount = ethers.hexZeroPad(hexAmount, 32);
      const data = functionSelector + paddedAmount.slice(2);

      const tx = {
        to: this.contractAddress,
        data: data,
        gasLimit: this.gasLimitUnstake
      };
      const txResponse = await this.wallet.sendTransaction(tx);
      await txResponse.wait();
      return { status: "Success" };
    } catch (error) {
      if (retry < maxRetries) {
        await Utils.delay(1000);
        return this.unstakeGMON(retry + 1, maxRetries);
      }
      return { status: "Error", error: error.message };
    }
  }
}

module.exports = KitsuService;
