const axios = require('axios');
const uniqid = require('uniqid');
const rateLimit = require('axios-rate-limit');
const cors_proxy = require('./cors');
const util = require("util");
const crypto = require('crypto');

const userAgent = "Node/1.0.27";
let baseCookie = "new_SiteId=cod; ACT_SSO_LOCALE=en_US;country=US;XSRF-TOKEN=68e8b62e-1d9d-4ce1-b93f-cbe5ff31a041;API_CSRF_TOKEN=68e8b62e-1d9d-4ce1-b93f-cbe5ff31a041;";
let ssoCookie;
let loggedIn = false;
let useCORS = 0;
let debug = 0;

let apiAxios = axios.create({
    headers: {
        common: {
            "content-type": "application/json",
            "Cookie": baseCookie,
            "userAgent": userAgent,
            "x-requested-with": userAgent,
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Connection": "keep-alive"
        },
    },
});

let loginAxios = apiAxios;

let defaultBaseURL = "https://my.callofduty.com/api/papi-client/";
let loginURL = "https://profile.callofduty.com/cod/mapp/";
let defaultProfileURL = "https://profile.callofduty.com/";
const defaultCORs = "http://localhost:1337/";
const infiniteWarfare = "iw";
const worldWar2 = "wwii";
const blackops3 = "bo3";
const blackops4 = "bo4";
const modernwarfare = "mw";

module.exports = function(config = {}) {
    var module = {};
    if(config.platform == undefined) config.platform = "psn";
    if(typeof config.useCORS === "number") useCORS = config.useCORS;
    if(useCORS === 1) {
        defaultBaseURL = `${defaultCORs}${defaultBaseURL}`;
        loginURL = `${defaultCORs}${loginURL}`;
        defaultProfileURL = `${defaultCORs}${defaultProfileURL}`;
        cors_proxy.createServer({
            originWhitelist: [],
            requireHeader: ['origin', 'x-requested-with']
        }).listen("1337", "0.0.0.0");
    }

    if(config.debug === 1) {
        debug = 1;
        apiAxios.interceptors.request.use((resp) => {
            resp.headers['request-startTime'] = process.hrtime();
            return resp;
        });

        apiAxios.interceptors.response.use((response) => {
            const start = response.config.headers['request-startTime'];
            const end = process.hrtime(start);
            const milliseconds = Math.round((end[0] * 1000) + (end[1] / 1000000));
            response.headers['request-duration'] = milliseconds;
            return response;
        });
    }

    try {
        if(typeof config.ratelimit === "object") apiAxios = rateLimit(apiAxios, config.ratelimit);
    } catch(Err) { console.log("Could not parse ratelimit object. ignoring."); }


    module.platforms = {
        battle: "battle",
        steam: "steam", 
        psn: "psn", 
        xbl: "xbl",
        acti: "uno",
        uno: "uno",
        all: "all"
    };

    module.login = function(email, password) {
        return new Promise((resolve, reject) => {
            let randomId = uniqid();
            let md5sum = crypto.createHash('md5');
            let deviceId = md5sum.update(randomId).digest('hex');
            postReq(`${loginURL}registerDevice`, { 
                'deviceId': deviceId
            }).then((response) => {
                let authHeader = response.data.authHeader;
                apiAxios.defaults.headers.common.Authorization = `bearer ${authHeader}`;
                apiAxios.defaults.headers.common.x_cod_device_id = `${deviceId}`;
                postReq(`${loginURL}login`, { "email": email, "password": password }).then((data) => {
                    if(!data.success) throw Error("401 - Unauthorized. Incorrect username or password.");
                    ssoCookie = data.s_ACT_SSO_COOKIE;
                    apiAxios.defaults.headers.common.Cookie = `${baseCookie}rtkn=${data.rtkn};ACT_SSO_COOKIE=${data.s_ACT_SSO_COOKIE};atkn=${data.atkn};`;
                    loggedIn = true;
                    resolve("200 - OK. Log in successful.");
                }).catch((err) => {
                    if(typeof err === "string") reject(err);
                    reject(err.message);
                });
            }).catch((err) => {
                if(typeof err === "string") reject(err);
                reject(err.message);
            });  
        });
    };
    

    module.cleanClientName = (gamertag) => {
        return encodeURIComponent(gamertag);
    };

    module.IwWeekly = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/summary/", infiniteWarfare, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.IWStats = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/profile/", infiniteWarfare, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.WWIIWeekly = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/summary/", worldWar2, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.WWIIStats = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/profile/", worldWar2, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };   

    module.WWIIScheduledAchievements = function(gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/wwii/platform/%s/achievements/scheduled/gamer/%s", platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.WWIIAchievements = function(gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/wwii/platform/%s/achievements/gamer/%s", platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.BO3Stats = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/profile/", blackops3, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.BO4Stats = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for BO4. Try `battle` instead.");
            if (platform === "battle") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/profile/type/mp", blackops4, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.BO4zm = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for BO4. Try `battle` instead.");
            if (platform === "battle") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/profile/type/zm", blackops4, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    }; 

    module.BO4mp = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for BO4. Try `battle` instead.");
            if (platform === "battle") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/profile/type/mp", blackops4, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.BO4blackout = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for BO4. Try `battle` instead.");
            if (platform === "battle") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/profile/type/wz", blackops4, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.BO4friends = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for BO4. Try `battle` instead.");
            if (platform === "battle") reject("Battlenet Does not support Friends :(");
            var urlInput = defaultBaseURL + util.format("leaderboards/v2/title/%s/platform/%s/time/alltime/type/core/mode/career/gamer/%s/friends", blackops4, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.BO4combatmp = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for BO4. Try `battle` instead.");
            if (platform === "battle") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/matches/mp/start/0/end/0/details", blackops4, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.BO4combatmpdate = function (gamertag, start = 0, end = 0, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for BO4. Try `battle` instead.");
            if (platform === "battle") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/matches/mp/start/%d/end/%d/details", blackops4, platform, gamertag, start, end);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.BO4combatzm = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for BO4. Try `battle` instead.");
            if (platform === "battle") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/matches/zombies/start/0/end/0/details", blackops4, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.BO4combatzmdate = function (gamertag, start = 0, end = 0, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for BO4. Try `battle` instead.");
            if (platform === "battle") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/matches/zombies/start/%d/end/%d/details", blackops4, platform, gamertag, start, end);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };
    
    module.BO4combatbo = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for BO4. Try `battle` instead.");
            if (platform === "battle") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/matches/warzone/start/0/end/0/details", blackops4, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.BO4combatbodate = function (gamertag, start = 0, end = 0, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for BO4. Try `battle` instead.");
            if (platform === "battle") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/matches/warzone/start/%d/end/%d/details", blackops4, platform, gamertag, start, end);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.BO4leaderboard = function (page, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for BO4. Try `battle` instead.");
            sendRequest(defaultBaseURL + util.format("leaderboards/v2/title/%s/platform/%s/time/alltime/type/core/mode/career/page/%s", blackops4, platform, page))
                .then(data => resolve(data))
                .catch(e => reject(e));
        });
    };

    module.MWleaderboard = function (page, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for MW. Try `battle` instead.");
            sendRequest(defaultBaseURL + util.format("leaderboards/v2/title/%s/platform/%s/time/alltime/type/core/mode/career/page/%s", modernwarfare, platform, page))
                .then(data => resolve(data))
                .catch(e => reject(e));
        });
    };

    module.MWcombatmp = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for MW. Try `battle` instead.");
            if (platform === "battle" || platform === "uno") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/matches/mp/start/0/end/0/details", modernwarfare, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.MWcombatmpdate = function (gamertag, start = 0, end = 0, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for MW. Try `battle` instead.");
            if (platform === "battle" || platform === "uno") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/matches/mp/start/%d/end/%d/details", modernwarfare, platform, gamertag, start, end);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.MWcombatwz = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for MW. Try `battle` instead.");
            if (platform === "battle" || platform === "uno") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/matches/wz/start/0/end/0/details", modernwarfare, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.MWcombatwzdate = function (gamertag, start = 0, end = 0, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for MW. Try `battle` instead.");
            if (platform === "battle" || platform === "uno") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/matches/wz/start/%d/end/%d/details", modernwarfare, platform, gamertag, start, end);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.MWfullcombatmp = function(gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for MW. Try `battle` instead.");
            if (platform === "battle" || platform === "uno") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/matches/mp/start/0/end/0", modernwarfare, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.MWfullcombatmpdate = function (gamertag, start = 0, end = 0, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for MW. Try `battle` instead.");
            if (platform === "battle" || platform === "uno") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/matches/mp/start/%d/end/%d", modernwarfare, platform, gamertag, start, end);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.MWfullcombatwz = function(gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for MW. Try `battle` instead.");
            if (platform === "battle" || platform === "uno") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/matches/wz/start/0/end/0", modernwarfare, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.MWfullcombatwzdate = function (gamertag, start = 0, end = 0, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for MW. Try `battle` instead.");
            if (platform === "battle" || platform === "uno") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/matches/wz/start/%d/end/%d", modernwarfare, platform, gamertag, start, end);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.MWmp = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for MW. Try `battle` instead.");
            if (platform === "battle" || platform == "uno") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("stats/cod/v1/title/%s/platform/%s/gamer/%s/profile/type/mp", modernwarfare, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.MWwz = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for MW. Try `battle` instead.");
            if (platform === "battle" || platform == "uno") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("stats/cod/v1/title/%s/platform/%s/gamer/%s/profile/type/wz", modernwarfare, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.MWBattleData = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            brDetails = {};
            this.MWwz(gamertag, platform).then(data => {
                let lifetime = data.lifetime;
                if(typeof lifetime !== "undefined") {
                    let filtered = Object.keys(lifetime.mode).filter(x => x.startsWith("br")).reduce((obj, key) => {
                        obj[key] = lifetime.mode[key];
                        return obj;
                    }, {});
                    if(typeof filtered.br !== "undefined") { filtered.br.properties.title = "br"; brDetails.br = filtered.br.properties; }
                    if(typeof filtered.br_dmz !== "undefined") { filtered.br_dmz.properties.title = "br_dmz"; brDetails.br_dmz  = filtered.br_dmz.properties; }
                    if(typeof filtered.br_all !== "undefined") { filtered.br_all.properties.title = "br_all"; brDetails.br_all  = filtered.br_all.properties; }
                }
                resolve(brDetails);
            }).catch(e => reject(e));
        });
    };

    module.MWfriends = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for MW. Try `battle` instead.");
            if (platform === "battle") reject(`Battlenet friends are not supported. Try a different platform.`);
            if (platform === "uno") gamertag = this.cleanClientName(gamertag);
            console.log("Will only work for the account you are logged in as");
            const urlInput = defaultBaseURL + util.format('stats/cod/v1/title/%s/platform/%s/gamer/%s/profile/friends/type/mp', modernwarfare, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.MWWzfriends = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for MW. Try `battle` instead.");
            if (platform === "battle") reject(`Battlenet friends are not supported. Try a different platform.`);
            if (platform === "uno") gamertag = this.cleanClientName(gamertag);
            console.log("Will only work for the account you are logged in as");
            const urlInput = defaultBaseURL + util.format('stats/cod/v1/title/%s/platform/%s/gamer/%s/profile/friends/type/wz', modernwarfare, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.MWstats = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for MW. Try `battle` instead.");
            if (platform === "battle" || platform === "uno") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("stats/cod/v1/title/%s/platform/%s/gamer/%s/profile/type/mp", modernwarfare, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };


    module.MWwzstats = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for MW. Try `battle` instead.");
            if (platform === "battle" || platform === "uno") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("stats/cod/v1/title/%s/platform/%s/gamer/%s/profile/type/wz", modernwarfare, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.MWweeklystats = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            weeklyStats = {};
            this.MWstats(gamertag, platform).then((data) => {
                if (typeof data.weekly !== "undefined") weeklyStats.mp = data.weekly;
                this.MWwzstats(gamertag, platform).then((data) => {
                    if (typeof data.weekly !== "undefined") weeklyStats.wz = data.weekly;
                    resolve(weeklyStats);
                }).catch(e => reject(e));
            }).catch(e => reject(e));
        });
    };

    module.MWloot = function(gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for MW. Try `battle` instead.");
            if (platform === "battle" || platform == "uno") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("loot/title/mw/platform/%s/gamer/%s/status/en", platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.MWAnalysis = function(gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for MW. Try `battle` instead.");
            if (platform === "battle" || platform == "uno") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("ce/v2/title/mw/platform/%s/gametype/all/gamer/%s/summary/match_analysis/contentType/full/end/0/matchAnalysis/mobile/en", platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.MWMapList = function(platform = config.platform) {
        return new Promise((resolve, reject) => {
            var urlInput = defaultBaseURL + util.format("ce/v1/title/mw/platform/%s/gameType/mp/communityMapData/availability", platform);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.friendFeed = function(gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "battle" || platform == "uno") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("userfeed/v1/friendFeed/platform/%s/gamer/%s/friendFeedEvents/en", platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.getEventFeed = function () {
        return new Promise((resolve, reject) => {
            var urlInput = defaultBaseURL + util.format(`userfeed/v1/friendFeed/rendered/en/${ssoCookie}`);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.getLoggedInIdentities = function () {
        return new Promise((resolve, reject) => {
            var urlInput = defaultBaseURL + util.format(`crm/cod/v2/identities/${ssoCookie}`);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.getLoggedInUserInfo = function () {
        return new Promise((resolve, reject) => {
            var urlInput = defaultProfileURL + util.format(`cod/userInfo/${ssoCookie}`);
            sendRequestUserInfoOnly(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.sendFriendAction = function(action, type, unoId) {
        return new Promise((resolve, reject) => {
            var urlInput = defaultBaseURL + util.format(`codfriends/v1/%s/uno/%s/%s?context=web`, action, type, unoId);
            postRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.FuzzySearch = function(query, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "battle" || platform == "uno" || platform == "all") query = this.cleanClientName(query);
            var urlInput = defaultBaseURL + util.format(`crm/cod/v2/platform/%s/username/%s/search`, platform, query);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.getBattlePassInfo = function(gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "battle" || platform == "uno") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("loot/title/mw/platform/%s/gamer/%s/status/en", platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.getCodPoints = function(gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "battle" || platform == "uno") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("inventory/v1/title/mw/platform/%s/gamer/%s/currency", platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.getBattlePassLoot = function(season, platform = config.platform) {
        return new Promise((resolve, reject) => {
            var urlInput = defaultBaseURL + util.format("loot/title/mw/platform/%s/list/loot_season_%d/en", platform, season);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.getPurchasable = function(platform = config.platform) {
        return new Promise((resolve, reject) => {
            var urlInput = defaultBaseURL + util.format("inventory/v1/title/mw/platform/%s/purchasable", platform);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };
    
    module.isLoggedIn = function () {
        return loggedIn;
    };
    
    sendRequestUserInfoOnly = (url) => {
        return new Promise((resolve, reject) => {
            if (!loggedIn) reject("Not Logged In.");
            apiAxios.get(url).then(body => {
                if(body.status == 403) reject("Forbidden. You may be IP banned.");
                if (debug === 1) {
                    console.log(`[DEBUG]`, `Round trip took: ${body.headers['request-duration']}ms.`);
                    console.log(`[DEBUG]`, `Response Size: ${JSON.stringify(body.data).length} bytes.`);
                }
                resolve(JSON.parse(body.data.replace(/^userInfo\(/, "").replace(/\);$/, "")));
            }).catch(err => reject(err));
        });
    };
    
    sendRequest = (url) => {
        return new Promise((resolve, reject) => {
            if(!loggedIn) reject("Not Logged In.");
            apiAxios.get(url).then(response => {
                if(debug === 1) {
                    console.log(`[DEBUG]`, `Round trip took: ${response.headers['request-duration']}ms.`);
                    console.log(`[DEBUG]`, `Response Size: ${JSON.stringify(response.data.data).length} bytes.`);
                }

                if (response.data.status !== undefined && response.data.status === 'success') {
                    resolve(response.data.data);
                }
                else {
                    reject(apiErrorHandling(response));
                }
            }).catch((error) => {
                reject(apiErrorHandling(error.response));
            });
        });
    };
    
    postRequest = (url) => {
        return new Promise((resolve, reject) => {
            if(!loggedIn) reject("Not Logged In.");
            url = "https://my.callofduty.com/api/papi-client/codfriends/v1/invite/battle/gamer/Leafized%231482?context=web";
            apiAxios.post(url, JSON.stringify({})).then(response => {
                if(debug === 1) {
                    console.log(`[DEBUG]`, `Round trip took: ${response.headers['request-duration']}ms.`);
                    console.log(`[DEBUG]`, `Response Size: ${JSON.stringify(response.data.data).length} bytes.`);
                }
                
                if (response.data.status !== undefined && response.data.status === 'success') {
                    resolve(response.data.data);
                }
                else {
                    reject(apiErrorHandling(response));
                }
            }).catch((error) => {
                reject(apiErrorHandling(error.response));
            });
        });
    };

    postReq = (url, data, headers = null) => {
        return new Promise((resolve, reject) => {
            loginAxios.post(url, data, headers).then(response => {
                resolve(response.data);
            }).catch((error) => {
                reject(apiErrorHandling(error.response));
            });
        });
    };

    apiErrorHandling = (response) => {

        switch(response.status) {
            case 200:
                const apiErrorMessage = (response.data !== undefined && response.data.data !== undefined && response.data.data.message !== undefined) ? response.data.data.message : (response.message !== undefined ) ? response.message : 'No error returned from API.';
                switch(apiErrorMessage) {
                    case 'Not permitted: user not found':
                        return '404 - Not found. Incorrect username or platform? Misconfigured privacy settings?';
                    case 'Not permitted: rate limit exceeded':
                        return '429 - Too many requests. Try again in a few minutes.';
                    case 'Error from datastore':
                        return '500 - Internal server error. Request failed, try again.';
                    default:
                        return apiErrorMessage;
                }
                break;
            case 401:
                return '401 - Unauthorized. Incorrect username or password.';
            case 403:
                return '403 - Forbidden. You may have been IP banned. Try again in a few minutes.';
            case 500:
                return '500 - Internal server error. Request failed, try again.';
            case 502:
                return '502 - Bad gateway. Request failed, try again.';
            default:
                return `We Could not get a valid reason for a failure. Status: ${response.status}`; 
        }
    };

    module.apiAxios = apiAxios;

    return module;
};
