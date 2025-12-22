const A = require("axios");
const B = require("fs-extra");
const C = require("path");
const G = C.join(__dirname, "cache", `rbg_${Date.now()}.png`);
const NC = "https://raw.githubusercontent.com/noobcore404/NC-STORE/refs/heads/main/NCApiUrl.json";

module.exports = {
  config: {
    name: "rbg",
    aliases: ["removebg"],
    version: "0.0.1",
    author: "NC ArYAN",
    team: "NoobCore",
    countDown: 10,
    role: 0,
    category: "image"
  },

  ncStart: async function ({ api, event, args, message }) {
    let D;
    if (event.type === "message_reply") {
      const E = event.messageReply.attachments[0];
      if (["photo", "image"].includes(E?.type)) D = E.url;
    } else if (args[0]?.startsWith("http")) {
      D = args[0];
    }

    if (!D) return message.reply("❌ Please reply to an image.");

    const F = await message.reply("please waiting...");

    try {
      const H = await A.get(NC);
      const I = H.data.aryan;

      const J = await A.get(`${I}/aryan/rbg?imageUrl=${encodeURIComponent(D)}`, {
        responseType: "arraybuffer"
      });

      await B.ensureDir(C.dirname(G));
      B.writeFileSync(G, Buffer.from(J.data));

      await message.reply({
        body: "✅ Background Removed",
        attachment: B.createReadStream(G)
      });
      
      api.unsendMessage(F.messageID);
    } catch (K) {
      api.unsendMessage(F.messageID);
      return message.reply("❌ Error occurred.");
    } finally {
      if (B.existsSync(G)) B.unlinkSync(G);
    }
  }
};
