const axios = require("axios");
const { ethers } = require("ethers");
const config = require("../config/config.json");

class TokenService {
  constructor() {
    this.axios = axios.create({
      timeout: 30000,
      headers: {
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Sec-Ch-Ua":
          '"Not A(Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
        "Content-Type": "application/json",
      },
    });

    this.trackedAddresses = new Set([
      config.contracts.wmon.toLowerCase(),
      config.contracts.apriori.toLowerCase(),
      config.contracts.magma.toLowerCase(),
    ]);
  }

  async getTokenBalances(address) {
    const maxRetries = 5;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const response = await this.axios.get(
          `${config.apis.blockvision}/account/tokenPortfolio?address=${address}`
        );
  
        if (!response?.data?.result?.data) {
          return [];
        }
  
        const tokens = response.data.result.data
          .filter((token) =>
            this.trackedAddresses.has(token.contractAddress.toLowerCase())
          )
          .map((token) => ({
            symbol: token.symbol || "Unknown",
            balance: token.balance || "0",
            tokenAddress: token.contractAddress,
            name: token.name || "",
            verified: token.verified || false,
          }));
  
        tokens.sort((a, b) => {
          return (
            Array.from(this.trackedAddresses).indexOf(
              a.tokenAddress.toLowerCase()
            ) -
            Array.from(this.trackedAddresses).indexOf(
              b.tokenAddress.toLowerCase()
            )
          );
        });
  
        return tokens;
      } catch (error) {
        attempt++;
        // console.error(`Error fetching token balances, attempt ${attempt}:`, error);
        if (attempt >= maxRetries) {
          // console.error("Max retry attempts reached. Skipping token balance fetch.");
          return [
            {
              symbol: "Unknown",
              balance: "Unknown",
              tokenAddress: "",
              name: "",
              verified: false,
            },
          ];
        }
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }  
}

module.exports = TokenService;
