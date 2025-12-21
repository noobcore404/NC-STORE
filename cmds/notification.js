const { getStreamsFromAttachment } = global.utils;

module.exports = {
	config: {
		name: "notification",
		aliases: ["notify", "noti"],
		version: "1.8",
		author: "𝑵𝑪-𝑨𝒁𝑨𝑫",
		countDown: 5,
		role: 2,
		description: {
			vi: "Gửi thông báo từ admin đến all box",
			en: "Send notification from admin to all box"
		},
		category: "owner",
		guide: {
			en: "{pn} <your message>"
		},
		envConfig: {
			delayPerGroup: 250
		}
	},

	langs: {
		vi: {
			noPermission: "⛔ | Bạn không có quyền sử dụng lệnh này",
			missingMessage: "⚠️ | Vui lòng nhập nội dung thông báo",
			sendingNotification: "📣 | Bắt đầu gửi thông báo đến %1 nhóm chat",
			sentNotification: "✅ | Đã gửi thông báo thành công đến %1 nhóm",
			errorSendingNotification: "❌ | Lỗi khi gửi đến %1 nhóm:\n%2"
		},
		en: {
			noPermission: "⛔ | Permission denied",
			missingMessage: "⚠️ | Please enter notification content",
			sendingNotification: "📣 | Start sending notification to %1 chat groups",
			sentNotification: "✅ | Sent notification to %1 groups successfully",
			errorSendingNotification: "❌ | Error while sending to %1 groups:\n%2"
		}
	},

	ncStart: async function ({
		message,
		api,
		event,
		args,
		commandName,
		envCommands,
		threadsData,
		getLang
	}) {
		const owners = global.GoatBot.config.owner || [];
		if (!owners.includes(event.senderID)) {
			return message.reply(getLang("noPermission"));
		}

		if (!args[0]) {
			return message.reply(getLang("missingMessage"));
		}

		const { delayPerGroup } = envCommands[commandName];
		
		const allThreads = (await threadsData.getAll()).filter(
			t =>
				t.isGroup &&
				t.members.find(m => m.userID == api.getCurrentUserID())?.inGroup
		);

		message.reply(getLang("sendingNotification", allThreads.length));
		
		const attachment = await getStreamsFromAttachment(
			[
				...event.attachments,
				...(event.messageReply?.attachments || [])
			].filter(item =>
				["photo", "png", "animated_image", "video", "audio"].includes(item.type)
			)
		);

		const messageBody = args.join(" ");
		let sendSuccess = 0;
		const sendError = [];
		const waitingSend = [];
		
		for (const thread of allThreads) {
			const groupName = thread.threadName || "This group";

			const formSend = {
				body:
					`👥 ${groupName}\n` +
					`━━━━━━━━━━━━━━\n` +
					`📢 Notification From Admin Bot\n\n` +
					`📝 ${messageBody}\n` +
					`━━━━━━━━━━━━━━`,
				attachment
			};

			try {
				waitingSend.push({
					threadID: thread.threadID,
					pending: api.sendMessage(formSend, thread.threadID)
				});
				await new Promise(res => setTimeout(res, delayPerGroup));
			} catch (e) {
				sendError.push({
					threadIDs: [thread.threadID],
					errorDescription: e.message || "Unknown error"
				});
			}
		}
		
		for (const sent of waitingSend) {
			try {
				await sent.pending;
				sendSuccess++;
			} catch (e) {
				const desc = e.errorDescription || e.message || "Unknown error";
				const exist = sendError.find(i => i.errorDescription === desc);
				if (exist) {
					exist.threadIDs.push(sent.threadID);
				} else {
					sendError.push({
						threadIDs: [sent.threadID],
						errorDescription: desc
					});
				}
			}
		}
		
		let msg = "";
		if (sendSuccess > 0) {
			msg += getLang("sentNotification", sendSuccess) + "\n";
		}
		if (sendError.length > 0) {
			msg += getLang(
				"errorSendingNotification",
				sendError.reduce((a, b) => a + b.threadIDs.length, 0),
				sendError.reduce(
					(a, b) =>
						a +
						`\n - ${b.errorDescription}\n  + ${b.threadIDs.join("\n  + ")}`,
					""
				)
			);
		}

		return message.reply(msg.trim());
	}
};
