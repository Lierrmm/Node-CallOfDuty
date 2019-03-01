const axios = require('axios');
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

        var urlInput = defaultBaseURL + util.format("crm/cod/v2/title/%s/platform/%s/gamer/%s/profile/type/mp", blackops4, platform, gamertag);
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
            method: 'get',
            url: urlInput,
            headers: {
                "content-type": "application/json",
                "User-Agent": userAgent,
                'Cookie': "CRM_BLOB=eyJ2ZXIiOjEsInBsYXQiOnsicCI6eyJ2IjowLCJ0Ijp7Ind3aWkiOnsibXAiOm51bGwsInoiOm51bGwsInByZXMiOjEuMCwic3AiOjAuMCwibGV2Ijo0NC4wfX19fX0; new_SiteId=cod; comid=cod; XSRF-TOKEN=62c38bef-de40-405b-abf3-c549f1eef9f9; ACT_SSO_LOCALE=en_US; agegate=; country=GB; utkn=eyJhbGciOiAiUlNBLU9BRVAiLCAiZW5jIjogIkExMjhDQkMtSFMyNTYiLCAia2lkIjogInVtYl8xIn0.gkcLsRMh_bNTJ0Ds3nNgbNMnjQVdwNlvyAHkNlX6RSVTnc4pBdVnt09GEQ_xC3TWCD5XeYNfi1YUlMcGn5IxOhGYHZzR0Wr6ek6sZZNe2iWHR_DJoIViwciBV17lp2kOfBtOwui20GCPuKMxxDY0a0pDGMPI4ZBOPb3yZoi137c.CjewSZcIH72R7jbCjXtvKQ._Mn85OcYPqol7dvFYmNQZULT70-dwrxrT6Bk6Drx7P7ZUuM6t54cJVoMXmFdwpczP1C0W4yLpd4L3c1H66yo4q-1U0g0K6L05J2xiXjsDwckWCN2JL9WXaEcN8_0O13v-3lyBE6tB-kNcRUpUFwp7faEHQWPf_17TJ1Q1nf1qBNKyf0VnMl8kR47JzsYMehaSfCaO8EG1WP22NFlCIlHyKzLVCvy8yGjLHPBa_SlLI4_VmNSC0cQ3pxpnb4pL4HaMqX2JbH63CS-9Y2dVXuIpjBrNQACd8ZyJB0k1XB9EeJs5aS_c0LXsqFo9rBcS9th4aCJlGOB2iAVQw515_I_MQ.4aYtAi1U7ia6AjL6M4B7LQ; sso_invalidate_cache=true; battleId=true; SSO_REDIRECTED_AT_LOGIN=https://my.callofduty.com/wwii/dashboard; ACT_SSO_COOKIE=MTQ0OTE2NTk5NDg2MjE1ODcwMDI6MTU0MTAwOTg1MDcyMTplM2RkODFmNTQ1ZGQ0MTdjNWExYjI4ZGNmYzg4ZjBhNw; s_ACT_SSO_COOKIE=MTQ0OTE2NTk5NDg2MjE1ODcwMDI6MTU0MTAwOTg1MDcyMTplM2RkODFmNTQ1ZGQ0MTdjNWExYjI4ZGNmYzg4ZjBhNw; atkn=eyJhbGciOiAiUlNBLU9BRVAiLCAiZW5jIjogIkExMjhDQkMtSFMyNTYiLCAia2lkIjogInVub18xIn0.AX477sXh2lqSRyA9WagLBblsrCejFTsAXMvB8Z2P0RTCBEa3-dk4uaaTLRjD8yJWXwAtmTyNZcZHJQHgVTz9MnKVcnW9LqkM_G96S_65H-auyx0X2jne20oTB5qy4KSzhjZTp4EkWIsugtVSWgKdzrv6o4LVNR7wNT9X1PYe7Y4.MSz5LuCqA-4QxurukiZGQQ.P_3TFmjHTDTi08dzVDj5IxYY_GuG0dBMuAo2Uu_r_k98Tq-7JMVUFZBsJxCN-aEPwyRShSgOfRLxC1IqeyvPKOzZHJSuXLF1K_hPqhGiXoySQpx_C6Hx-VocoD6E5AsEAnt8KKIKfc608AdnWKJwvpLzAfr8LgDIh-6ydlYxozvxJuBznCdlz0NcMEOSI389r1Pg6zv-O9XMcekBv5YD7f3BTjRVxmzAiVOfBqqhsBrrY_LOPhoiPbKO0V5CiE3P5b3rhRIP1RHTNE5AkW6OAQ.NuaeNO954QtFhc9uu4SkrA; rtkn=eyJhbGciOiAiUlNBLU9BRVAiLCAiZW5jIjogIkExMjhDQkMtSFMyNTYiLCAia2lkIjogInVub18xIn0.XIHvvzbjCB-lLLpQZ4u7UdfjrX4Pd0u7LZbmJOtGj4V5mtYb9Re6L2q3n1HhTI6U2pvsjVc4_W-mpQdzor6llbYduE2YmPVqzGTTPAjfziHAxdVJQiAumqjoxwDcIi9vcdb5DmoeqteT_Li_aU9QeQoRlT2AIrjQ2i9Ry_FVyp0.K-N4AfnZrn4wzhmvDHw3Jw._I23L11j2ALN0qxd1s7-pnpJ4bvcYplpgWODLu2Dbx0eMSrTNhUHkSqKLDI0ahPIDNBgtmqf4zY3M04yVdR7tVGCSIZQkgzqUBizmR4oaZAzQzKRPi42kD7-zXm00BdrYkQBGrwhrYgWJMdIBQZWP1Bj1eepMoyWeixkFBDe4qR-WxXO2SRrX1kpB_SyoFpwFxStvkiyPiU41hidzf9dTWXVbhF8sE4AGX5LYlOd7f1Jh6sgQMH3pwtlxcRzOMAqb4PuWNcwmgSg067pbk0nWQ.-pOhMxIQyTGPzM-RCiG9eA; ACT_SSO_REMEMBER_ME=MTQ0OTE2NTk5NDg2MjE1ODcwMDI6JDJhJDEwJEFqUXEzaE9GTW1hRzhWRC9ndENBUnU0RjRpOTJNaUc0V1pYT1duOWxvekxwdFpXYUdYd3px; ACT_SSO_EVENT=LOGIN_SUCCESS:1539800251426; pgacct=psn; umbrellaId=3306746010444912014; facebookId=true; psnId=true; twitchId=true; twitterId=true; youTubeId=true; firstName=; lastName=; username=",
            }
        };
        axios(options).then(body => {
            resolve(body.data);
        }).catch(err => reject(err));
    });
}