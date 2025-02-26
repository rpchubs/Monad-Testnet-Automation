const { ethers } = require("ethers");
const BaseService = require("./BaseService");
const config = require("../config/config.json");

class SwapService extends BaseService {
  constructor(wallet) {
    super(wallet, wallet.provider);
    this.wmonContract = new ethers.Contract(
      config.contracts.wmon,
      [
        "function deposit() public payable",
        "function withdraw(uint256 amount) public",
      ],
      this.wallet
    );
  }

  async wrapMON(amount) {
    const maxRetries = 5;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const tx = await this.wmonContract.deposit({
          value: amount,
          gasLimit: BigInt(config.gas.stake),
        });
        const receipt = await tx.wait();
        return {
          status: receipt.status === 1 ? "Success" : "Failed",
        };
      } catch (error) {
        console.error(`wrapMON error, attempt ${attempt}:`, error.message);
        if (attempt === maxRetries) {
          throw error;
        }
        await this.utils.delay(1000);
      }
    }
  }

  async unwrapMON(amount) {
    const maxRetries = 5;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const tx = await this.wmonContract.withdraw(amount, {
          gasLimit: BigInt(config.gas.stake),
        });
        const receipt = await tx.wait();
        return {
          status: receipt.status === 1 ? "Success" : "Failed",
        };
      } catch (error) {
        console.error(`unwrapMON error, attempt ${attempt}:`, error.message);
        if (attempt === maxRetries) {
          throw error;
        }
        await this.utils.delay(1000);
      }
    }
  }
}

module.exports = SwapService;
