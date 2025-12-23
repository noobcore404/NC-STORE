const axios = require("axios");
const path = require("path");
const fs = require("fs");

module.exports = {
  config: {
    name: "animewallpaper",
    aliases: ["aniwall"],
    version: "1.0",
    author: "𝑵𝑪-𝑺𝑨𝑰𝑴",
    team: "NoobCore", 
    role: 0,
    countDown: 5,
    longDescription: {
      en: "Fetch anime wallpapers and return specified number of images.",
    },
    category: "image",
    guide: {
      en: "{pn} <title> - <count>\nExample: {pn} Naruto - 10",
    },
  },

  ncStart: async function ({ api, event, args }) {
    try {
      if (!args[0]) {
        return api.sendMessage(
          `❌ Please provide an anime title.\nExample: /aniwall Naruto - 10`,
          event.threadID,
          event.messageID
        );
      }

      let input = args.join(" ");
      let count = 5;
      if (input.includes("-")) {
        const parts = input.split("-");
        input = parts[0].trim();
        count = parseInt(parts[1].trim()) || 5;
      }
      if (count > 50) count = 50;

      const noobcore = "https://raw.githubusercontent.com/noobcore404/NC-STORE/main/NCApiUrl.json";
      const rawRes = await axios.get(noobcore);
      const apiBase = rawRes.data.apiv1;

      const apiUrl = `${apiBase}/api/anime?title=${encodeURIComponent(input)}`;
      const res = await axios.get(apiUrl);
      const data = res.data?.wallpapers || [];

      if (data.length === 0) {
        return api.sendMessage(
          `❌ No wallpapers found for "${input}".`,
          event.threadID,
          event.messageID
        );
      }

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      const attachments = [];
      for (let i = 0; i < Math.min(count, data.length); i++) {
        try {
          const imgRes = await axios.get(data[i], { responseType: "arraybuffer" });
          const imgPath = path.join(cacheDir, `${i + 1}.jpg`);
          await fs.promises.writeFile(imgPath, imgRes.data);
          attachments.push(fs.createReadStream(imgPath));
        } catch (e) {
          console.warn(`⚠️ Failed to fetch image ${i + 1}:`, e.message);
        }
      }

      const bodyMsg = `✅ Here's your anime wallpapers for "${input}"\n🖼 Total Images: ${attachments.length}`;
      await api.sendMessage(
        { body: bodyMsg, attachment: attachments },
        event.threadID,
        event.messageID
      );

      if (fs.existsSync(cacheDir)) {
        await fs.promises.rm(cacheDir, { recursive: true, force: true });
      }
    } catch (err) {
      console.error("❌ AnimeWallpaper Command Error:", err);
      return api.sendMessage(
        `⚠️ Error: ${err.message}`,
        event.threadID,
        event.messageID
      );
    }
  }
};
