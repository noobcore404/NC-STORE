module.exports = {
	config: {
		name: "all",
		version: "1.2",
		author: "NC-AZAD",
		countDown: 5,
		role: 1,
		description: {
			vi: "Tag tất cả thành viên trong nhóm chat",
			en: "Tag all members in your group chat"
		},
		category: "box chat",
		guide: {
			vi: "   {pn} [nội dung | để trống]",
			en: "   {pn} [content | empty]"
		}
	},

	langs: {
		vi: {
			noGroup: "⚠️ | Lệnh này chỉ dùng được trong nhóm chat",
			defaultText: "@all"
		},
		en: {
			noGroup: "⚠️ | This command can only be used in group chats",
			defaultText: "@all"
		}
	},

	ncStart: async function ({ message, event, args, getLang }) {
		const { participantIDs, threadID } = event;

		if (!participantIDs || participantIDs.length === 0) {
			return message.reply(getLang("noGroup"));
		}

		const lengthAllUser = participantIDs.length;
		const mentions = [];

		let body = args.join(" ") || getLang("defaultText");
		let bodyLength = body.length;
		let i = 0;

		for (const uid of participantIDs) {
			let fromIndex = 0;
		    
			if (bodyLength < lengthAllUser) {
				body += body[bodyLength - 1];
				bodyLength++;
			}

			if (body.slice(0, i).lastIndexOf(body[i]) !== -1) {
				fromIndex = i;
			}

			mentions.push({
				tag: body[i],
				id: uid,
				fromIndex
			});

			i++;
		}

		return message.reply({
			body,
			mentions
		});
	}
};
