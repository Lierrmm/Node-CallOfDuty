import { IncomingHttpHeaders } from "http";
import { request } from "undici";
import weaponMappings from './wz-data/weapon-ids.json';
import wzMappings from './wz-data/game-modes.json';

const userAgent: string = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36";
let baseCookie: string = "new_SiteId=cod;ACT_SSO_LOCALE=en_US;country=US;";
let baseSsoToken: string = '';
let debugMode = false;

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

let basePostHeaders: CustomHeaders = { 
    'content-type': 'text/plain',
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

enum friendActions {
    Invite = "invite",
    Uninvite = "uninvite",
    Remove = "remove",
    Block = "block",
    Unblock = "unblock"
}

enum generics {
    STEAM_UNSUPPORTED = "Steam platform not supported by this game. Try `battle` instead."
}

const enableDebugMode = () => debugMode = true;

const disableDebugMode = () => debugMode = false;

const sendRequest = async (url: string) => {
    try {
        if (!loggedIn) throw new Error("Not Logged In.");
        let requestUrl = `${baseUrl}${apiPath}${url}`;

        if (debugMode) console.log(`[DEBUG]`, `Request Uri: ${requestUrl}`);
        if (debugMode) console.time("Round Trip");

        const { body, statusCode } = await request(requestUrl, {
            headers: baseHeaders
        });

        if (debugMode) console.timeEnd("Round Trip");

        let response = await body.json();

        if (debugMode) 
            console.log(`[DEBUG]`, `Body Size: ${JSON.stringify(response).length} bytes.`);
    
        if (statusCode > 299) return response;

        return response;
    }
    catch (exception: unknown) {
        throw exception;
    }
};

const sendPostRequest = async (url: string, data: string) => {
    try {
        if (!loggedIn) throw new Error("Not Logged In.");
        let requestUrl = `${baseUrl}${apiPath}${url}`;
        const { body, statusCode } = await request(requestUrl, {
            method: 'POST',
            headers: basePostHeaders,
            body: data
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
    basePostHeaders["X-XSRF-TOKEN"] = fakeXSRF;
    basePostHeaders["X-CSRF-TOKEN"] = fakeXSRF;
    basePostHeaders["Atvi-Auth"] = ssoToken;
    basePostHeaders["ACT_SSO_COOKIE"] = ssoToken;
    basePostHeaders["atkn"] = ssoToken;
    basePostHeaders["cookie"] = `${baseCookie}ACT_SSO_COOKIE=${ssoToken};XSRF-TOKEN=${fakeXSRF};API_CSRF_TOKEN=${fakeXSRF};ACT_SSO_EVENT="LOGIN_SUCCESS:1644346543228";ACT_SSO_COOKIE_EXPIRY=1645556143194;comid=cod;ssoDevId=63025d09c69f47dfa2b8d5520b5b73e4;tfa_enrollment_seen=true;gtm.custom.bot.flag=human;`;
    loggedIn = true;
    return loggedIn;
};

const handleLookupType = (platform: platforms) => {
    return platform === platforms.Uno ? 'id' : 'gamer';
};

const mapGamertagToPlatform = (gamertag: string, platform: platforms, steamSupport: boolean = false) => {
    const lookupType = handleLookupType(platform);

    if (!steamSupport && platform === platforms.Steam) throw new Error(generics.STEAM_UNSUPPORTED);

    if (platform == platforms.Battlenet || platform == platforms.Activision || platform == platforms.Uno)
        if (gamertag && gamertag.length > 0) gamertag = cleanClientName(gamertag);

    if (platform === platforms.Uno || platform === platforms.Activision)
            platform = platforms.Uno;

    return { gamertag, _platform: platform as platforms, lookupType };
};

class WZ {
    fullData = async (gamertag: string, platform: platforms) => {

        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/stats/cod/v1/title/mw/platform/${platform}/${lookupType}/${gamertag}/profile/type/wz`);
    };

    combatHistory = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/crm/cod/v2/title/mw/platform/${platform}/${lookupType}/${gamertag}/matches/wz/start/0/end/0/details`);
    };

    combatHistoryWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/crm/cod/v2/title/mw/platform/${platform}/${lookupType}/${gamertag}/matches/wz/start/${startTime}/end/${endTime}/details`);
    };

    breakdown = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/crm/cod/v2/title/mw/platform/${platform}/${lookupType}/${gamertag}/matches/wz/start/0/end/0`);
    };

    breakdownWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/crm/cod/v2/title/mw/platform/${platform}/${lookupType}/${gamertag}/matches/wz/start/${startTime}/end/${endTime}`);
    };

    matchInfo = async (matchId: string, platform: platforms) => {

        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform("", platform);
        return await sendRequest(`/crm/cod/v2/title/mw/platform/${platform}/fullMatch/wz/${matchId}/en`);
    };

    cleanGameMode = async (mode: string): Promise<string> => {
        //@ts-ignore
        const foundMode: string = wzMappings["modes"][mode];
        if (!foundMode)
            return mode;
        return foundMode;
    }
}

class MW {
    fullData = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/stats/cod/v1/title/mw/platform/${platform}/${lookupType}/${gamertag}/profile/type/mp`);
    };

    combatHistory = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/crm/cod/v2/title/mw/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/0/end/0/details`);
    };

    combatHistoryWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/crm/cod/v2/title/mw/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/${startTime}/end/${endTime}/details`);
    };

    breakdown = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/crm/cod/v2/title/mw/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/0/end/0`);
    };

    breakdownWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/crm/cod/v2/title/mw/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/${startTime}/end/${endTime}`);
    };

    seasonloot = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/loot/title/mw/platform/${platform}/${lookupType}/${gamertag}/status/en`);
    };

    mapList = async (platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/ce/v1/title/mw/platform/${platform}/gameType/mp/communityMapData/availability`);
    };

    matchInfo = async (matchId: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/crm/cod/v2/title/mw/platform/${platform}/fullMatch/mp/${matchId}/en`);
    };
}

class MW2 {
    fullData = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform, true);
        return await sendRequest(`/stats/cod/v1/title/mw2/platform/${platform}/${lookupType}/${gamertag}/profile/type/mp`);
    };

    combatHistory = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform, true);
        return await sendRequest(`/crm/cod/v2/title/mw2/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/0/end/0/details`);
    };

    combatHistoryWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform, true);
        return await sendRequest(`/crm/cod/v2/title/mw2/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/${startTime}/end/${endTime}/details`);
    };

    breakdown = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform, true);
        return await sendRequest(`/crm/cod/v2/title/mw2/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/0/end/0`);
    };

    breakdownWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform, true);
        return await sendRequest(`/crm/cod/v2/title/mw2/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/${startTime}/end/${endTime}`);
    };

    seasonloot = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform, true);
        return await sendRequest(`/loot/title/mw2/platform/${platform}/${lookupType}/${gamertag}/status/en`);
    };

    mapList = async (platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform, true);
        return await sendRequest(`/ce/v1/title/mw2/platform/${platform}/gameType/mp/communityMapData/availability`);
    };

    matchInfo = async (matchId: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform, true);
        return await sendRequest(`/crm/cod/v2/title/mw2/platform/${platform}/fullMatch/mp/${matchId}/en`);
    };
}

class CW {
    fullData = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/stats/cod/v1/title/cw/platform/${platform}/${lookupType}/${gamertag}/profile/type/mp`);
    };

    combatHistory = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/crm/cod/v2/title/cw/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/0/end/0/details`);
    };

    combatHistoryWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/crm/cod/v2/title/cw/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/${startTime}/end/${endTime}/details`);
    };

    breakdown = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/crm/cod/v2/title/cw/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/0/end/0`);
    };

    breakdownWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/crm/cod/v2/title/cw/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/${startTime}/end/${endTime}`);
    };

    seasonloot = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/loot/title/cw/platform/${platform}/${lookupType}/${gamertag}/status/en`);
    };

    mapList = async (platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/ce/v1/title/cw/platform/${platform}/gameType/mp/communityMapData/availability`);
    };

    matchInfo = async (matchId: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/crm/cod/v2/title/cw/platform/${platform}/fullMatch/mp/${matchId}/en`);
    };
}

class VG {
    fullData = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/stats/cod/v1/title/vg/platform/${platform}/${lookupType}/${gamertag}/profile/type/mp`);
    };

    combatHistory = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/crm/cod/v2/title/vg/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/0/end/0/details`);
    };

    combatHistoryWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/crm/cod/v2/title/vg/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/${startTime}/end/${endTime}/details`);
    };

    breakdown = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/crm/cod/v2/title/vg/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/0/end/0`);
    };

    breakdownWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/crm/cod/v2/title/vg/platform/${platform}/${lookupType}/${gamertag}/matches/mp/start/${startTime}/end/${endTime}`);
    };

    seasonloot = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/loot/title/vg/platform/${platform}/${lookupType}/${gamertag}/status/en`);
    };

    mapList = async (platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/ce/v1/title/vg/platform/${platform}/gameType/mp/communityMapData/availability`);
    };

    matchInfo = async (matchId: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
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
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/loot/title/mw/platform/${platform}/list/loot_season_${season}/en`);
    };
}

class USER {
    friendFeed = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/userfeed/v1/friendFeed/platform/${platform}/gamer/${gamertag}/friendFeedEvents/en`);
    };

    eventFeed = async() => {
        return await sendRequest(`/userfeed/v1/friendFeed/rendered/en/${baseSsoToken}`);
    };

    loggedInIdentities = async () => {
        return await sendRequest(`/crm/cod/v2/identities/${baseSsoToken}`);
    };

    codPoints = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/inventory/v1/title/mw/platform/${platform}/gamer/${gamertag}/currency`);
    };

    connectedAccounts = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/crm/cod/v2/accounts/platform/${platform}/${lookupType}/${gamertag}`);
    };

    settings = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/preferences/v1/platform/${platform}/gamer/${gamertag}/list`);
    };

    friendAction = async (gamertag: string, platform: platforms, action: friendActions) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        var url = `/codfriends/v1/${action}/${platform}/${lookupType}/${gamertag}`;
        return await sendPostRequest(url, "{}");
    };
}

class ALT {
    search = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        return await sendRequest(`/crm/cod/v2/platform/${platform}/username/${gamertag}/search`);
    }

    cleanWeapon = async (weapon: string): Promise<string> => {
        //@ts-ignore
        const foundWeapon: string = weaponMappings["All Weapons"][weapon];
        if (!foundWeapon)
            return weapon;
        return foundWeapon;
    }
}

const Warzone = new WZ();
const ModernWarfare = new MW();
const ModernWarfare2 = new MW2();
const ColdWar = new CW();
const Vanguard = new VG();
const Store = new SHOP();
const Me = new USER();
const Misc = new ALT();

export { login, platforms, friendActions, Warzone, ModernWarfare, ModernWarfare2, ColdWar, Vanguard, Store, Me, Misc, enableDebugMode, disableDebugMode };