const { ethers } = require("ethers");
const BaseService = require("./BaseService");
const config = require("../config/config.json");

class aPrioriStakingService extends BaseService {
  constructor(contractAddress, wallet) {
    super(wallet, wallet.provider);
    this.contractAddress = contractAddress;
    this.contractABI = [
      {
        "type": "function",
        "name": "deposit",
        "inputs": [
          { "name": "assets", "type": "uint256", "internalType": "uint256" },
          { "name": "receiver", "type": "address", "internalType": "address" }
        ],
        "outputs": [
          { "name": "shares", "type": "uint256", "internalType": "uint256" }
        ],
        "stateMutability": "payable"
      }
    ];
    this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.wallet);
  }

  async stakeaPriori(amount, retry = 0, maxRetries = 5) {
    try {
    //   console.log(`🚀 Sending stake aPriori of ${ethers.formatEther(amount)} MON from ${this.wallet.address}`);
      
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice;
      
      const estimatedGasLimit = await this.contract.deposit.estimateGas(
        amount,
        this.wallet.address,
        { value: amount }
      );
      const gasLimit = estimatedGasLimit;
      
      const estimatedGasCost = gasPrice * gasLimit;
      
      const balanceWei = await this.provider.getBalance(this.wallet.address);
      if (balanceWei < amount + estimatedGasCost) {
        throw new Error(`Insufficient balance for staking aPriori. Required: ${ethers.formatEther(amount + estimatedGasCost)} MON`);
      }
      
      const tx = await this.contract.deposit(amount, this.wallet.address, {
        value: amount,
        gasLimit: gasLimit,
        gasPrice: gasPrice
      });
      
    //   console.log(`✅ Staking aPriori transaction sent: ${tx.hash}`);
      await tx.wait();
      return { status: "Success" };
    } catch (error) {
      console.error(`Stake aPriori error (attempt ${retry + 1}): ${error.message}`);
      if (retry < maxRetries) {
        await this.utils.delay(5000);
        return this.stakeaPriori(amount, retry + 1, maxRetries);
      } else {
        throw new Error(`Stake aPriori failed after ${maxRetries} retries: ${error.message}`);
      }
    }
  }
}

module.exports = aPrioriStakingService;
