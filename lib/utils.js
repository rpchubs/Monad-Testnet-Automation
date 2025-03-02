const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const config = require(path.join(__dirname, "../config/config.json"));

class Utils {
  static getPrivateKeys() {
    const keyPath = path.join(__dirname, "../private.key");
    return fs
      .readFileSync(keyPath, "utf8")
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }
  
  static getPrivateKey() {
    const keys = this.getPrivateKeys();
    if (keys.length === 0) {
      throw new Error("No private keys found.");
    }
    return keys[0];
  }

  static getRandomAmount() {
    const { min, max } = config.cycles.amounts;
    const amount = Math.random() * (max - min) + min;
    return ethers.parseEther(amount.toFixed(8));
  }

  static getRandomDelay() {
    const { min, max } = config.cycles.delays;
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  static delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static logTransaction(hash) {
    return `${config.network.explorer}${hash}`;
  }

  static maskedWallet(address) {
    if (!address || address.length <= 10) {
      return address;
    }
    return address.substring(0, 6) + "..." + address.substring(address.length - 4);
  }

  static maskedPrivateKey(pk) {
    if (!pk || pk.length <= 10) {
      return pk;
    }
    return pk.substring(0, 6) + "..." + pk.substring(pk.length - 4);
  }
}

module.exports = Utils;
