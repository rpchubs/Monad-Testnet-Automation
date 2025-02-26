const blessed = require("blessed");
const contrib = require("blessed-contrib");

class InfoDisplay {
  constructor(grid, row, col, rowSpan, colSpan) {
    this.infoBox = grid.set(row, col, rowSpan, colSpan, blessed.box, {
      label: " Wallet Information ",
      tags: true,
      border: {
        type: "line",
        fg: "cyan",
      },
      style: {
        fg: "white",
        border: {
          fg: "#0088cc",
        },
      },
      scrollable: true,
      alwaysScroll: true,
      keys: true,
      vi: true,
      mouse: true,
    });

    this.initializeContent();
  }

  initializeContent() {
    let currentTop = 1;

    this.walletText = blessed.text({
      parent: this.infoBox,
      top: currentTop,
      left: 2,
      content: "Wallet: Unknown",
      style: { fg: "white" },
    });
    currentTop += 2;

    this.balanceText = blessed.text({
      parent: this.infoBox,
      top: currentTop,
      left: 2,
      content: "Balance: Checking...",
      style: { fg: "green" },
    });
    currentTop += 2;

    this.networkText = blessed.text({
      parent: this.infoBox,
      top: currentTop,
      left: 2,
      content: "Network: Monad Testnet",
      style: { fg: "yellow" },
    });
    currentTop += 2;

    this.statusText = blessed.text({
      parent: this.infoBox,
      top: currentTop,
      left: 2,
      content: "Status: Active",
      style: { fg: "green" },
    });
    currentTop += 2;

    this.cycleText = blessed.text({
      parent: this.infoBox,
      top: currentTop,
      left: 2,
      content: "Current Cycle: 0/0",
      style: { fg: "white" },
    });
    currentTop += 2;

    this.tokenList = blessed.text({
      parent: this.infoBox,
      top: currentTop,
      left: 2,
      content: "Tokens: Loading...",
      tags: true,
      style: { fg: "cyan" },
    });
  }

  updateWallet(walletAddress) {
    this.walletText.setContent(`Wallet: ${walletAddress}`);
  }

  updateBalance(balance) {
    this.balanceText.setContent(`Balance: ${balance} MON`);
  }

  updateStatus(status) {
    this.statusText.setContent(`Status: ${status}`);
    this.statusText.style.fg = status === "Active" ? "green" : "red";
  }

  updateCycle(current, total) {
    this.cycleText.setContent(`Current Cycle: ${current}/${total}`);
  }

  updateNetwork(network) {
    this.networkText.setContent(`Network: ${network}`);
  }

  updateTokens(tokens) {
    let content = "Token Balances:\n";
    tokens.forEach((token) => {
      content += `  ${token.symbol}: ${token.balance}\n`;
    });
    this.tokenList.setContent(content);
  }
}

module.exports = InfoDisplay;
