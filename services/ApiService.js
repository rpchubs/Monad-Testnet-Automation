const path = require("path");
const axios = require("axios");
const config = require(path.join(__dirname, "../config/config.json"));

class ApiService {
  constructor() {
    this.axios = axios.create({
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  getExplorerUrl(txHash) {
    return `${config.network.explorer}${txHash}`;
  }

  async checkTransactionStatus(txHash) {
    try {
      if (!txHash || !txHash.startsWith("0x")) {
        throw new Error(`Invalid transaction hash: ${txHash}`);
      }

      return {
        hash: txHash,
        status: "success",
        url: this.getExplorerUrl(txHash),
        gasUsed: "500000",
        effectiveGasPrice: "1000000000",
      };
    } catch (error) {
      console.error("Error checking transaction status:", error.message);
      return null;
    }
  }

  async getGasPrice() {
    try {
      return {
        gweiPrice: 20,
      };
    } catch (error) {
      console.error("Error getting gas price:", error.message);
      return null;
    }
  }

  async checkClaimableStatus(walletAddress) {
    try {
      const response = await this.axios.get(
        `${config.apis.liquidStaking}/withdrawal_requests?address=${walletAddress}`
      );

      const claimableRequest = response.data.find(
        (request) => !request.claimed && request.is_claimable
      );

      return {
        id: claimableRequest?.id || null,
        isClaimable: !!claimableRequest,
        data: claimableRequest,
        url: claimableRequest?.txHash
          ? this.getExplorerUrl(claimableRequest.txHash)
          : null,
      };
    } catch (error) {
      console.error("Error checking claimable status:", error.message);
      return {
        id: null,
        isClaimable: false,
        data: null,
        url: null,
      };
    }
  }
}

module.exports = ApiService;
