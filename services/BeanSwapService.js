const { ethers } = require("ethers");
const BaseService = require("./BaseService");
const Utils = require("../lib/utils");
const config = require("../config/config.json");

class BeanswapService extends BaseService {
  constructor(contractAddress, wallet) {
    super(wallet, wallet.provider);
    this.contractAddress = contractAddress;
    const beanSwapABI = require("../config/BeanSwapABI").ABI;
    const routerAddress = require("../config/BeanSwapABI").ROUTER_CONTRACT;
    const wmonAddress = require("../config/BeanSwapABI").WMON_CONTRACT;
    const usdcAddress = require("../config/BeanSwapABI").USDC_CONTRACT;
    this.routerAddress = routerAddress;
    this.wmonAddress = wmonAddress;
    this.usdcAddress = usdcAddress;
    this.contract = new ethers.Contract(routerAddress, beanSwapABI, this.wallet);
  }

  async initialize() {
    await super.initialize();
  }

  async wrapMON(amount, retry = 0, maxRetries = 5) {
    try {
      await this.checkGasPrice();
      const currentTime = Math.floor(Date.now() / 1000);
      const deadline = currentTime + 6 * 3600;
      const tx = await this.contract.swapExactETHForTokens(
        0,
        [this.wmonAddress, this.usdcAddress],
        this.wallet.address,
        deadline,
        { value: amount, gasLimit: BigInt(500000) }
      );
      const receipt = await tx.wait();
      return {
        status: receipt.status === 1 ? "Success" : "Failed",
        txHash: receipt.transactionHash,
      };
    } catch (error) {
      if (retry < maxRetries) {
        await Utils.delay(1000);
        return this.wrapMON(amount, retry + 1, maxRetries);
      }
      return { status: "Error", error: error.message };
    }
  }

  async unwrapMON(retry = 0, maxRetries = 5) {
    try {
      await this.checkGasPrice();
      const currentTime = Math.floor(Date.now() / 1000);
      const deadline = currentTime + 6 * 3600;
      const usdcABI = ["function balanceOf(address owner) view returns (uint256)"];
      const usdcContract = new ethers.Contract(this.usdcAddress, usdcABI, this.wallet);
      const balanceRaw = await usdcContract.balanceOf(this.wallet.address);
      const usdcBalance = BigInt(balanceRaw);
      if (usdcBalance === BigInt(0)) {
        throw new Error("USDC balance is zero, nothing to unwrap.");
      }
      const amountUSDC = usdcBalance;
      await this.approveTokenIfNeeded(this.usdcAddress, amountUSDC, this.wallet.address);
      const tx = await this.contract.swapExactTokensForETH(
        amountUSDC,
        0,
        [this.usdcAddress, this.wmonAddress],
        this.wallet.address,
        deadline,
        { gasLimit: ethers.parseUnits("500000", 0) }
      );
      const receipt = await tx.wait();
      return { status: receipt.status === 1 ? "Success" : "Failed" };
    } catch (error) {
      if (retry < maxRetries) {
        await Utils.delay(1000);
        return this.unwrapMON(retry + 1, maxRetries);
      }
      return { status: "Error", error: error.message };
    }
  }

  async swapExactETHForTokens(tokenAddress, amount, retry = 0, maxRetries = 5) {
    try {
      await this.checkGasPrice();
      const currentTime = Math.floor(Date.now() / 1000);
      const deadline = currentTime + 6 * 3600;
      const tx = await this.contract.swapExactETHForTokens(
        0,
        [tokenAddress],
        this.wallet.address,
        deadline,
        { value: amount, gasLimit: BigInt(500000) }
      );
      const receipt = await tx.wait();
      return { status: receipt.status === 1 ? "Success" : "Failed" };
    } catch (error) {
      if (retry < maxRetries) {
        await Utils.delay(1000);
        return this.swapExactETHForTokens(tokenAddress, amount, retry + 1, maxRetries);
      }
      return { status: "Error", error: error.message };
    }
  }

  async swapExactTokensForETH(tokenAddress, amount, retry = 0, maxRetries = 5) {
    try {
      await this.checkGasPrice();
      const currentTime = Math.floor(Date.now() / 1000);
      const deadline = currentTime + 6 * 3600;
      const tx = await this.contract.swapExactTokensForETH(
        tokenAddress,
        amount,
        this.wallet.address,
        deadline,
        { gasLimit: BigInt(500000) }
      );
      const receipt = await tx.wait();
      return { status: receipt.status === 1 ? "Success" : "Failed" };
    } catch (error) {
      if (retry < maxRetries) {
        await Utils.delay(1000);
        return this.swapExactTokensForETH(tokenAddress, amount, retry + 1, maxRetries);
      }
      return { status: "Error", error: error.message };
    }
  }

  async swapExactTokensForTokens(tokenAddressIn, tokenAddressOut, amount, retry = 0, maxRetries = 5) {
    try {
      await this.checkGasPrice();
      const currentTime = Math.floor(Date.now() / 1000);
      const deadline = currentTime + 6 * 3600;
      const tx = await this.contract.swapExactTokensForTokens(
        tokenAddressIn,
        tokenAddressOut,
        amount,
        this.wallet.address,
        deadline,
        { gasLimit: BigInt(500000) }
      );
      const receipt = await tx.wait();
      return { status: receipt.status === 1 ? "Success" : "Failed" };
    } catch (error) {
      if (retry < maxRetries) {
        await Utils.delay(1000);
        return this.swapExactTokensForTokens(tokenAddressIn, tokenAddressOut, amount, retry + 1, maxRetries);
      }
      return { status: "Error", error: error.message };
    }
  }

  async approveTokenIfNeeded(tokenAddress, amount, owner) {
    const erc20ABI = [
      "function approve(address spender, uint256 amount) public returns (bool)",
      "function allowance(address owner, address spender) view returns (uint256)"
    ];
    const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, this.wallet);
    const allowanceRaw = await tokenContract.allowance(owner, this.routerAddress);
    const allowance = BigInt(allowanceRaw);
    if (allowance < BigInt(amount)) {
      const tx = await tokenContract.approve(this.routerAddress, ethers.MaxUint256);
      await tx.wait();
    }
  }
}

module.exports = BeanswapService;
