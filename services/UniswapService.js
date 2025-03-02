const { ethers } = require("ethers");
const BaseService = require("./BaseService");
const Utils = require("../lib/utils");
const config = require("../config/config.json");

class UniswapService extends BaseService {
  constructor(routerAddress, wallet) {
    super(wallet, wallet.provider);
    this.wallet = wallet;
    this.provider = wallet.provider;
    this.routerAddress = routerAddress;
    this.uniswapConfig = config.contracts.uniswap;
    this.rpcUrls = this.uniswapConfig.rpcUrls;
    this.wethAddress = this.uniswapConfig.weth;
    this.tokenAddresses = this.uniswapConfig.tokens;
    this.routerABI = [
      {
        "name": "swapExactETHForTokens",
        "type": "function",
        "stateMutability": "payable",
        "inputs": [
          { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
          { "internalType": "address[]", "name": "path", "type": "address[]" },
          { "internalType": "address", "name": "to", "type": "address" },
          { "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ]
      },
      {
        "name": "swapExactTokensForETH",
        "type": "function",
        "stateMutability": "nonpayable",
        "inputs": [
          { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
          { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
          { "internalType": "address[]", "name": "path", "type": "address[]" },
          { "internalType": "address", "name": "to", "type": "address" },
          { "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ]
      }
    ];
    this.erc20ABI = [
      {
        "constant": true,
        "inputs": [{ "name": "_owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "balance", "type": "uint256" }],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          { "name": "_spender", "type": "address" },
          { "name": "_value", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "name": "", "type": "bool" }],
        "type": "function"
      }
    ];
    this.routerContract = new ethers.Contract(this.routerAddress, this.routerABI, this.wallet);
  }

  async initialize() {
    await super.initialize();
    return true;
  }

  async swapEthForTokens(tokenSymbol, amountInWei, retry = 0, maxRetries = 5) {
    try {
      if (this.checkGasPrice) await this.checkGasPrice();
      const tokenAddress = this.tokenAddresses[tokenSymbol];
      if (!tokenAddress) throw new Error(`Token ${tokenSymbol} does not exist in config`);
      const path = [this.wethAddress, tokenAddress];
      const deadline = Math.floor(Date.now() / 1000) + 6 * 3600;
      const nonce = await this.wallet.getNonce();

      const tx = await this.routerContract.swapExactETHForTokens(
        0,
        path,
        this.wallet.address,
        deadline,
        {
          value: amountInWei,
          gasLimit: BigInt(500000),
          nonce: nonce
        }
      );
      const receipt = await tx.wait();
      return { status: receipt.status === 1 ? "Success" : "Failed" };
    } catch (error) {
    //   console.error(`Error in swapEthForTokens (attempt ${retry + 1}): ${error.message}`);
      if (retry < maxRetries) {
        await Utils.delay(1000);
        return this.swapEthForTokens(tokenSymbol, amountInWei, retry + 1, maxRetries);
      }
      return { status: "Error", error: error.message };
    }
  }
  
  async swapTokensForEth(tokenSymbol, retry = 0, maxRetries = 5) {
    try {
      if (this.checkGasPrice) await this.checkGasPrice();
      const tokenAddress = this.tokenAddresses[tokenSymbol];
      if (!tokenAddress) throw new Error(`Token ${tokenSymbol} does not exist in config`);

      const tokenContract = new ethers.Contract(tokenAddress, this.erc20ABI, this.wallet);
      const balance = await tokenContract.balanceOf(this.wallet.address);
      if (balance === 0n) {
        return { status: "NoBalance" };
      }
      await this.approveTokenIfNeeded(tokenAddress, balance, this.wallet.address);

      const nonce = await this.wallet.getNonce();
      const path = [tokenAddress, this.wethAddress];
      const deadline = Math.floor(Date.now() / 1000) + 6 * 3600;

      const tx = await this.routerContract.swapExactTokensForETH(
        balance,
        0,
        path,
        this.wallet.address,
        deadline,
        {
          gasLimit: BigInt(500000),
          nonce: nonce
        }
      );
      const receipt = await tx.wait();
      return { status: receipt.status === 1 ? "Success" : "Failed" };
    } catch (error) {
    //   console.error(`Error in swapTokensForEth (attempt ${retry + 1}): ${error.message}`);
      if (retry < maxRetries) {
        await Utils.delay(1000);
        return this.swapTokensForEth(tokenSymbol, retry + 1, maxRetries);
      }
      return { status: "Error", error: error.message };
    }
  }

  async getBalance() {
    try {
      const balanceWei = await this.provider.getBalance(this.wallet.address);
      return ethers.formatEther(balanceWei);
    } catch (error) {
      return null;
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

module.exports = UniswapService;
