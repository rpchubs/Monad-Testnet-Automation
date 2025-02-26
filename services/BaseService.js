const { ethers } = require("ethers");
const Provider = require("../lib/provider");
const Utils = require("../lib/utils");
const ApiService = require("./ApiService");
const config = require("../config/config.json");

class BaseService {
  /**
   * @param {ethers.Wallet} [wallet] - 
   * @param {ethers.JsonRpcProvider} [provider]
   */
  constructor(wallet, provider) {
    try {
      if (wallet && provider) {
        this.wallet = wallet;
        this.provider = provider;
      } else {
        const providerInstance = new Provider();
        this.provider = providerInstance.getProvider();
        this.wallet = providerInstance.getWallet();
      }
      this.utils = Utils;
      this.api = new ApiService();
    } catch (error) {
      console.error("Failed to initialize BaseService:", error);
      throw error;
    }
  }

  async initialize() {
    try {
      await this.provider.getNetwork();
      return true;
    } catch (error) {
      console.error("Service initialization failed:", error);
      return false;
    }
  }

  async handleTransaction(tx) {
    try {
      const response = await tx.wait();
      return {
        status: response.status === 1 ? "Success" : "Failed",
      };
    } catch (error) {
      console.error("Transaction handling failed:", error);
      throw error;
    }
  }

  async checkGasPrice() {
    const gasPrice = await this.api.getGasPrice();
    if (gasPrice && gasPrice.gweiPrice > config.gas.maxGwei) {
      throw new Error(`Gas price too high: ${gasPrice.gweiPrice} gwei`);
    }
    return gasPrice;
  }
}

module.exports = BaseService;
