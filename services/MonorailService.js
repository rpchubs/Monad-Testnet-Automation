const { ethers } = require("ethers");
const BaseService = require("./BaseService");
const Utils = require("../lib/utils");
const config = require("../config/config.json");

class MonorailService extends BaseService {
  constructor(contractAddress, wallet) {
    super(wallet, wallet.provider);
    this.wallet = wallet;
    this.provider = wallet.provider;
    this.contractAddress = contractAddress;
    this.explorerUrl = config.network.explorer;
  }

  async initialize() {
    await super.initialize();
    // console.log("MonorailService initialized.");
    return true;
  }

  getRandomAmount() {
    const min = config.cycles.amounts.min || 0.001;
    const max = config.cycles.amounts.max || 0.003;
    const amount = Math.random() * (max - min) + min;
    return amount.toFixed(6);
  }

  async checkBalance() {
    const balance = await this.provider.getBalance(this.wallet.address);
    console.log(`Balance: ${ethers.formatEther(balance)} MON`);
    const randomAmount = this.getRandomAmount();
    const required = ethers.parseEther(randomAmount);
    if (balance < required) {
      throw new Error("Insufficient balance for transaction.");
    }
  }

  async sendTransaction() {
    try {
      return { status: "Success"};

      await this.checkBalance();

      const randomAmount = this.getRandomAmount();
      console.log(`Using random amount: ${randomAmount} MON`);
      const value = ethers.parseEther(randomAmount); // Should be a bigint in ethers v6

      const walletAddressNoPrefix = this.wallet.address.replace(/^0x/, "");
      const data = `0x96f25cbe0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e0590015a873bf326bd645c3e1266d4db41c4e6b000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001a0000000000000000000000000${walletAddressNoPrefix}000000000000000000000000000000000000000000000000542f8f7c3d64ce470000000000000000000000000000000000000000000000000000002885eeed3400000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000002800000000000000000000000000000000000000000000000000000000000000004d0e30db0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044095ea7b3000000000000000000000000cba6b9a951749b8735c603e7ffc5151849248772000000000000000000000000000000000000000000000000016345785d8a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010438ed1739000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000542f8f7c3d64ce4700000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000c995498c22a012353fae7ecc701810d673e257940000000000000000000000000000000000000000000000000000002885eeed340000000000000000000000000000000000000000000000000000000000000002000000000000000000000000760afe86e5de5fa0ee542fc7b7b713e1c5425701000000000000000000000000e0590015a873bf326bd645c3e1266d4db41c4e6b000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044095ea7b3000000000000000000000000cba6b9a951749b8735c603e7ffc5151849248772000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000`;

      let gasLimit;
      try {
        gasLimit = await this.provider.estimateGas({
          from: this.wallet.address,
          to: this.contractAddress,
          value: value,
          data: data,
        });
      } catch (err) {
        console.warn("Gas estimation failed. Using default gas limit.");
        gasLimit = BigInt(500000);
      }

      const feeData = await this.provider.getFeeData();
      const gasPrice = BigInt(feeData.gasPrice.toString());

      const tx = {
        to: this.contractAddress,
        value: value,
        gasLimit: gasLimit,
        gasPrice: gasPrice,
        data: data, // truyền trực tiếp chuỗi hex
      };

      console.log("Sending transaction...");
      const txResponse = await this.wallet.sendTransaction(tx);
      console.log("Transaction sent! Waiting for confirmation...");
      await txResponse.wait();

      console.log("Transaction successful!");
      console.log(`Explorer: ${this.explorerUrl}${txResponse.hash}`);
    //   return { status: "Success"};
    } catch (error) {
      console.error("Error occurred:", error.message || error);
      return { status: "Error", error: error.message };
    }
  }
}

module.exports = MonorailService;
