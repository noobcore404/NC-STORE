const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

/* ===== LOAD API BASE ===== */

const baseApiUrl = async () => {
  const base = await axios.get(
    `https://raw.githubusercontent.com/noobcore404/NC-STORE/refs/heads/main/NCApiUrl.json`,
  );
  return base.data.ncxnil;
};

/* ===== SUPPORTED DOMAINS ===== */

const supportedDomains = [
  "facebook.com", "fb.watch",
  "youtube.com", "youtu.be",
  "tiktok.com",
  "instagram.com", "instagr.am",
  "likee.com", "likee.video",
  "capcut.com",
  "spotify.com",
  "terabox.com",
  "twitter.com", "x.com",
  "drive.google.com",
  "soundcloud.com",
  "ndown.app",
  "pinterest.com", "pin.it"
];

/* ===== MODULE ===== */

module.exports = {
  config: {
    name: "autodl",
    version: "3.1",
    author: "𝑵𝑪-𝑿𝑵𝑰𝑳",
    role: 0,
    shortDescription: "✨ Auto Media Downloader",
    longDescription:
      "Automatically downloads videos or audio from YouTube, Facebook, TikTok, Instagram, Spotify, Twitter, Pinterest & more.",
    category: "utility",
    guide: {
      en: "🔗 Just send any supported media link (https://) and the bot will download it automatically."
    }
  },

  /* ===== ON START ===== */

  ncStart: async function ({ api, event }) {
    

    api.sendMessage(
`╭──「 📥 𝐀𝐮𝐭𝐨 𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝𝐞𝐫 」──╮
│
│ 🔗 Send any media link
│ ⚡ Download starts automatically
│
│ 🌐 Supported:
│ YouTube • Facebook • TikTok
│ Instagram • Spotify • Twitter
│ Pinterest • SoundCloud & more
│
╰────────────────────╯`,
      event.threadID,
      event.messageID
    );
  },

  /* ===== ON CHAT ===== */

  ncPrefix: async function ({ api, event }) {
    const text = event.body?.trim();
    if (!text || !text.startsWith("https://")) return;
    if (!supportedDomains.some(d => text.includes(d))) return;

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      /* ===== API CALL ===== */

      const apiUrl = `${await baseApiUrl()}/api/alldl?url=${encodeURIComponent(text)}`;
      const { data } = await axios.get(apiUrl, { timeout: 30000 });

      if (!data?.success) throw new Error("API response failed");

      const videos = data.videos || [];
      if (!videos.length) throw new Error("No media found");

      /* ===== BEST QUALITY ===== */

      const media = videos[0];
      const mediaURL = media.url;
      const ext = media.extension || "mp4";

      /* ===== DOWNLOAD ===== */

      const buffer = (
        await axios.get(mediaURL, { responseType: "arraybuffer" })
      ).data;

      const filePath = path.join(
        __dirname,
        "cache",
        `AUTODL_${Date.now()}.${ext}`
      );

      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, buffer);

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      /* ===== RESPONSE ===== */

      const info =
`╭─「 ✅ 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 𝐂𝐎𝐌𝐏𝐋𝐄𝐓𝐄 」─╮
│ 🌐 Platform : ${data.platform?.toUpperCase() || "UNKNOWN"}
│ 🎬 Title    : ${data.title || "Unknown"}
│ 👤 Author   : ${data.author || "Unknown"}
╰────────────────────╯`;

      api.sendMessage(
        {
          body: info,
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        () => fs.unlinkSync(filePath),
        event.messageID
      );

    } catch (err) {
      console.error("[AUTODL ERROR]", err.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);

      api.sendMessage(
`「 ❌ 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 𝐅𝐀𝐈𝐋𝐄𝐃 」
│ ⚠️ Unable to fetch media
│ 🔁 Try another link
│ ⏰ Or try again later`,
        event.threadID,
        event.messageID
      );
    }
  }
};
