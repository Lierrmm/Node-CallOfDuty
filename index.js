const axios = require('axios');
const uniqid = require('uniqid');
const rateLimit = require('axios-rate-limit');
const util = require("util");
const crypto = require('crypto');

const userAgent = "Node/1.0.27";
let baseCookie = "new_SiteId=cod; ACT_SSO_LOCALE=en_US;country=US;XSRF-TOKEN=68e8b62e-1d9d-4ce1-b93f-cbe5ff31a041;";
let loggedIn = false;

let apiAxios = axios.create({
    headers: {
      common: {
        "content-type": "application/json",
        "Cookie": baseCookie,
        "userAgent": userAgent
      },
    },
});

let loginAxios = apiAxios;

const defaultBaseURL = "https://my.callofduty.com/api/papi-client/";
const infiniteWarfare = "iw";
const worldWar2 = "wwii";
const blackops3 = "bo3";
const blackops4 = "bo4";
const modernwarfare = "mw";


module.exports = function(config = {}) {
    var module = {};
    if(config.platform == undefined) config.platform = "psn";

    try {
        if(typeof config.ratelimit === "object") apiAxios = rateLimit(apiAxios, config.ratelimit);
    } catch(Err) { console.log("Could not parse ratelimit object. ignoring."); }

    module.platforms = {
        battle: "battle",
        steam: "steam", 
        psn: "psn", 
        xbl: "xbl",
        acti: "uno"
    };

    module.login = function(email, password) {
        return new Promise((resolve, reject) => {
            let randomId = uniqid();
            let md5sum = crypto.createHash('md5');
            let deviceId = md5sum.update(randomId).digest('hex');
            postReq("https://profile.callofduty.com/cod/mapp/registerDevice", { 
                'deviceId': deviceId
            }).then((response) => {
                let authHeader = response.data.authHeader;
                apiAxios.defaults.headers.common.Authorization = `bearer ${authHeader}`;
                apiAxios.defaults.headers.common.x_cod_device_id = `${deviceId}`;
                postReq("https://profile.callofduty.com/cod/mapp/login", { "email": email, "password": password }).then((data) => {
                    if(!data.success) throw Error("Unsuccessful login.");
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

    module.BO4combatzm = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for BO4. Try `battle` instead.");
            if (platform === "battle") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/matches/zombies/start/0/end/0/details", blackops4, platform, gamertag);
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

    module.MWcombatwz = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for MW. Try `battle` instead.");
            if (platform === "battle" || platform === "uno") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/matches/wz/start/0/end/0/details", modernwarfare, platform, gamertag);
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

    module.MWstats = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for MW. Try `battle` instead.");
            if (platform === "battle" || platform === "uno") gamertag = this.cleanClientName(gamertag);
            var urlInput = defaultBaseURL + util.format("stats/cod/v1/title/%s/platform/%s/gamer/%s/profile/type/mp", modernwarfare, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
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

    sendRequest = (url) => {
        return new Promise((resolve, reject) => {
            if(!loggedIn) reject("Not Logged In.");
            apiAxios.get(url).then(body => {
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
                response = response.data;
                resolve(response);
            }).catch((err) => {
                reject(err.message);
            });
        });
    }

    module.apiAxios = apiAxios;

    return module;
};