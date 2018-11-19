const request = require("request");
const util = require("util");

const defaultBaseURL = "https://my.callofduty.com/api/papi-client/";
const userAgent = "Node-Cod";

const infiniteWarfare = "iw";
const worldWar2 = "wwii";
const blackops3 = "bo3";
const blackops4 = "bo4";

exports.IwWeekly = function (gamertag, platform) {
    return new Promise((resolve, reject) => {
        var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/summary/", infiniteWarfare, platform, gamertag);
        sendRequest(urlInput)
            .then(data => resolve(data))
            .catch(e => reject(e));
    });
};

exports.IWStats = function (gamertag, platform) {
    return new Promise((resolve, reject) => {
        var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/profile/", infiniteWarfare, platform, gamertag);
        sendRequest(urlInput)
            .then(data => resolve(data))
            .catch(e => reject(e));
    });
};

exports.WWIIWeekly = function (gamertag, platform) {
    return new Promise((resolve, reject) => {
        var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/summary/", worldWar2, platform, gamertag);
        sendRequest(urlInput)
            .then(data => resolve(data))
            .catch(e => reject(e));
    });
};

exports.WWIIStats = function (gamertag, platform) {
    return new Promise((resolve, reject) => {
        var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/profile/", worldWar2, platform, gamertag);
        sendRequest(urlInput)
            .then(data => resolve(data))
            .catch(e => reject(e));
    });
};

exports.BO3Stats = function (gamertag, platform) {
    return new Promise((resolve, reject) => {
        var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/profile/", blackops3, platform, gamertag);
        sendRequest(urlInput)
            .then(data => resolve(data))
            .catch(e => reject(e));
    });
};

exports.BO4Stats = function (gamertag, platform) {
    return new Promise((resolve, reject) => {
        if (platform === "steam") {
            reject("Steam Doesn't exist for BO4. Try `battle` instead.");
        }
        if (platform === "battle") {
            gamertag = gamertag.replace("#", "%23");
        }
        var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/profile/", blackops4, platform, gamertag);
        sendRequest(urlInput)
            .then(data => resolve(data))
            .catch(e => reject(e));
    });
};

exports.BO4zm = function (gamertag, platform) {
    return new Promise((resolve, reject) => {
        if (platform === "steam") {
            reject("Steam Doesn't exist for BO4. Try `battle` instead.");
        }
        if (platform === "battle") {
            gamertag = gamertag.replace("#", "%23");
        }
        var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/profile/type/zm", blackops4, platform, gamertag);
        sendRequest(urlInput)
            .then(data => resolve(data))
            .catch(e => reject(e));
    });
};

exports.BO4mp = function (gamertag, platform) {
    return new Promise((resolve, reject) => {
        if (platform === "steam") {
            reject("Steam Doesn't exist for BO4. Try `battle` instead.");
        }
        if (platform === "battle") {
            gamertag = gamertag.replace("#", "%23");
        }
        var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/profile/type/mp", blackops4, platform, gamertag);
        sendRequest(urlInput)
            .then(data => resolve(data))
            .catch(e => reject(e));
    });
};

exports.BO4blackout = function (gamertag, platform) {
    return new Promise((resolve, reject) => {
        if (platform === "steam") {
            reject("Steam Doesn't exist for BO4. Try `battle` instead.");
        }
        if (platform === "battle") {
            gamertag = gamertag.replace("#", "%23");
        }
        var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/profile/type/wz", blackops4, platform, gamertag);
        sendRequest(urlInput)
            .then(data => resolve(data))
            .catch(e => reject(e));
    });
};

exports.BO4friends = function (gamertag, platform) {
    return new Promise((resolve, reject) => {
        if (platform === "steam") {
            reject("Steam Doesn't exist for BO4. Try `battle` instead.");
        }
        if (platform === "battle") {
            reject("Battlenet Does not support Friends :(");
        }
        var urlInput = defaultBaseURL + util.format("leaderboards/v2/title/%s/platform/%s/time/alltime/type/core/mode/career/gamer/%s/friends", blackops4, platform, gamertag);
        sendRequest(urlInput)
            .then(data => resolve(data))
            .catch(e => reject(e));
    });
};

exports.BO4combatmp = function (gamertag, platform) {
    return new Promise((resolve, reject) => {
        if (platform === "steam") {
            reject("Steam Doesn't exist for BO4. Try `battle` instead.");
        }
        if (platform === "battle") {
            gamertag = gamertag.replace("#", "%23");
        }
        var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/matches/mp/start/0/end/0/details", blackops4, platform, gamertag);
        sendRequest(urlInput)
            .then(data => resolve(data))
            .catch(e => reject(e));
    });
};

exports.BO4combatzm = function (gamertag, platform) {
    return new Promise((resolve, reject) => {
        if (platform === "steam") {
            reject("Steam Doesn't exist for BO4. Try `battle` instead.");
        }
        if (platform === "battle") {
            gamertag = gamertag.replace("#", "%23");
        }
        var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/matches/zombies/start/0/end/0/details", blackops4, platform, gamertag);
        sendRequest(urlInput)
            .then(data => resolve(data))
            .catch(e => reject(e));
    });
};

exports.BO4combatbo = function (gamertag, platform) {
    return new Promise((resolve, reject) => {
        if (platform === "steam") {
            reject("Steam Doesn't exist for BO4. Try `battle` instead.");
        }
        if (platform === "battle") {
            gamertag = gamertag.replace("#", "%23");
        }
        var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/matches/warzone/start/0/end/0/details", blackops4, platform, gamertag);
        sendRequest(urlInput)
            .then(data => resolve(data))
            .catch(e => reject(e));
    });
};

exports.BO4leaderboard = function (platform, page) {
    return new Promise((resolve, reject) => {
        if (platform === "steam") {
            reject("Steam Doesn't exist for BO4. Try `battle` instead.");
        }
        sendRequest(defaultBaseURL + util.format("leaderboards/v2/title/%s/platform/%s/time/alltime/type/core/mode/career/page/%s", blackops4, platform, page))
            .then(data => resolve(data))
            .catch(e => reject(e));
    });
};

function sendRequest(url) {
    return new Promise((resolve, reject) => {
        var urlInput = url;
        var options = {
            url: urlInput,
            headers: {
                "content-type": "application/json",
                "User-Agent": userAgent
            }
        };
        request(options, (e, r, b) => {
            if (e) {
                reject(e);
            }
            resolve(JSON.parse(b).data);
        });
    });
}