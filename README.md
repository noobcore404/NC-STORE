<div align="center">
  <img src="https://files.catbox.moe/mk01q9.jpg" width="100%" style="border-radius:10px;" />
</div>

# 🤖 NOOBCORE BOT V3 COMMAND STORE

**Made by Team_NoobCore**

A powerful & modern Messenger bot framework  
Fast • Stable • Community Driven

---

## 📅 Release Date
noobCore v3 messenger bot Coming Soon

---
### 👤 Developers

- NC Xnil  
- NC Aryan  
- NC Saim  
- NC Fahad  
- NC Azad  
- NC Tanjil  
- NC Toshiro  

---

## 🛡️ Community
**NOOBCORE**  
made by **Team_NoobCore**

---

## 🛠️ Command Configuration Structure

```javascript
module.exports = {
  config: {
    name: "command_name",  // 🔹 Command Name
    version: "1.0",        // 🔸 Version
    premium: true,         //premium require 
    author: "Team NoobCore",  // 👨‍💻 Developer
    role: 3,                  // 🔐 Required Access Level
    usePrefix: true,          // ⛓️ Prefix Requirement
    description: "Command Description", // 📝 Functionality
    guide: "Usage Guide",     // 📘 Command Syntax
    category: "Utility",      // 🧰 Function Category
    cooldowns: 3              // ⏳ Cooldown (seconds)
  },

  // === onStart to ncStart======
  ncStart: async function ({ api, event, args, message }) {
    return message.reply(
      "ncStart function please reply",
      (err, info) => {
        if (err) return;

        global.noobCore.ncReply.set(info.messageID, {
          commandName: this.config.name,
          type: "reply",
          messageID: info.messageID,
          author: event.senderID
        });
      }
    );
  },

  // ==== onReply to ncReply ========
  ncReply: async function ({ api, event, args, message }) {
    // only original author can reply
    const replyData = global.noobCore.ncReply.get(event.messageReply?.messageID);
    if (!replyData) return;
    if (replyData.author !== event.senderID) return;

    return message.reply(`You replied: ${event.body}`);
  },

  // === onChat to ncPrefix ====
  ncPrefix: async function ({ api, event, args, message }) {
    if (event.body === "example") {
      return message.reply("ncPrefix Running");
    }
  }
};
```

---

## 🔐 Role System

| Level | Badge | Access Tier            | Description                  |
|-------|-------|-----------------------|------------------------------|
| 0     | 👥    | Standard User         | All regular members          |
| 1     | ⚔️    | Group admin       | Chat administrators          |
| 2     | 🤖    | Bot admin           | Bot configuration access     |
| 3     | 💻    | Creator         | Bot main controler      |

---

## ⚡ Notes
- This framework is **modular**, you can add or remove commands easily.  
- **Roles must be assigned properly** to prevent unauthorized access.  
- Keep your bot token and sensitive info secure.

---
## 📜 License
© 2025 Team_NoobCore  
Team_NoobCore
