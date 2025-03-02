const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const config = require('../config/config.json');

function maskWallet(address) {
  return address.slice(0, 6) + "..." + address.slice(-4);
}

function loadWalletAddresses() {
  const walletsFile = path.join(process.cwd(), "wallets.txt");
  try {
    const data = fs.readFileSync(walletsFile, 'utf8');
    return data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  } catch (error) {
    console.error("Error reading wallets.txt:", error.message);
    process.exit(1);
  }
}

function getRandomAmount() {
  const min = config.cycles.amounts.min || 0.0001;
  const max = config.cycles.amounts.max || 0.001;
  const amount = Math.random() * (max - min) + min;
  return amount.toFixed(6);
}

class SendTxService {
  constructor(wallet) {
    this.wallet = wallet;
    this.provider = wallet.provider;
    this.network = config.network;
  }
  
  async initialize() {
    return true;
  }
  
  async sendRandomTransaction(retry = 0, maxRetries = 5) {
    const addresses = loadWalletAddresses();
    const randomWallet = addresses[Math.floor(Math.random() * addresses.length)];
    const randomAmount = getRandomAmount();
    const tx = {
      to: randomWallet,
      value: ethers.parseUnits(randomAmount, 18)
    };
    try {
      const transaction = await this.wallet.sendTransaction(tx);
      await transaction.wait();
      return { status: "Success" };
    } catch (error) {
      if (retry < maxRetries) {
        // console.error(`Transaction failed (attempt ${retry + 1}):`, error.message);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.sendRandomTransaction(retry + 1, maxRetries);
      }
      return { status: "Error", error: error.message };
    }
  }
}

module.exports = SendTxService;
