const request = require('request');
const util = require('util');

const defaultBaseURL = "https://my.callofduty.com/api/papi-client/";
const userAgent = "Node-Cod";

const infiniteWarfare = "iw";
const worldWar2 = "wwii";
const blackops3 = "bo3";
const blackops4 = "bo4";

exports.IwWeekly = function (gamertag, platform) {
    return new Promise((resolve, reject) => {
        var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/summary/", infiniteWarfare, platform, gamertag);
        var options = {
            url: urlInput,
            headers: {
                "content-type": "application/json",
                "User-Agent": userAgent
            }
        };
        request(options, (e, r, b) => {
            if (e) reject(e);
            resolve(JSON.parse(b).data);
        });
    });
};

exports.IWStats = function (gamertag, platform) {
    return new Promise((resolve, reject) => {
        var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/profile/", infiniteWarfare, platform, gamertag);
        var options = {
            url: urlInput,
            headers: {
                "content-type": "application/json",
                "User-Agent": userAgent
            }
        };
        request(options, (e, r, b) => {
            if (e) reject(e);
            resolve(JSON.parse(b).data);
        });
    });
};

exports.WWIIWeekly = function (gamertag, platform) {
    return new Promise((resolve, reject) => {
        var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/summary/", worldWar2, platform, gamertag);
        var options = {
            url: urlInput,
            headers: {
                "content-type": "application/json",
                "User-Agent": userAgent
            }
        };
        request(options, (e, r, b) => {
            if (e) reject(e);
            resolve(JSON.parse(b).data);
        });
    });
};

exports.WWIIStats = function (gamertag, platform) {
    return new Promise((resolve, reject) => {
        var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/profile/", worldWar2, platform, gamertag);
        var options = {
            url: urlInput,
            headers: {
                "content-type": "application/json",
                "User-Agent": userAgent
            }
        };
        request(options, (e, r, b) => {
            if (e) reject(e);
            resolve(JSON.parse(b).data);
        });
    });
};

exports.BO3Stats = function (gamertag, platform) {
    return new Promise((resolve, reject) => {
        var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/profile/", blackops3, platform, gamertag);
        var options = {
            url: urlInput,
            headers: {
                "content-type": "application/json",
                "User-Agent": userAgent
            }
        };
        request(options, (e, r, b) => {
            if (e) reject(e);
            resolve(JSON.parse(b).data);
        });
    });
};

exports.BO4Stats = function (gamertag, platform) {
    return new Promise((resolve, reject) => {
        if (platform === "steam") reject("Steam Doesn't exist for BO4. Try `battle` instead.");
        if (platform === "battle") reject("No Endpoint for Battlenet found.");
        var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/profile/", blackops4, platform, gamertag);
        var options = {
            url: urlInput,
            headers: {
                "content-type": "application/json",
                "User-Agent": userAgent
            }
        };
        request(options, (e, r, b) => {
            if (e) reject(e);
            resolve(JSON.parse(b).data);
        });
    });
};

exports.BO4zm = function (gamertag, platform) {
    return new Promise((resolve, reject) => {
        if (platform === "steam") reject("Steam Doesn't exist for BO4. Try `battle` instead.");
        if (platform === "battle") reject("No Endpoint for Battlenet found.");
        var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/profile/type/zm", blackops4, platform, gamertag);
        var options = {
            url: urlInput,
            headers: {
                "content-type": "application/json",
                "User-Agent": userAgent
            }
        };
        request(options, (e, r, b) => {
            if (e) reject(e);
            resolve(JSON.parse(b).data);
        });
    });
};

exports.BO4mp = function (gamertag, platform) {
    return new Promise((resolve, reject) => {
        if (platform === "steam") reject("Steam Doesn't exist for BO4. Try `battle` instead.");
        if (platform === "battle") reject("No Endpoint for Battlenet found.");
        var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/profile/type/mp", blackops4, platform, gamertag);
        var options = {
            url: urlInput,
            headers: {
                "content-type": "application/json",
                "User-Agent": userAgent
            }
        };
        request(options, (e, r, b) => {
            if (e) reject(e);
            resolve(JSON.parse(b).data);
        });
    });
};

exports.BO4blackout = function (gamertag, platform) {
    return new Promise((resolve, reject) => {
        if (platform === "steam") reject("Steam Doesn't exist for BO4. Try `battle` instead.");
        if (platform === "battle") reject("No Endpoint for Battlenet found.");
        var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/profile/type/blackout", blackops4, platform, gamertag);
        var options = {
            url: urlInput,
            headers: {
                "content-type": "application/json",
                "User-Agent": userAgent
            }
        };
        request(options, (e, r, b) => {
            if (e) reject(e);
            resolve(JSON.parse(b).data);
        });
    });
};