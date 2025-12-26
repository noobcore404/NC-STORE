const fs = require("fs").promises;
const path = require("path");

const ccDataFilePath = path.join(__dirname, "cc.json");

module.exports = {
  config: {
    name: "candycrush",
    aliases: ["cc"],
    version: "1.2",
    author: "NC-AZAD",
    role: 0,
    countDown: 3,
    shortDescription: "🍬 𝗖𝗮𝗻𝗱𝘆 𝗖𝗿𝘂𝘀𝗵 𝗚𝗮𝗺𝗲",
    longDescription: "𝗣𝗹𝗮𝘆 𝗖𝗮𝗻𝗱𝘆 𝗖𝗿𝘂𝘀𝗵, 𝗲𝗮𝗿𝗻 𝗰𝗼𝗶𝗻𝘀 & 𝗰𝗼𝗺𝗽𝗲𝘁𝗲",
    category: "game",
    guide: {
      en:
        "{pn} → start game\n" +
        "{pn} top → leaderboard\n" +
        "Reply: A1 B1"
    }
  },
  
  ncStart: async function ({ event, message, api, args }) {
    if (args[0] === "top") {
      const topPlayers = await getTopPlayers(api);
      if (topPlayers.length === 0)
        return message.reply("⚡ 𝗡𝗼 𝗽𝗹𝗮𝘆𝗲𝗿𝘀 𝘆𝗲𝘁!");

      let msg = "🏆 𝗖𝗔𝗡𝗗𝗬 𝗖𝗥𝗨𝗦𝗛 𝗧𝗢𝗣 𝟱 🏆\n\n";
      topPlayers.forEach((p, i) => {
        msg += `${i + 1}. ${p.username} — 🍬 ${p.coins}\n`;
      });
      return message.reply(msg);
    }

    const candies = ["🍫","🍬","🍪","🍩","🍉","🍭","🍒","🍓"];
    const board = generateBoard(candies);

    global.noobCoreCandy ??= {};
    global.noobCoreCandy[event.threadID] = {
      board,
      initiator: event.senderID,
      lastTime: Date.now(),
      messageID: null
    };

    const sent = await message.reply(displayBoard(board));
    global.noobCoreCandy[event.threadID].messageID = sent.messageID;

    startInactivityTimer(api, event.threadID);
  },
  
  ncPrefix: async function ({ event, message, api }) {
    const game = global.noobCoreCandy?.[event.threadID];
    if (!game) return;
    if (event.senderID !== game.initiator) return;

    game.lastTime = Date.now();

    const input = event.body.trim().toUpperCase().split(" ");
    if (input.length !== 2)
      return message.reply("❌ 𝗙𝗼𝗿𝗺𝗮𝘁: A1 B1");

    if (!isValidInput(input[0]) || !isValidInput(input[1]))
      return message.reply("⚠️ 𝗜𝗻𝘃𝗮𝗹𝗶𝗱 𝗰𝗼𝗼𝗿𝗱𝗶𝗻𝗮𝘁𝗲!");

    const [r1, c1] = getPos(input[0]);
    const [r2, c2] = getPos(input[1]);

    if (!isValidSwap(r1, c1, r2, c2))
      return message.reply("❌ 𝗢𝗻𝗹𝘆 𝗮𝗱𝗷𝗮𝗰𝗲𝗻𝘁 𝘀𝘄𝗮𝗽!");

    swap(game.board, r1, c1, r2, c2);

    const matches = findMatches(game.board);
    if (matches.length === 0) {
      swap(game.board, r1, c1, r2, c2);
      return message.reply("😶 𝗡𝗼 𝗺𝗮𝘁𝗰𝗵!");
    }

    removeMatches(game.board, matches);
    fillEmpty(game.board);

    const reward = matches.length * 100;
    await addCoins(event.senderID, reward);

    const sent = await message.reply(
      displayBoard(game.board) + `\n\n💰 +${reward} coins`
    );

    api.unsendMessage(game.messageID);
    game.messageID = sent.messageID;

    startInactivityTimer(api, event.threadID);
  }
};


function generateBoard(c) {
  return Array.from({ length: 5 }, () =>
    Array.from({ length: 5 }, () => c[Math.floor(Math.random() * c.length)])
  );
}

function displayBoard(board) {
  const rows = ["A","B","C","D","E"];
  let out = "🍬 𝗖𝗔𝗡𝗗𝗬 𝗖𝗥𝗨𝗦𝗛 🍬\n\n";
  board.forEach((r,i)=> out += `${rows[i]} | ${r.join(" ")}\n`);
  return out + "\nReply: A1 B1";
}

function isValidInput(t) { return /^[A-E][1-5]$/.test(t); }
function getPos(t) { return [t.charCodeAt(0)-65, Number(t[1])-1]; }
function isValidSwap(r1,c1,r2,c2){ return Math.abs(r1-r2)+Math.abs(c1-c2)===1; }
function swap(b,r1,c1,r2,c2){ [b[r1][c1],b[r2][c2]]=[b[r2][c2],b[r1][c1]]; }

function findMatches(b){
  const m=[];
  for(let r=0;r<5;r++)
    for(let c=0;c<3;c++)
      if(b[r][c]===b[r][c+1]&&b[r][c]===b[r][c+2])
        m.push([r,c],[r,c+1],[r,c+2]);
  for(let c=0;c<5;c++)
    for(let r=0;r<3;r++)
      if(b[r][c]===b[r+1][c]&&b[r][c]===b[r+2][c])
        m.push([r,c],[r+1,c],[r+2,c]);
  return m;
}

function removeMatches(b,m){ m.forEach(([r,c])=>b[r][c]="⬜"); }
function fillEmpty(b){
  const c=["🍫","🍬","🍪","🍩","🍉","🍭","🍒","🍓"];
  for(let col=0;col<5;col++)
    for(let row=4;row>=0;row--)
      if(b[row][col]==="⬜")
        b[row][col]=c[Math.floor(Math.random()*c.length)];
}

async function getCCData(){
  try { return JSON.parse(await fs.readFile(ccDataFilePath,"utf8")); }
  catch { await fs.writeFile(ccDataFilePath,"{}"); return {}; }
}

async function addCoins(uid,coins){
  const d=await getCCData();
  d[uid]??={coins:0};
  d[uid].coins+=coins;
  await fs.writeFile(ccDataFilePath,JSON.stringify(d,null,2));
}

async function getTopPlayers(api){
  const d=await getCCData(), arr=[];
  for(const uid in d){
    const info=await new Promise(r=>api.getUserInfo(uid,(e,u)=>r(u?.[uid])));
    if(info) arr.push({username:info.name,coins:d[uid].coins});
  }
  return arr.sort((a,b)=>b.coins-a.coins).slice(0,5);
}

function startInactivityTimer(api,tid){
  setTimeout(()=>{
    const g=global.noobCoreCandy?.[tid];
    if(!g) return;
    if(Date.now()-g.lastTime>=20000){
      api.unsendMessage(g.messageID);
      delete global.noobCoreCandy[tid];
    }
  },20000);
}
