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
    XBOX = 'xbl',
    NULL = '_'
};

enum games {
    ModernWarfare = 'mw',
    ModernWarfare2 = 'mw2',
    Vanguard = 'vg',
    ColdWar = 'cw',
    NULL = '_'
};

enum modes {
    Multiplayer = 'mp',
    Warzone = 'wz',
    Warzone2 = 'wz2',
    NULL = '_'
};

enum friendActions {
    Invite = "invite",
    Uninvite = "uninvite",
    Remove = "remove",
    Block = "block",
    Unblock = "unblock"
};

enum generics {
    STEAM_UNSUPPORTED = "Steam platform not supported by this game. Try `battle` instead.",
    UNO_NO_NUMERICAL_ID = `You must use a numerical ID when using the platform 'uno'.\nIf using an Activision ID, please use the platform 'acti'.`
};

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
        
        if (statusCode >= 500)
            throw new Error(`Received status code: '${statusCode}'. Route may be down or not exist.`);

        let response = await body.json();

        if (debugMode) 
            console.log(`[DEBUG]`, `Body Size: ${JSON.stringify(response).length} bytes.`);
    
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
        
        if (statusCode >= 500)
            throw new Error(`Received status code: '${statusCode}'. Route may be down or not exist.`);

        let response = await body.json();
        
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

const checkForValidPlatform = (platform: platforms, gamertag?: string) => {
    if (!Object.values(platforms).includes(platform as unknown as platforms)) 
        throw new Error(`Platform '${platform}' is not valid.\nTry one of the following:\n${JSON.stringify(Object.values(platforms), null, 2)}`);

    if (gamertag && isNaN(Number(gamertag)) && platform === platforms.Uno)
        throw new Error(generics.UNO_NO_NUMERICAL_ID);
};

const mapGamertagToPlatform = (gamertag: string, platform: platforms, steamSupport: boolean = false) => {
    checkForValidPlatform(platform, gamertag);

    const lookupType = handleLookupType(platform);

    if (!steamSupport && platform === platforms.Steam) throw new Error(generics.STEAM_UNSUPPORTED);

    if (platform == platforms.Battlenet || platform == platforms.Activision || platform == platforms.Uno)
        if (gamertag && gamertag.length > 0) gamertag = cleanClientName(gamertag);

    if (platform === platforms.Uno || platform === platforms.Activision)
            platform = platforms.Uno;

    return { gamertag, _platform: platform as platforms, lookupType };
};

class Endpoints {
    
    game: games | undefined;
    gamertag: string| undefined;
    platform: platforms| undefined;
    lookupType: string | undefined;
    mode: string | undefined;

    constructor(game?: games, gamertag?: string, platform?: platforms, mode?: string, lookupType?: string) {
        this.game = game;
        this.gamertag = gamertag;
        this.platform = platform;
        this.lookupType = lookupType;
        this.mode = mode;
    }

    fullData = () => `/stats/cod/v1/title/${this.game}/platform/${this.platform}/${this.lookupType}/${this.gamertag}/profile/type/${this.mode}`;
    combatHistory = () => `/crm/cod/v2/title/${this.game}/platform/${this.platform}/${this.lookupType}/${this.gamertag}/matches/${this.mode}/start/0/end/0/details`;
    combatHistoryWithDate = (startTime: number, endTime: number) => `/crm/cod/v2/title/${this.game}/platform/${this.platform}/${this.lookupType}/${this.gamertag}/matches/${this.mode}/start/${startTime}/end/${endTime}/details`;
    breakdown = () => `/crm/cod/v2/title/${this.game}/platform/${this.platform}/${this.lookupType}/${this.gamertag}/matches/${this.mode}/start/0/end/0`;
    breakdownWithDate = (startTime: number, endTime: number) => `/crm/cod/v2/title/${this.game}/platform/${this.platform}/${this.lookupType}/${this.gamertag}/matches/${this.mode}/start/${startTime}/end/${endTime}`;
    matchInfo = (matchId: string) => `/crm/cod/v2/title/${this.game}/platform/${this.platform}/fullMatch/wz/${matchId}/en`;
    seasonLoot = () => `/loot/title/${this.game}/platform/${this.platform}/${this.lookupType}/${this.gamertag}/status/en`;
    mapList = () => `/ce/v1/title/${this.game}/platform/${this.platform}/gameType/${this.mode}/communityMapData/availability`;
    purchasableItems = (gameId: string) => `/inventory/v1/title/${gameId}/platform/psn/purchasable/public/en`;
    bundleInformation = (gameId: string, bundleId: string) => `/inventory/v1/title/${gameId}/bundle/${bundleId}/en`; 
    battlePassLoot = (season: number) => `/loot/title/${this.game}/platform/${this.platform}/list/loot_season_${season}/en`;
    friendFeed = () => `/userfeed/v1/friendFeed/platform/${this.platform}/${this.lookupType}/${this.gamertag}/friendFeedEvents/en`;
    eventFeed = () => `/userfeed/v1/friendFeed/rendered/en/${baseSsoToken}`;
    loggedInIdentities = () => `/crm/cod/v2/identities/${baseSsoToken}`;
    codPoints = () => `/inventory/v1/title/mw/platform/${this.platform}/${this.lookupType}/${this.gamertag}/currency`;
    connectedAccounts = () => `/crm/cod/v2/accounts/platform/${this.platform}/${this.lookupType}/${this.gamertag}`;
    settings = () => `/preferences/v1/platform/${this.platform}/${this.lookupType}/${this.gamertag}/list`;
    friendAction = (action: friendActions) => `/codfriends/v1/${action}/${this.platform}/${this.lookupType}/${this.gamertag}`;
    search = () => `/crm/cod/v2/platform/${this.platform}/username/${this.gamertag}/search`;
}

class WZ {
    fullData = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.ModernWarfare, gamertag, platform, modes.Warzone, lookupType);
        return await sendRequest(endpoint.fullData());
    };

    combatHistory = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.ModernWarfare, gamertag, platform, modes.Warzone, lookupType);
        return await sendRequest(endpoint.combatHistory());
    };

    combatHistoryWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.ModernWarfare, gamertag, platform, modes.Warzone, lookupType);
        return await sendRequest(endpoint.combatHistoryWithDate(startTime, endTime));
    };

    breakdown = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.ModernWarfare, gamertag, platform, modes.Warzone, lookupType);
        return await sendRequest(endpoint.breakdown());
    };

    breakdownWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.ModernWarfare, gamertag, platform, modes.Warzone, lookupType);
        return await sendRequest(endpoint.breakdownWithDate(startTime, endTime));
    };

    matchInfo = async (matchId: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform("", platform);
        const endpoint = new Endpoints(games.ModernWarfare, gamertag, platform, modes.Warzone, lookupType);
        return await sendRequest(endpoint.matchInfo(matchId));
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
        const endpoint = new Endpoints(games.ModernWarfare, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.fullData());
    };

    combatHistory = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.ModernWarfare, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.combatHistory());
    };

    combatHistoryWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.ModernWarfare, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.combatHistoryWithDate(startTime, endTime));
    };

    breakdown = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.ModernWarfare, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.breakdown());
    };

    breakdownWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.ModernWarfare, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.breakdownWithDate(startTime, endTime));
    };

    matchInfo = async (matchId: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform("", platform);
        const endpoint = new Endpoints(games.ModernWarfare, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.matchInfo(matchId));
    };

    seasonloot = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.ModernWarfare, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.seasonLoot());
    };

    mapList = async (platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform("", platform);
        const endpoint = new Endpoints(games.ModernWarfare, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.mapList());
    };

}

class MW2 {
    fullData = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform, true);
        const endpoint = new Endpoints(games.ModernWarfare2, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.fullData());
    };

    combatHistory = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform, true);
        const endpoint = new Endpoints(games.ModernWarfare2, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.combatHistory());
    };

    combatHistoryWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform, true);
        const endpoint = new Endpoints(games.ModernWarfare2, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.combatHistoryWithDate(startTime, endTime));
    };

    breakdown = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform, true);
        const endpoint = new Endpoints(games.ModernWarfare2, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.breakdown());
    };

    breakdownWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform, true);
        const endpoint = new Endpoints(games.ModernWarfare2, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.breakdownWithDate(startTime, endTime));
    };

    seasonloot = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform, true);
        const endpoint = new Endpoints(games.ModernWarfare2, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.seasonLoot());
    };

    mapList = async (platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform("", platform, true);
        const endpoint = new Endpoints(games.ModernWarfare2, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.mapList());
    };

    matchInfo = async (matchId: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform("", platform, true);
        const endpoint = new Endpoints(games.ModernWarfare2, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.matchInfo(matchId));
    };
}

class WZ2 {
    fullData = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.ModernWarfare2, gamertag, platform, modes.Warzone2, lookupType);
        return await sendRequest(endpoint.fullData());
    };

    combatHistory = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.ModernWarfare2, gamertag, platform, modes.Warzone2, lookupType);
        return await sendRequest(endpoint.combatHistory());
    };

    combatHistoryWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.ModernWarfare2, gamertag, platform, modes.Warzone2, lookupType);
        return await sendRequest(endpoint.combatHistoryWithDate(startTime, endTime));
    };

    breakdown = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.ModernWarfare2, gamertag, platform, modes.Warzone2, lookupType);
        return await sendRequest(endpoint.breakdown());
    };

    breakdownWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.ModernWarfare2, gamertag, platform, modes.Warzone2, lookupType);
        return await sendRequest(endpoint.breakdownWithDate(startTime, endTime));
    };

    matchInfo = async (matchId: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform("", platform);
        const endpoint = new Endpoints(games.ModernWarfare2, gamertag, platform, modes.Warzone2, lookupType);
        return await sendRequest(endpoint.matchInfo(matchId));
    };
}

class CW {
    fullData = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.ColdWar, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.fullData());
    };

    combatHistory = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.ColdWar, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.combatHistory());
    };

    combatHistoryWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.ColdWar, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.combatHistoryWithDate(startTime, endTime));
    };

    breakdown = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.ColdWar, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.breakdown());
    };

    breakdownWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.ColdWar, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.breakdownWithDate(startTime, endTime));
    };

    seasonloot = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.ColdWar, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.seasonLoot());
    };

    mapList = async (platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform("", platform);
        const endpoint = new Endpoints(games.ColdWar, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.mapList());
    };

    matchInfo = async (matchId: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform("", platform);
        const endpoint = new Endpoints(games.ColdWar, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.matchInfo(matchId));
    };
}

class VG {
    fullData = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.Vanguard, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.fullData());
    };

    combatHistory = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.Vanguard, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.combatHistory());
    };

    combatHistoryWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.Vanguard, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.combatHistoryWithDate(startTime, endTime));
    };

    breakdown = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.Vanguard, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.breakdown());
    };

    breakdownWithDate = async (gamertag: string, startTime: number, endTime: number, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.Vanguard, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.breakdownWithDate(startTime, endTime));
    };

    seasonloot = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.Vanguard, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.seasonLoot());
    };

    mapList = async (platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform("", platform);
        const endpoint = new Endpoints(games.Vanguard, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.mapList());
    };

    matchInfo = async (matchId: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform("", platform);
        const endpoint = new Endpoints(games.Vanguard, gamertag, platform, modes.Multiplayer, lookupType);
        return await sendRequest(endpoint.matchInfo(matchId));
    };
}

class SHOP {
    purchasableItems = async (gameId: string) => {
        const endpoint = new Endpoints(games.NULL, "", platforms.NULL, modes.NULL, "");
        return await sendRequest(endpoint.purchasableItems(gameId));
    };

    bundleInformation = async(title: string, bundleId: string) => {
        const endpoint = new Endpoints(games.NULL, "", platforms.NULL, modes.NULL, "");
        return await sendRequest(endpoint.bundleInformation(title, bundleId));
    };

    battlePassLoot = async (title: games, season: number, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform("", platform);
        const endpoint = new Endpoints(title, gamertag, platform, modes.NULL, lookupType);
        return await sendRequest(endpoint.battlePassLoot(season));
    };
}

class USER {
    friendFeed = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.NULL, gamertag, platform, modes.NULL, lookupType);
        return await sendRequest(endpoint.friendFeed());
    };

    eventFeed = async() => {
        const endpoint = new Endpoints(games.NULL, "", platforms.NULL, modes.NULL, "");
        return await sendRequest(endpoint.eventFeed());
    };

    loggedInIdentities = async () => {
        const endpoint = new Endpoints(games.NULL, "", platforms.NULL, modes.NULL, "");
        return await sendRequest(endpoint.loggedInIdentities());
    };

    codPoints = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.NULL, gamertag, platform, modes.NULL, lookupType);
        return await sendRequest(endpoint.codPoints());
    };

    connectedAccounts = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.NULL, gamertag, platform, modes.NULL, lookupType);
        return await sendRequest(endpoint.connectedAccounts());
    };

    settings = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.NULL, gamertag, platform, modes.NULL, lookupType);
        return await sendRequest(endpoint.settings());
    };

    friendAction = async (gamertag: string, platform: platforms, action: friendActions) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform);
        const endpoint = new Endpoints(games.NULL, gamertag, platform, modes.NULL, lookupType);
        return await sendPostRequest(endpoint.friendAction(action), "{}");
    };
}

class ALT {
    search = async (gamertag: string, platform: platforms) => {
        var { gamertag , _platform: platform, lookupType } = mapGamertagToPlatform(gamertag, platform, true);
        const endpoint = new Endpoints(games.NULL, gamertag, platform, modes.NULL, lookupType);
        return await sendRequest(endpoint.search());
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
const Warzone2 = new WZ2();
const ColdWar = new CW();
const Vanguard = new VG();
const Store = new SHOP();
const Me = new USER();
const Misc = new ALT();

export { login, platforms, friendActions, Warzone, ModernWarfare, ModernWarfare2, Warzone2, ColdWar, Vanguard, Store, Me, Misc, enableDebugMode, disableDebugMode };