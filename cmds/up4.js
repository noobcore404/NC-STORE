const pidusage = require("pidusage");
const si = require("systeminformation");

module.exports = {
  config: {
    name: "up4",
    aliases: ["4", "upt4"],
    version: "2.2",
    author: "NC-AZAD",
    countDown: 5,
    role: 0,
    shortDescription: "system uptime",
    longDescription: "Dashboard with CPU, owner, and GC count",
    category: "system"
  },

  ncStart: async function ({ api, event }) {

    const buildPanel = async () => {
      const uptime = process.uptime();
      const d = Math.floor(uptime / 86400);
      const h = Math.floor((uptime % 86400) / 3600);
      const m = Math.floor((uptime % 3600) / 60);
      const s = Math.floor(uptime % 60);

      const mem = await si.mem();
      const load = await pidusage(process.pid);
      const cpu = await si.cpu();

      let gcCount = 0;
      try {
        const threads = await api.getThreadList(100, null, ["INBOX"]);
        gcCount = threads.filter(t => t.isGroup).length;
      } catch {}

      const now = new Date();
      const date = now.toLocaleDateString("en-US");
      const time = now.toLocaleTimeString("en-US", { hour12: false });

      return `
╔═════════════════════╗
║        ⚡ BOT SYSTEM ⚡
╠═════════════════════╣
║ ⏳ Uptime   : ${d}d ${h}h ${m}m ${s}s
║ 📅 Date     : ${date}
║ 🕒 Time     : ${time}
║
║ 🔥 CPU Load : ${load.cpu.toFixed(1)}%
║ 🧩 CPU Cores: ${cpu.cores}
║ 🧵 Threads  : ${cpu.processors}
║ 💾 RAM Used : ${(mem.used / 1024 ** 3).toFixed(2)} GB
║ 💾 RAM Total: ${(mem.total / 1024 ** 3).toFixed(2)} GB
║ 👥 Group Chats : ${gcCount}
║
║ ⚙️ PID      : ${process.pid}
║ 🛠 Node.js  : ${process.version}
║ 🧘‍♂️ Owner   : Team_NoobCore
╠═════════════════════╣
║        ✅ SYSTEM RUNNING
╚═════════════════════╝
`;
    };
    
    const panel = await buildPanel();
    const msg = await api.sendMessage(panel, event.threadID);
    
    setInterval(async () => {
      try {
        const update = await buildPanel();
        await api.editMessage(update, msg.messageID, event.threadID);
      } catch {}
    }, 5000);
  }
};
