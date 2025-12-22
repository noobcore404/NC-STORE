const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
	config: {
		name: "tiktok",
		aliases: ["tt", "tok", "tktk"],
		version: "1.2",
		author: "𝑵𝑪-𝑨𝒁𝑨𝑫",
		countDown: 5,
		role: 0,
		description: {
			en: "Send random TikTok video by search keyword"
		},
		category: "media",
		usePrefix: false,
		guide: {
			en: "   {pn} <keyword>\n   Example: {pn} funny"
		}
	},

	langs: {
		en: {
			noKeyword: "⚠️ | Please enter a search keyword!",
			searching: "🔍 | Searching for \"%1\"...",
			noResult: "❌ | No video found!",
			errorFetch: "❌ | Error fetching video!",
			errorSave: "❌ | Error saving video!"
		}
	},
	
	ncStart: async function ({ message, args, getLang }) {
		return this.handleRun({ message, args, getLang });
	},
	
	onChat: async function ({ message, event, getLang }) {
		const body = (event.body || "").toLowerCase();
		if (!body.startsWith("tt ") && !body.startsWith("tiktok ")) return;

		const args = body.split(" ").slice(1);
		return this.handleRun({ message, args, getLang });
	},
	
	handleRun: async function ({ message, args, getLang }) {
		try {
			const query = args.join(" ");
			if (!query) return message.reply(getLang("noKeyword"));

			await message.reply(getLang("searching", query));

			const apiUrl =
				`https://azadx69x-tiktok-api.vercel.app/tiktok/search?query=${encodeURIComponent(query)}`;
			const { data } = await axios.get(apiUrl);

			if (!data?.list?.length) {
				return message.reply(getLang("noResult"));
			}

			const random = data.list[Math.floor(Math.random() * data.list.length)];
			const videoUrl = random.play;
			const title = random.title || "Unknown";
			const author = random.author?.nickname || "Unknown";

			const filePath = path.join(__dirname, `tiktok_${Date.now()}.mp4`);

			const writer = fs.createWriteStream(filePath);
			const response = await axios({
				url: videoUrl,
				responseType: "stream"
			});

			response.data.pipe(writer);

			writer.on("finish", async () => {
				await message.reply({
					body:
`━━━━━━━━━━━━━━━━━━━━━
✨ TikTok Video Fetched!
━━━━━━━━━━━━━━━━━━━━━
🔍 Search : ${query}
🎞️ Title  : ${title}
👤 Creator: ${author}

💫 Made by: 𝑵𝑪-𝑨𝒁𝑨𝑫
━━━━━━━━━━━━━━━━━━━━━`,
					attachment: fs.createReadStream(filePath)
				});

				fs.unlinkSync(filePath);
			});

			writer.on("error", () => {
				message.reply(getLang("errorSave"));
			});

		} catch (err) {
			console.error(err);
			return message.reply(getLang("errorFetch"));
		}
	}
};
