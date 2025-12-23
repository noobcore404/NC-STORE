const { getPrefix } = global.utils;
const { commands, aliases } = global.noobCore;

const PER_PAGE = 50;

function chunkArray(arr, size) {
	const res = [];
	for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
	return res;
}

function capitalize(str) {
	if (!str) return "";
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function normalizeCat(cat) {
	return String(cat || "other").trim().toLowerCase();
}

function fontCat(name) {
	return formatFont(capitalize(name));
}

module.exports = {
	config: {
		name: "help",
		version: "7.1",
		author: "nc xnil6x",
		countDown: 5,
		role: 0,
		autoUnseen: 40,
		usePrefix: true,
		premium: false,
		aliases: ["menu"],
		category: "info",
		cost: "0",

		shortDescription: { en: "Show bot commands by page, category, or single command details" },
		longDescription: {
			en: "Compact help menu — 100 commands per page. Use `help c category_name` to browse categories."
		},
		category: "info",
		guide: {
			en: [
				"{pn}                → list commands by page (100/pg)",
				"{pn} <page>         → open specific page",
				"{pn} <command>      → details for a command",
				"{pn} category       → list all categories",
				"{pn} category <cat> [page] → list commands in a category"
			].join("\n")
		},
		priority: 1
	},

	ncStart: async function ({ message, args, event, role }) {
		const prefix = getPrefix(event.threadID);

		// Build list of available commands
		const all = [];
		for (const [name, cmd] of commands) {
			if (!cmd?.config) continue;
			const cmdRole = typeof cmd.config.role === "number" ? cmd.config.role : 0;
			if (cmdRole > role) continue;
			const cat = normalizeCat(cmd.config.category || "other");
			all.push({ name, category: cat, priority: cmd.priority || 0 });
		}

		// Sorting
		all.sort((a, b) => {
			if (a.category !== b.category) return a.category.localeCompare(b.category);
			if ((b.priority || 0) !== (a.priority || 0)) return (b.priority || 0) - (a.priority || 0);
			return a.name.localeCompare(b.name);
		});

		// Build category index
		const catIndex = all.reduce((acc, item) => {
			if (!acc[item.category]) acc[item.category] = [];
			acc[item.category].push(item.name);
			return acc;
		}, {});

		const pages = chunkArray(all, PER_PAGE);
		const totalPages = Math.max(1, pages.length);

		// No args → page 1
		if (!args.length) return sendPage(1);

		// Category mode
		const first = String(args[0]).toLowerCase();
if (first === "category" || first === "c" || first === "-c" || first === "--category") {

			// show list
			if (!args[1]) return sendCategoryList();

			const rawCat = normalizeCat(args[1]);
			const matchedCat = findCategory(rawCat, Object.keys(catIndex));

			const maybePage = Number(args[2]);
			const pageNum = Number.isInteger(maybePage) && maybePage > 0 ? maybePage : 1;

			if (!matchedCat) {
				return message.reply(
					[
						`❌ Category "${formatFont(args[1])}" not found.`,
						`Available: ${Object.keys(catIndex).map(c => fontCat(c)).join(", ")}`,
						`Use: ${prefix}help category <name> [page]`
					].join("\n")
				);
			}
			return sendCategory(matchedCat, pageNum);
		}

		// Might be a page
		const maybePage = parseInt(args[0], 10);
		if (!isNaN(maybePage) && maybePage >= 1 && maybePage <= totalPages) {
			return sendPage(maybePage);
		}

		// Command details
		const query = args[0].toLowerCase();
		let cmd = commands.get(query);
		if (!cmd && aliases.has(query)) cmd = commands.get(aliases.get(query));

		// If not command but matches category
		if (!cmd) {
			const maybeCat = findCategory(normalizeCat(query), Object.keys(catIndex));
			if (maybeCat) return sendCategory(maybeCat, 1);

			return message.reply(
				`❌ Command or category "${formatFont(query)}" not found.\nTry: ${prefix}help category`
			);
		}

		// Show command details
		const cfg = cmd.config || {};
		const name = cfg.name || "unknown";
		const version = cfg.version || "1.0";
		const author = cfg.author || "unknown";
		const cooldown = cfg.countDown || cfg.cooldown || 1;

		const roleText =
			cfg.role === 0 ? "👥 All Users" :
			cfg.role === 1 ? "👑 Group Admins" :
			cfg.role === 2 ? "🤖 Bot Admins" :
			cfg.role === 3 ? "💻 Creator" :
			"❓ Unknown Role";

		const aliasesList = Array.isArray(cfg.aliases) && cfg.aliases.length ? cfg.aliases.join(", ") : "None";
		const category = cfg.category || "Other";
		const shortDesc = typeof cfg.shortDescription === "string"
			? cfg.shortDescription
			: cfg.shortDescription?.en || "";

		let guide = cfg.guide || "";
		if (typeof guide === "object") guide = guide.en || Object.values(guide)[0] || "";
		guide = (guide || "")
			.replace(/\{prefix\}|\{p\}/g, prefix)
			.replace(/\{name\}|\{n\}/g, name)
			.replace(/\{pn\}/g, prefix + name);

		const premium = cfg.premium || false;
		const cost = cfg.cost || "0";
		const usePrefix = cfg.usePrefix !== false;
		const autoUnseen = cfg.autoUnseen || "off";

		const body =
			`╔══════════════════\n` +
			`║ 📘 Command: ${prefix}${name}\n` +
			`╠══════════════════\n` +
			`║ 📄 Description: ${shortDesc || "No description"}\n` +
			`║ 🗂️ Category: ${fontCat(category)}\n` +
			`║ 🧩 Aliases: ${aliasesList}\n` +
			`║ ⚙️ Version: ${version}\n` +
			`║ ⏳ Cooldown: ${cooldown}s\n` +
			`║ 🧷 Role: ${roleText}\n` +
			`║ 👑 Author: ${author}\n` +
			`║ 💎 Premium Only: ${premium ? "✅ Yes" : "❌ No"}\n` +
			`║ 🧮 Cost: ${cost} 🪙\n` +
			`║ 🔤 Use Prefix: ${usePrefix ? "✅ Yes" : "❌ No"}\n` +
			`════════════════\n` +
			(guide
				? "║ 📜 Usage:\n" +
					guide.split("\n").map(l => "║   " + l).join("\n") +
					"\n"
				: "║ 📜 Usage: No guide available\n") +
			`╚═══════════════`;

		return message.reply({ body });


		// ===================== HELPERS ===================== //

		async function sendPage(pageNum) {
			const page = Math.max(1, Math.min(totalPages, pageNum));
			const items = pages[page - 1] || [];

			const cats = {};
			for (const { name, category } of items) {
				if (!cats[category]) cats[category] = [];
				cats[category].push(name);
			}

			let msg = "";
			msg += `╔═══════════════════════\n`;
			msg += `║📚 𝗔𝗩𝗔𝗜𝗟𝗔𝗕𝗟𝗘 𝗖𝗠𝗗𝗦    \n\n`;
			msg += `╠═══════════════════════\n`;

			for (const cat of Object.keys(cats).sort()) {
				const prettyCat = fontCat(cat);
				const names = cats[cat].sort();
				msg += `\n📂 ${prettyCat} (${names.length})\n${names.join(" • ")}\n`;
			}

			const totalCmds = all.length;
			msg += `\n╠═════════════════════\n`;
			msg += `║ Total Commands: ${totalCmds}\n`;
			msg += `║ ⏪ ${prefix}help ${page} | ${totalPages} ⏩\n`;
			msg += `║ Bot Name : ${global.noobCore.config.nickNameBot}\n`;
			msg += `║ ℹ️ View details: ${prefix}help <command>\n`;
			msg += `║ 🗂️ Browse: ${prefix}help c category_name\n`;
			msg += `║ 👑 Dev: noobCore Team\n`;
			msg += `╚══════════════════════`;

			return message.reply({ body: msg });
		}

		function findCategory(queryCat, catList) {
			if (!queryCat) return null;

			if (catList.includes(queryCat)) return queryCat;

			const starts = catList.find(c => c.startsWith(queryCat));
			if (starts) return starts;

			const includes = catList.find(c => c.includes(queryCat));
			if (includes) return includes;

			return null;
		}

		async function sendCategoryList() {
			const entries = Object.entries(catIndex).sort((a, b) => a[0].localeCompare(b[0]));
			let msg = "";
			msg += `╔═══════════════════════╗\n`;
			msg += `║🗂️ CATEGORIES\n`;
			msg += `╠═══════════════════════╣\n`;

			for (const [cat, names] of entries) {
				msg += `• ${fontCat(cat)} — ${names.length}\n`;
			}

			msg += `╠═══════════════════════╣\n`;
			msg += `║ Use: ${prefix}help c <name> [page]\n`;
			msg += `║ Example: ${prefix}help c tools\n`;
			msg += `╚═══════════════════════╝`;

			return message.reply({ body: msg });
		}

		async function sendCategory(cat, pageNum) {
			const names = (catIndex[cat] || []).sort();
			const prettyCat = fontCat(cat);

			if (!names.length) {
				return message.reply(`❌ No commands in category "${prettyCat}".`);
			}

			const chunks = chunkArray(names, PER_PAGE);
			const total = chunks.length || 1;
			const page = Math.max(1, Math.min(total, pageNum));
			const list = chunks[page - 1];

			let msg = "";
			msg += `╔═══════════════════════╗\n`;
			msg += `║🗂️ CATEGORY: ${prettyCat}\n`;
			msg += `╠═══════════════════════╣\n`;
			msg += list.join(" • ") + "\n";
			msg += `\n╠═══════════════════════╣\n`;
			msg += `║ ${names.length} command(s) | Page ${page}/${total}\n`;
			msg += `║ ℹ️ View details: ${prefix}help <command>\n`;
			msg += `╚═══════════════════════╝`;

			return message.reply({ body: msg });
		}
	}
};


// ✅ Your font function stays unchanged
function formatFont(text) {
	const fontMapping = {
		a: "𝚊", b: "𝚋", c: "𝚌", d: "𝚍", e: "𝚎", f: "𝚏", g: "𝚐", h: "𝚑", i: "𝚒", j: "𝚓",
		k: "𝚔", l: "𝚕", m: "𝚖", n: "𝚗", o: "𝚘", p: "𝚙", q: "𝚚", r: "𝚛", s: "𝚜", t: "𝚝",
		u: "𝚞", v: "𝚟", w: "𝚠", x: "𝚡", y: "𝚢", z: "𝚣",
		A: "𝙰", B: "𝙱", C: "𝙲", D: "𝙳", E: "𝙴", F: "𝙵", G: "𝙶", H: "𝙷", I: "𝙸",
		J: "𝙹", K: "𝙺", L: "𝙻", M: "𝙼", N: "𝙽", O: "𝙾", P: "𝙿", Q: "𝚀", R: "𝚁",
		S: "𝚂", T: "𝚃", U: "𝚄", V: "𝚅", W: "𝚆", X: "𝚇", Y: "𝚈", Z: "𝚉"
	};

	return [...text].map(char => fontMapping[char] || char).join("");
}
