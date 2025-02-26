const blessed = require("blessed");
const contrib = require("blessed-contrib");
const InfoDisplay = require("./InfoDisplay");

class Dashboard {
  constructor() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: "Monad Transaction Dashboard",
      autoPadding: true,
      fullUnicode: true,
    });

    this.banner = blessed.box({
      parent: this.screen,
      top: 0,
      height: 3,
      width: "100%",
      align: "center",
      valign: "middle",
      content:
        "{bold}Monad Testnet Automation{/bold}\nGithub: https://github.com/rpchubs | Telegram: https://t.me/chat_RPC_Community",
      tags: true,
      style: {
        fg: "white",
        bold: true,
      },
    });

    this.grid = new contrib.grid({
      rows: 12,
      cols: 12,
      screen: this.screen,
      top: 3,
    });

    this.initializeComponents();
    this.setupListeners();
  }

  initializeComponents() {
    this.info = new InfoDisplay(this.grid, 0, 8, 6, 4);

    this.log = this.grid.set(0, 0, 6, 8, contrib.log, {
      fg: "green",
      selectedFg: "green",
      label: "Transaction Logs",
      border: { type: "line", fg: "cyan" },
      scrollback: 100,
      scrollbar: {
        ch: " ",
        track: { bg: "cyan" },
        style: { inverse: true },
      },
    });

    this.table = this.grid.set(6, 0, 6, 8, contrib.table, {
      keys: true,
      fg: "white",
      label: "Service Status",
      columnSpacing: 3,
      columnWidth: [20, 12, 20],
      border: { type: "line", fg: "cyan" },
    });

    this.lineChart = this.grid.set(6, 8, 6, 4, contrib.line, {
      style: {
        line: "yellow",
        text: "green",
        baseline: "black",
      },
      xLabelPadding: 3,
      xPadding: 5,
      showLegend: false,
      wholeNumbersOnly: false,
      label: "Transaction Amounts",
      minY: 0,
      maxY: 1,
      border: { type: "line", fg: "cyan" },
    });

    this.updateLineChart([
      {
        x: [new Date().toLocaleTimeString()],
        y: [0],
      },
    ]);

    this.updateTable([["Service", "Status", "Last Update"]]);

    this.screen.render();
  }

  setupListeners() {
    this.screen.key(["escape", "q", "C-c"], () => process.exit(0));

    this.screen.on("resize", () => {
      if (this.log) this.log.emit("attach");
      if (this.table) this.table.emit("attach");
      if (this.lineChart) this.lineChart.emit("attach");

      this.screen.render();
    });

    if (this.log) {
      this.log.on("click", function (mouse) {
        if (mouse.button === "right") {
          this.setScrollPerc(100);
        } else {
          this.scroll(mouse.button === "left" ? -1 : 1);
        }
        this.screen.render();
      });
    }
  }

  updateLog(message) {
    if (this.log) {
      const timestamp = new Date().toLocaleTimeString();
      this.log.log(`[${timestamp}] ${message}`);
      this.screen.render();
    }
  }

  updateTable(data) {
    if (this.table) {
      this.table.setData({
        headers: ["Service", "Status", "Last Update"],
        data: data || [],
      });
      this.screen.render();
    }
  }

  updateStats(progress) {
    if (this.info) {
      this.info.updateCycle(this.currentCycle || 0, this.totalCycles || 5);
      this.screen.render();
    }
  }

  updateWallet(walletAddress) {
    if (this.info) {
      this.info.updateWallet(walletAddress);
      this.screen.render();
    }
  }

  updateBalance(balance) {
    if (this.info) {
      this.info.updateBalance(balance);
      this.screen.render();
    }
  }

  updateStatus(status) {
    if (this.info) {
      this.info.updateStatus(status);
      this.screen.render();
    }
  }

  updateNetwork(network) {
    if (this.info) {
      this.info.updateNetwork(network);
      this.screen.render();
    }
  }

  updateTokens(tokens) {
    if (this.info) {
      this.info.updateTokens(tokens);
      this.screen.render();
    }
  }

  updateLineChart(data) {
    try {
      if (!this.lineChart) return;
      if (!Array.isArray(data)) data = [];

      const series = [
        {
          title: "Transactions",
          x: data.map((d) => d.time || new Date().toLocaleTimeString()),
          y: data.map((d) => Number(d.amount) || 0),
          style: { line: "yellow" },
        },
      ];

      const maxAmount = Math.max(...series[0].y, 0.1);
      this.lineChart.options.maxY = maxAmount * 1.2;

      this.lineChart.setData(series);
      this.screen.render();
    } catch (error) {
      console.error("Error updating line chart:", error);
    }
  }

  setCycles(current, total) {
    if (this.info) {
      this.currentCycle = current;
      this.totalCycles = total;
      this.info.updateCycle(current, total);
      this.screen.render();
    }
  }
}

module.exports = Dashboard;
