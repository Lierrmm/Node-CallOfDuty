const axios = require('axios');
const util = require("util");
const defaultBaseURL = "https://my.callofduty.com/api/papi-client/";
const userAgent = "Node-Cod/1.0.24";

const infiniteWarfare = "iw";
const worldWar2 = "wwii";
const blackops3 = "bo3";
const blackops4 = "bo4";
const modernwarfare = "mw";

axios.defaults.headers.common["content-type"] = "application/json";
axios.defaults.headers.common["User-Agent"] = userAgent;
axios.defaults.headers.common.Cookie = "check=true; s_dfa=activision.prd; AMCVS_0FB367C2524450B90A490D4C%40AdobeOrg=1; _gcl_au=1.1.1054704054.1553245601; _fbp=fb.1.1553245601500.2028367329; AMCV_0FB367C2524450B90A490D4C%40AdobeOrg=-1303530583%7CMCIDTS%7C17978%7CMCMID%7C61818798060188250940415165245687586980%7CMCAAMLH-1553850401%7C6%7CMCAAMB-1553850401%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1553252801s%7CNONE%7CMCAID%7CNONE%7CvVersion%7C3.3.0; s_ppvl=https%253A%2F%2Fwww.callofduty.com%2Fuk%2Fen%2F%2C100%2C100%2C979%2C1122%2C979%2C1920%2C1080%2C1%2CL; s_cc=true; AAMC_activisionblizzardin_0=REGION%7C6; mbox=session#a5a96a6fc4104b5d9d27124b428b9e7b#1553247575|PC#a5a96a6fc4104b5d9d27124b428b9e7b.26_10#1616490402; XSRF-TOKEN=68e8b62e-1d9d-4ce1-b93f-cbe5ff31a041; new_SiteId=cod; comid=cod; gpv_c8=callofduty%3Ahub%3Ahome; ACT_SSO_LOCALE=en_US; s_ppv=callofduty%253Ahub%253Ahome%2C30%2C31%2C979%2C1346%2C979%2C1920%2C1080%2C1%2CL; s_nr=1553245754054-New; s_sq=activision.prd%3D%2526c.%2526a.%2526activitymap.%2526page%253Dcallofduty%25253Ahub%25253Ahome%2526link%253DMY%252520CALL%252520OF%252520DUTY%2526region%253DBODY%2526pageIDType%253D1%2526.activitymap%2526.a%2526.c%2526pid%253Dcallofduty%25253Ahub%25253Ahome%2526pidt%253D1%2526oid%253Dhttps%25253A%25252F%25252Fmy.callofduty.com%25252Fuk%25252Fen%2526ot%253DA; SSO_REDIRECTED_AT_LOGIN=https://my.callofduty.com/uk/en/dashboard; ACT_SSO_COOKIE=MTQ0OTE2NTk5NDg2MjE1ODcwMDI6MTU1NDQ1NTM1NjMwNjo2NmM3OTkzNTlhYTk0ODQ0OWQ2ODE3OTQ1ZjdkNWQyYw; s_ACT_SSO_COOKIE=00; atkn=eyJhbGciOiAiUlNBLU9BRVAiLCAiZW5jIjogIkExMjhDQkMtSFMyNTYiLCAia2lkIjogInVub18xIn0.PqqRf9LvYpg7blrqSIhl5Ijt7lSOOaiDDjHMx1an1Q5eRjXrsn2biO3844D9WuDroVwZOLW-QgCpy91RENYrAyeTgb6igFqXXDZzdFFBAjCuNU923kwTxGS6KGh2bUHk3toYBiW8vUmGMQCv0X5d8FAMmhImOgC5IJBullAugAE.LWdQYIZGxB5FJvbut27b1w.Xk_F5I4RIgTTQxE9KR9FvnwoRALIfG_QCtqgIbEF1mPe9W6m5F_M0E7YEhB9_u0zW1biIJ1gfjOcUKkqD6YwjKnojqI3bBDBQvHl9QmWdDKi1RLcMxlaa03Umb0aFeWdKxcX3lG7Je09FaLxPpiK_Ot1En39T6RACd6GUhmAXckZILTOtUKK4pbUjI6GBy_QKD0xRNGLi3ZQPCANEOSgL2qA-LcQNP5aa3BVbphBREUdaF-ONqa3cGx9Qrj6zi1tf0X3m6bgRyzeEiJyZhSZoPopumaE0uc6bJkjK07XIrP1gPH2sqxSh6oBL2Ize6H_STfyFn3GyOtaqxbhM0t-3tRg47a1NlyBqjUGpzbj20KfvVJdO1fpd1XiDzzFqj1yeegPGv6FLgfcPoyva8vL2v40vwmjmf-EWmUSHhq8oqoICvSsRYCKgvsb-M3bdD0Et9loa112UR169lc2w9xvljbCODh780jkFw4L6sMogVvUiGJu8vj0OGMxZnwwofG4dKAXeXGinMTH5i6JF_Sl7k9KrCjG3Ij9rA3UFylZ76U.aTc-58SN1wfbXhH1vZQRzg; rtkn=eyJhbGciOiAiUlNBLU9BRVAiLCAiZW5jIjogIkExMjhDQkMtSFMyNTYiLCAia2lkIjogInVub18xIn0.H_RFSOIclb7gNZ8UwQYFk3KsGB_kIjb12ernpheOIoSZlHkKjVfDdvKGWzZnQbMi5f_98fCRoQl_5GQPOKdpJdFbIrtUrESb-0udhuc0JNfApRDocb06ZOOD1EKelh1xoab6aCAG-KyY5muyL2RG3aGowENWsRsiMpaIznMchpc.a7RTG86crE72z4aXpUjLvg.3MXYDWiEsL52YeKovMvwzLftviEL2f69YRyp0z-mNWbYvWYuzJS5rSaFd1W6ZdDiqA7XgIphfR1MpiFaqfweii0-vVNpW-WtiZvD8BNQcObMpNM7DO6wjBCavra12USmEgv7jYx2FhEEz8KkmtRUgfFQA5iJCnzoUptkvPPECxJlSxf4aBUjrmeHTk662PAU82LUhWt8kUFmtDfzqnQiNlZdc5gFTJsI3mq52bke_FfxLwj3IAMyAfzh53FyeAhM5lH12EFcvBc-GiUxc3TuIbu5fTAEvsHiqwsEYcy_HoKZ-giDwN1SrKeTKX2Gb398A6b-pYUO9SO0WFulQic7F40bH_8FQdBB93iZ5aDOMLshqTAcoCZvPkUdd_xiXbpuXu4lcNCyGcQlnsjKYXsUor8uQcRffi8ARO0q9LA-iOKJ00JYkWV8SMojef5j-6Di_liOACkbOPbBw0Xx8W3ZOmGeX098aniBM54S55cDdZDveMFZcpDtuQYcAfnDglAxBxFnx62WY8vR9a-8foWVKJeVB68Xm6pCaPp6s6KHdPRLEduJq2-T_3DWoEwtSS-_hm8-5oYZTaN52rTjtw-CIA.SvXszntJbbi7ZyCTahr_8g; ACT_SSO_REMEMBER_ME=MTQ0OTE2NTk5NDg2MjE1ODcwMDI6JDJhJDEwJGxNY2kvNVFDT2JWNkVWYk55RGxIdE83WnN1TDRrYzlsdVdPc3oxRWNHRlBtMVZnLzhOcGVp; ACT_SSO_EVENT=LOGIN_SUCCESS:1553245756744; pgacct=psn; CRM_BLOB=eyJ2ZXIiOjEsInBsYXQiOnt9fQ; agegate=; country=GB; umbrellaId=14046028513701392872; facebookId=true; psnId=true; twitchId=true; twitterId=true; youTubeId=true";

module.exports = function(config = {}) {
    var module = {};
    if(config.platform == undefined) config.platform = "psn";

    module.platforms = {
        battle: "battle",
        steam: "steam", 
        psn: "psn", 
        xbl: "xbl",
        acti: "uno"
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
            if (platform === "battle") gamertag = gamertag.replace("#", "%23");
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/profile/type/mp", blackops4, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.BO4zm = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for BO4. Try `battle` instead.");
            if (platform === "battle") gamertag = gamertag.replace("#", "%23");
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/profile/type/zm", blackops4, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    }; 

    module.BO4mp = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for BO4. Try `battle` instead.");
            if (platform === "battle") gamertag = gamertag.replace("#", "%23");
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/profile/type/mp", blackops4, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.BO4blackout = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for BO4. Try `battle` instead.");
            if (platform === "battle") gamertag = gamertag.replace("#", "%23");
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
            if (platform === "battle") gamertag = gamertag.replace("#", "%23");
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/matches/mp/start/0/end/0/details", blackops4, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.BO4combatzm = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for BO4. Try `battle` instead.");
            if (platform === "battle") gamertag = gamertag.replace("#", "%23");
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/matches/zombies/start/0/end/0/details", blackops4, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };
    
    module.BO4combatbo = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for BO4. Try `battle` instead.");
            if (platform === "battle") gamertag = gamertag.replace("#", "%23");
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
            if (platform === "battle" || platform === "uno") gamertag = gamertag.replace("#", "%23");
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/matches/mp/start/0/end/0/details", modernwarfare, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.MWcombatwz = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for MW. Try `battle` instead.");
            if (platform === "battle" || platform === "uno") gamertag = gamertag.replace("#", "%23");
            var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/matches/wz/start/0/end/0/details", modernwarfare, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.MWmp = function (gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for MW. Try `battle` instead.");
            if (platform === "battle" || platform == "uno") gamertag = gamertag.replace("#", "%23");
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
            if (platform === "battle" || platform === "uno") gamertag = gamertag.replace("#", "%23");
            var urlInput = defaultBaseURL + util.format("stats/cod/v1/title/%s/platform/%s/gamer/%s/profile/type/mp", modernwarfare, platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.MWloot = function(gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for MW. Try `battle` instead.");
            if (platform === "battle") gamertag = gamertag.replace("#", "%23");
            var urlInput = defaultBaseURL + util.format("loot/title/mw/platform/%s/gamer/%s/status/en", platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    module.MWAnalysis = function(gamertag, platform = config.platform) {
        return new Promise((resolve, reject) => {
            if (platform === "steam") reject("Steam Doesn't exist for MW. Try `battle` instead.");
            if (platform === "battle") gamertag = gamertag.replace("#", "%23");
            var urlInput = defaultBaseURL + util.format("ce/v2/title/mw/platform/%s/gametype/all/gamer/%s/summary/match_analysis/contentType/full/end/0/matchAnalysis/mobile/en", platform, gamertag);
            sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
        });
    };

    sendRequest = (url) => {
        return new Promise((resolve, reject) => {
            axios.get(url).then(body => { resolve(body.data.data); }).catch(err => reject(err));
        });
    };
    
    return module;
};