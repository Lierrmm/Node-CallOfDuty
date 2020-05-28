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
                    if(!data.success) throw Error("Unsuccessful login.");
                    ssoCookie = data.s_ACT_SSO_COOKIE;
                    apiAxios.defaults.headers.common.Cookie = `${baseCookie}rtkn=${data.rtkn};ACT_SSO_COOKIE=${data.s_ACT_SSO_COOKIE};atkn=${data.atkn};`;
                    loggedIn = true;
                    resolve("Successful Login.");
                }).catch((err) => {
                    reject(err.message);
                });
            }).catch((err) => {
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
            brDetails = [];
            brDetails.br = {};
            brDetails.br_dmz = {};
            brDetails.br_all = {};
            this.MWmp(gamertag, platform).then((data) => {
                if(typeof data.lifetime !== "undefined") {
                    if(typeof data.lifetime.mode.br !== "undefined") { data.lifetime.mode.br.properties.title = "br"; brDetails.br = data.lifetime.mode.br.properties; }
                    if(typeof data.lifetime.mode.br_dmz !== "undefined") { data.lifetime.mode.br_dmz.properties.title = "br_dmz"; brDetails.br_dmz = data.lifetime.mode.br_dmz.properties; }
                    if(typeof data.lifetime.mode.br_all !== "undefined") { data.lifetime.mode.br_all.properties.title = "br_all"; brDetails.br_all = data.lifetime.mode.br_all.properties; }
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

    /**
     * TODO: Make this a nicer function
     */
    module.MWweeklystats = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            weeklyStats = [];
            weeklyStats.wz = {};
            weeklyStats.mp = {};
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

    module.sendFriendAction = function(action, unoId) {
        //COD.api.papi.sendFriendAction("invite", "battle", "gamer", "Leafized#1482", (res) => { console.log(res); }, (err) => console.log(err))
        return new Promise((resolve, reject) => {
            var urlInput = defaultBaseURL + util.format(`codfriends/v1/%s/uno/gamer/%s?context=web`, action, gamertag);
            postRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.FuzzySearch = function(query, platform = config.platform) {
        //https://my.callofduty.com/api/papi-client/crm/cod/v2/platform/uno/username/Lierrmm/search
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
            apiAxios.get(url).then(body => {
                if(body.status == 403) reject("Forbidden. You may be IP banned.");
                if(debug === 1) {
                    console.log(`[DEBUG]`, `Round trip took: ${body.headers['request-duration']}ms.`);
                    console.log(`[DEBUG]`, `Response Size: ${JSON.stringify(body.data.data).length} bytes.`);
                }
                if(typeof body.data.data.message !== "undefined" && body.data.data.message.includes("Not permitted"))
                    if(body.data.data.message.includes("user not found")) reject("user not found.");
                    else if(body.data.data.message.includes("rate limit exceeded")) reject("Rate Limited.");
                    else reject(body.data.data.message);
                resolve(body.data.data); 
            }).catch(err => reject(err));
        });
    };
    
    postRequest = (url) => {
        return new Promise((resolve, reject) => {
            if(!loggedIn) reject("Not Logged In.");
            url = "https://my.callofduty.com/api/papi-client/codfriends/v1/invite/battle/gamer/Leafized%231482?context=web";
            apiAxios.post(url, JSON.stringify({})).then(body => {
                if(body.status == 403) reject("Forbidden. You may be IP banned.");
                if(debug === 1) {
                    console.log(`[DEBUG]`, `Round trip took: ${body.headers['request-duration']}ms.`);
                    console.log(`[DEBUG]`, `Response Size: ${JSON.stringify(body.data.data).length} bytes.`);
                }
                if(typeof body.data.data.message !== "undefined" && body.data.data.message.includes("Not permitted"))
                    if(body.data.data.message.includes("user not found")) reject("user not found.");
                    else if(body.data.data.message.includes("rate limit exceeded")) reject("Rate Limited.");
                    else reject(body.data.data.message);
                resolve(body.data.data); 
            }).catch(err => reject(err));
        });
    };

    postReq = (url, data, headers = null) => {
        return new Promise((resolve, reject) => {
            loginAxios.post(url, data, headers).then(response => {
                if(response.status == 403) reject("Forbidden. You may be IP banned.");
                response = response.data;
                resolve(response);
            }).catch((err) => {
                reject(err.message);
            });
        });
    };

    module.apiAxios = apiAxios;

    return module;
};