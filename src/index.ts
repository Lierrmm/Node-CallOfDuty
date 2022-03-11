import { IncomingHttpHeaders } from "http";
import { request } from "undici";

const userAgent: string = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36";
let baseCookie: string = "new_SiteId=cod; ACT_SSO_LOCALE=en_US;country=US;";
let baseSsoToken: string = '';

interface CustomHeaders extends IncomingHttpHeaders {
    "X-XSRF-TOKEN"?: string | undefined;
    "X-CSRF-TOKEN"?: string | undefined;
    "Atvi-Auth"?: string | undefined;
    "ACT_SSO_COOKIE"?: string | undefined;
    "atkn"?: string | undefined;
    'cookie'?: string | undefined;
    'content-type'?: string | undefined;
};

let baseHeaders: CustomHeaders = { 
    'content-type': 'application/json',
    'cookie': baseCookie,
    'user-agent': userAgent
};

let baseUrl: string = "https://my.callofduty.com";
let apiPath: string = "/api/papi-client";
let loggedIn: boolean = false;

enum platforms  {
    All = 'all',
    Activision = 'acti',
    Battlenet = 'battle',
    PSN = 'psn',
    Steam = 'steam',
    Uno = 'uno',
    XBOX = 'xbl'
};

const sendRequest = async (url: string) => {
    try {
        if (!loggedIn) throw new Error("Not Logged In.");
        let requestUrl = `${baseUrl}${apiPath}${url}`;
        const { body, statusCode } = await request(requestUrl, {
            headers: baseHeaders
        });
        
        let response = await body.json();

        if (statusCode > 299) return response;

        return response;
    }
    catch (exception: unknown) {
        throw exception;
    }
};

const cleanClientName = (gamertag: string): string => {
    return encodeURIComponent(gamertag);
}

const login = (ssoToken: string): boolean => {
    if (!ssoToken || ssoToken.trim().length <= 0) return false;
    let fakeXSRF = "68e8b62e-1d9d-4ce1-b93f-cbe5ff31a041";
    baseHeaders["X-XSRF-TOKEN"] = fakeXSRF;
    baseHeaders["X-CSRF-TOKEN"] = fakeXSRF;
    baseHeaders["Atvi-Auth"] = ssoToken;
    baseHeaders["ACT_SSO_COOKIE"] = ssoToken;
    baseHeaders["atkn"] = ssoToken;
    baseHeaders["cookie"] = `${baseCookie}ACT_SSO_COOKIE=${ssoToken};XSRF-TOKEN=${fakeXSRF};API_CSRF_TOKEN=${fakeXSRF};ACT_SSO_EVENT="LOGIN_SUCCESS:1644346543228";ACT_SSO_COOKIE_EXPIRY=1645556143194;comid=cod;ssoDevId=63025d09c69f47dfa2b8d5520b5b73e4;tfa_enrollment_seen=true;gtm.custom.bot.flag=human;`;
    baseSsoToken = ssoToken;
    loggedIn = true;
    return loggedIn;
};

class WZ {
    fullData = async (gamertag: string, platform: platforms) => {
        let lookupType = "gamer";
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for MW. Try `battle` instead.");
        if (platform === platforms.Battlenet || platform === platforms.Activision || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno) lookupType = "id";
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/stats/cod/v1/title/mw/platform/${platform}/${lookupType}/${gamertag}/profile/type/wz`);
    };

    combatHistory = async (gamertag: string, platform: platforms) => {
        let lookupType = "gamer";
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for MW. Try `battle` instead.");
        if (platform === platforms.Battlenet || platform === platforms.Activision || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno) lookupType = "id";
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/crm/cod/v2/title/mw/platform/${platform}/${lookupType}/${gamertag}/matches/wz/start/0/end/0/details`);
    };

    combatHistoryWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        let lookupType = "gamer";
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for MW. Try `battle` instead.");
        if (platform === platforms.Battlenet || platform === platforms.Activision || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno) lookupType = "id";
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/crm/cod/v2/title/mw/platform/${platform}/${lookupType}/${gamertag}/matches/wz/start/${startTime}/end/${endTime}/details`);
    };

    breakdown = async (gamertag: string, platform: platforms) => {
        let lookupType = "gamer";
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for MW. Try `battle` instead.");
        if (platform === platforms.Battlenet || platform === platforms.Activision || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno) lookupType = "id";
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/crm/cod/v2/title/mw/platform/${platform}/${lookupType}/${gamertag}/matches/wz/start/0/end/0`);
    };

    breakdownWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        let lookupType = "gamer";
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for MW. Try `battle` instead.");
        if (platform === platforms.Battlenet || platform === platforms.Activision || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno) lookupType = "id";
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/crm/cod/v2/title/mw/platform/${platform}/${lookupType}/${gamertag}/matches/wz/start/${startTime}/end/${endTime}`);
    };

    matchInfo = async (matchId: string, platform: platforms) => {
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for MW. Try `battle` instead.");
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/crm/cod/v2/title/mw/platform/${platform}/fullMatch/wz/${matchId}/en`);
    };
}

class MW {
    fullData = async (gamertag: string, platform: platforms) => {
        let lookupType = "gamer";
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for MW. Try `battle` instead.");
        if (platform === platforms.Battlenet || platform === platforms.Activision || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno) lookupType = "id";
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/stats/cod/v1/title/mw/platform/${platform}/${lookupType}/${gamertag}/profile/type/mp`);
    };

    combatHistory = async (gamertag: string, platform: platforms) => {
        let lookupType = "gamer";
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for MW. Try `battle` instead.");
        if (platform === platforms.Battlenet || platform === platforms.Activision || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno) lookupType = "id";
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/crm/cod/v2/title/mw/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/0/end/0/details`);
    };

    combatHistoryWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        let lookupType = "gamer";
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for MW. Try `battle` instead.");
        if (platform === platforms.Battlenet || platform === platforms.Activision || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno) lookupType = "id";
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/crm/cod/v2/title/mw/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/${startTime}/end/${endTime}/details`);
    };

    breakdown = async (gamertag: string, platform: platforms) => {
        let lookupType = "gamer";
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for MW. Try `battle` instead.");
        if (platform === platforms.Battlenet || platform === platforms.Activision || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno) lookupType = "id";
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/crm/cod/v2/title/mw/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/0/end/0`);
    };

    breakdownWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        let lookupType = "gamer";
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for MW. Try `battle` instead.");
        if (platform === platforms.Battlenet || platform === platforms.Activision || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno) lookupType = "id";
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/crm/cod/v2/title/mw/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/${startTime}/end/${endTime}`);
    };

    seasonloot = async (gamertag: string, platform: platforms) => {
        let lookupType = "gamer";
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for MW. Try `battle` instead.");
        if (platform === platforms.Battlenet || platform === platforms.Activision || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno) lookupType = "id";
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/loot/title/mw/platform/${platform}/${lookupType}/${gamertag}/status/en`);
    };

    mapList = async (platform: platforms) => {
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/ce/v1/title/mw/platform/${platform}/gameType/mp/communityMapData/availability`);
    };

    matchInfo = async (matchId: string, platform: platforms) => {
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for MW. Try `battle` instead.");
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/crm/cod/v2/title/mw/platform/${platform}/fullMatch/mp/${matchId}/en`);
    };
}

class CW {
    fullData = async (gamertag: string, platform: platforms) => {
        let lookupType = "gamer";
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for CW. Try `battle` instead.");
        if (platform === platforms.Battlenet || platform === platforms.Activision || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno) lookupType = "id";
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/stats/cod/v1/title/cw/platform/${platform}/${lookupType}/${gamertag}/profile/type/mp`);
    };

    combatHistory = async (gamertag: string, platform: platforms) => {
        let lookupType = "gamer";
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for CW. Try `battle` instead.");
        if (platform === platforms.Battlenet || platform === platforms.Activision || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno) lookupType = "id";
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/crm/cod/v2/title/cw/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/0/end/0/details`);
    };

    combatHistoryWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        let lookupType = "gamer";
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for CW. Try `battle` instead.");
        if (platform === platforms.Battlenet || platform === platforms.Activision || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno) lookupType = "id";
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/crm/cod/v2/title/cw/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/${startTime}/end/${endTime}/details`);
    };

    breakdown = async (gamertag: string, platform: platforms) => {
        let lookupType = "gamer";
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for CW. Try `battle` instead.");
        if (platform === platforms.Battlenet || platform === platforms.Activision || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno) lookupType = "id";
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/crm/cod/v2/title/cw/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/0/end/0`);
    };

    breakdownWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        let lookupType = "gamer";
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for CW. Try `battle` instead.");
        if (platform === platforms.Battlenet || platform === platforms.Activision || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno) lookupType = "id";
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/crm/cod/v2/title/cw/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/${startTime}/end/${endTime}`);
    };

    seasonloot = async (gamertag: string, platform: platforms) => {
        let lookupType = "gamer";
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for CW. Try `battle` instead.");
        if (platform === platforms.Battlenet || platform === platforms.Activision || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno) lookupType = "id";
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/loot/title/cw/platform/${platform}/${lookupType}/${gamertag}/status/en`);
    };

    mapList = async (platform: platforms) => {
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for CW. Try `battle` instead.");
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/ce/v1/title/cw/platform/${platform}/gameType/mp/communityMapData/availability`);
    };

    matchInfo = async (matchId: string, platform: platforms) => {
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for CW. Try `battle` instead.");
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/crm/cod/v2/title/cw/platform/${platform}/fullMatch/mp/${matchId}/en`);
    };
}

class VG {
    fullData = async (gamertag: string, platform: platforms) => {
        let lookupType = "gamer";
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for VG. Try `battle` instead.");
        if (platform === platforms.Battlenet || platform === platforms.Activision || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno) lookupType = "id";
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/stats/cod/v1/title/vg/platform/${platform}/${lookupType}/${gamertag}/profile/type/mp`);
    };

    combatHistory = async (gamertag: string, platform: platforms) => {
        let lookupType = "gamer";
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for VG. Try `battle` instead.");
        if (platform === platforms.Battlenet || platform === platforms.Activision || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno) lookupType = "id";
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/crm/cod/v2/title/vg/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/0/end/0/details`);
    };

    combatHistoryWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        let lookupType = "gamer";
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for VG. Try `battle` instead.");
        if (platform === platforms.Battlenet || platform === platforms.Activision || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno) lookupType = "id";
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/crm/cod/v2/title/vg/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/${startTime}/end/${endTime}/details`);
    };

    breakdown = async (gamertag: string, platform: platforms) => {
        let lookupType = "gamer";
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for VG. Try `battle` instead.");
        if (platform === platforms.Battlenet || platform === platforms.Activision || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno) lookupType = "id";
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/crm/cod/v2/title/vg/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/0/end/0`);
    };

    breakdownWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        let lookupType = "gamer";
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for VG. Try `battle` instead.");
        if (platform === platforms.Battlenet || platform === platforms.Activision || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno) lookupType = "id";
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/crm/cod/v2/title/vg/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/${startTime}/end/${endTime}`);
    };

    seasonloot = async (gamertag: string, platform: platforms) => {
        let lookupType = "gamer";
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for VG. Try `battle` instead.");
        if (platform === platforms.Battlenet || platform === platforms.Activision || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno) lookupType = "id";
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/loot/title/vg/platform/${platform}/${lookupType}/${gamertag}/status/en`);
    };

    mapList = async (platform: platforms) => {
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for VG. Try `battle` instead.");
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/ce/v1/title/vg/platform/${platform}/gameType/mp/communityMapData/availability`);
    };

    matchInfo = async (matchId: string, platform: platforms) => {
        if (platform === platforms.Steam) throw new Error("Steam Doesn't exist for VG. Try `battle` instead.");
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/crm/cod/v2/title/vg/platform/${platform}/fullMatch/mp/${matchId}/en`);
    };
}

class SHOP {
    purchasableItems = async (gameId: string) => {
        return await sendRequest(`/inventory/v1/title/${gameId}/platform/psn/purchasable/public/en`);
    };

    bundleInformation = async(title: string, bundleId: string) => {
        return await sendRequest(`/inventory/v1/title/${title}/bundle/${bundleId}/en`);
    };

    battlePassLoot = async (season: number, platform: platforms) => {
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/loot/title/mw/platform/${platform}/list/loot_season_${season}/en`);
    };
}

class USER {
    friendFeed = async (gamertag: string, platform: platforms) => {
        if (platform === platforms.Battlenet || platform === platforms.Activision || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/userfeed/v1/friendFeed/platform/${platform}/gamer/${gamertag}/friendFeedEvents/en`);
    };

    eventFeed = async() => {
        return await sendRequest(`/userfeed/v1/friendFeed/rendered/en/${baseSsoToken}`);
    };

    loggedInIdentities = async () => {
        return await sendRequest(`/crm/cod/v2/identities/${baseSsoToken}`);
    };

    codPoints = async (gamertag: string, platform: platforms) => {
        if (platform === platforms.Battlenet || platform === platforms.Activision || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/inventory/v1/title/mw/platform/${platform}/gamer/${gamertag}/currency`);
    };

    connectedAccounts = async (gamertag: string, platform: platforms) => {
        let lookupType = "gamer";
        if (platform === platforms.Battlenet || platform === platforms.Activision || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno) lookupType = "id";
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/crm/cod/v2/accounts/platform/${platform}/${lookupType}/${gamertag}`);
    };

    settings = async (gamertag: string, platform: platforms) => {
        if (platform === platforms.Battlenet || platform === platforms.Activision || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/preferences/v1/platform/${platform}/gamer/${gamertag}/list`);
    };
}

class ALT {
    search = async (gamertag: string, platform: platforms) => {
        if (platform === platforms.Battlenet || platform === platforms.All || platform === platforms.Uno) gamertag = cleanClientName(gamertag);
        if (platform === platforms.Uno || platform === platforms.Activision) platform = platforms.Uno;
        return await sendRequest(`/crm/cod/v2/platform/${platform}/username/${gamertag}/search`);
    }
}

const Warzone = new WZ();
const ModernWarfare = new MW();
const ColdWar = new CW();
const Vanguard = new VG();
const Store = new SHOP();
const Me = new USER();
const Misc = new ALT();

export { login, platforms, Warzone, ModernWarfare, ColdWar, Vanguard, Store, Me, Misc };