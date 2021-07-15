const axios = require('axios');
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const tough = require('tough-cookie');
const uniqid = require('uniqid');
const rateLimit = require('axios-rate-limit');
const crypto = require('crypto');

const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36w";
let baseCookie = "new_SiteId=cod; ACT_SSO_LOCALE=en_US;country=US;";
let ssoCookie;
let loggedIn = false;
let debug = 0;

let apiAxios = axios.create({
    headers: {
        common: {
            "content-type": "application/json",
            "cookie": baseCookie,
            "userAgent": userAgent,
            "x-requested-with": userAgent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "Connection": "keep-alive"
        },
    },
    withCredentials: true
});

axiosCookieJarSupport(apiAxios);
apiAxios.defaults.jar = new tough.CookieJar();

let loginAxios = apiAxios;
let defaultBaseURL = "https://my.callofduty.com/api/papi-client/";
let loginURL = "https://profile.callofduty.com/cod/mapp/";
let defaultProfileURL = "https://profile.callofduty.com/";

class helpers {
    buildUri(str) {
        return `${defaultBaseURL}${str}`;
    }

    buildProfileUri(str) {
        return `${defaultProfileURL}${str}`;
    }

    cleanClientName(gamertag) {
        return encodeURIComponent(gamertag);
    }

    sendRequestUserInfoOnly(url) {
        return new Promise((resolve, reject) => {
            if (!loggedIn) reject("Not Logged In.");
            apiAxios.get(url).then(body => {
                if (body.status == 403) reject("Forbidden. You may be IP banned.");
                if (debug === 1) {
                    console.log(`[DEBUG]`, `Build URI: ${url}`);
                    console.log(`[DEBUG]`, `Round trip took: ${body.headers['request-duration']}ms.`);
                    console.log(`[DEBUG]`, `Response Size: ${JSON.stringify(body.data).length} bytes.`);
                    console.log(`[DEBUG] - Response`, body);
                }
                resolve(JSON.parse(body.data.replace(/^userInfo\(/, "").replace(/\);$/, "")));
            }).catch(err => reject(err));
        });
    }

    sendRequest(url) {
        return new Promise((resolve, reject) => {
            if (!loggedIn) reject("Not Logged In.");
            apiAxios.get(url).then(response => {
                if (debug === 1) {
                    console.log(`[DEBUG]`, `Build URI: ${url}`);
                    console.log(`[DEBUG]`, `Round trip took: ${response.headers['request-duration']}ms.`);
                    console.log(`[DEBUG]`, `Response Size: ${JSON.stringify(response.data.data).length} bytes.`);
                    console.log(`[DEBUG] - Response`, response);
                }

                if (response.data.status !== undefined && response.data.status === 'success') {
                    resolve(response.data.data);
                } else {
                    reject(this.apiErrorHandling({response: response}));
                }
            }).catch((error) => {
                reject(this.apiErrorHandling(error));
            });
        });
    }

    sendPostRequest(url, data) {
        return new Promise((resolve, reject) => {
            if (!loggedIn) reject("Not Logged In.");
            apiAxios.post(url, JSON.stringify(data)).then(response => {
                if (debug === 1) {
                    console.log(`[DEBUG]`, `Build URI: ${url}`);
                    console.log(`[DEBUG]`, `Round trip took: ${response.headers['request-duration']}ms.`);
                    console.log(`[DEBUG]`, `Response Size: ${JSON.stringify(response.data.data).length} bytes.`);
                    console.log(`[DEBUG] - Response`, response);
                }

                if (response.data.status !== undefined && response.data.status === 'success') {
                    resolve(response.data.data);
                } else {
                    reject(this.apiErrorHandling({response: response}));
                }
            }).catch((error) => {
                reject(this.apiErrorHandling(error));
            });
        });
    }

    postReq(url, data, headers = null) {
        return new Promise((resolve, reject) => {
            loginAxios.post(url, data, headers).then(response => {
                resolve(response.data);
            }).catch((error) => {
                reject(this.apiErrorHandling(error));
            });
        });
    }

    apiErrorHandling(error) {
        if (!!error) {
            let response = error.response;
            if (!!response) {
                switch (response.status) {
                    case 200:
                        const apiErrorMessage = (response.data !== undefined && response.data.data !== undefined && response.data.data.message !== undefined) ? response.data.data.message : (response.message !== undefined) ? response.message : 'No error returned from API.';
                        switch (apiErrorMessage) {
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
            } else {
                return `We Could not get a valid reason for a failure. Status: ${error}`;
            }
        } else {
            return `We Could not get a valid reason for a failure.`;
        }
    }
}

module.exports.login = (username, password) => {

    _helpers = new helpers();

    loginAxios.interceptors.request.use((resp) => {
        resp.headers['request-startTime'] = process.hrtime();
        return resp;
    });
    loginAxios.interceptors.response.use((response) => {
        const start = response.config.headers['request-startTime'];
        const end = process.hrtime(start);
        const milliseconds = Math.round((end[0] * 1000) + (end[1] / 1000000));
        response.headers['request-duration'] = milliseconds;
        return response;
    });

    const puppeteer = require('puppeteer');
    

    return new Promise(async(resolve, reject) => {
        const cookies = {};
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.goto("https://profile.callofduty.com/cod/login");

        await new Promise(resolve => setTimeout(resolve, 5000));

        const allCookies = await page._client.send('Network.getAllCookies');

        allCookies.cookies.forEach((c) => {
            cookies[c.name] = c.value;
        });

        //console.log('login: cookies', cookies);
        
        loginAxios.defaults.headers.common["content-type"] = "application/x-www-form-urlencoded";
        let data = new URLSearchParams({ username: encodeURIComponent(username), password, remember_me: true, _csrf: cookies["XSRF-TOKEN"] });
        data = decodeURIComponent(data);
        //loginAxios.post('https://profile.callofduty.com/do_login', data, { headers: { 'cookie': `_abck=${cookies["_abck"]};XSRF-TOKEN=${cookies['XSRF-TOKEN']};bm_sz=${cookies["bm_sz"]};new_SiteId=cod;comid=cod;` }}).then((response) => {
          loginAxios.post('https://profile.callofduty.com/do_login', data, { headers: { 'cookie': `${!!cookies ? Object.keys(cookies).map(name => `${name}=${cookies[name]}`).join(';') : ''}` }}).then((response) => {
            //console.log('login: response', response);
            //apiAxios.defaults.headers.common["cookie"] = `_abck=${cookies["_abck"]};XSRF-TOKEN=${cookies['XSRF-TOKEN']};bm_sz=${cookies["bm_sz"]};new_SiteId=cod;comid=cod;${response.headers["set-cookie"] ? response.headers["set-cookie"].join(';') : ''}`
            apiAxios.defaults.headers.common["cookie"] = `XSRF-TOKEN=${cookies['XSRF-TOKEN']};bm_sz=${cookies["bm_sz"]};new_SiteId=cod;comid=cod;`//${response.headers["set-cookie"] ? response.headers["set-cookie"].join(';') : ''}`
            //console.log('login: cookie', apiAxios.defaults.headers.common["cookie"]);
            loggedIn = true;
            resolve("done");
        }).catch(reject);  
    });
};

module.exports.CWmp = function(gamertag, platform) {
    return new Promise((resolve, reject) => {
        _helpers = new helpers();
        if (platform === "steam") reject("Steam Doesn't exist for CW. Try `battle` instead.");
        gamertag = _helpers.cleanClientName(gamertag);
        let lookupType = "gamer";
        if (platform === "uno") lookupType = "id";
        if (platform === "uno" || platform === "acti") platform = this.platforms["uno"];
        let urlInput = _helpers.buildUri(`stats/cod/v1/title/cw/platform/${platform}/${lookupType}/${gamertag}/profile/type/mp`);
        //console.log('CWmp: axios defaults', apiAxios.defaults);
        _helpers.sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
    });
};

module.exports.MWcombatwz = function(gamertag, platform) {
  return new Promise((resolve, reject) => {
      if (platform === "steam") reject("Steam Doesn't exist for MW. Try `battle` instead.");
      gamertag = _helpers.cleanClientName(gamertag);let lookupType = "gamer";
      if (platform === "uno") lookupType = "id";
      if (platform === "uno" || platform === "acti") platform = this.platforms["uno"];
      let urlInput = _helpers.buildUri(`crm/cod/v2/title/mw/platform/${platform}/${lookupType}/${gamertag}/matches/wz/start/0/end/0/details`);
      //console.log('MWcombatwz: axios defaults', apiAxios.defaults);
      _helpers.sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
  });
};

module.exports.test = async (email, password, username, platform) => {
  try {
    const loginResult = await this.login(email, password);
    //console.log('loginResult', loginResult);
    const stats = await this.MWcombatwz(username, platform);
    console.log('stats', stats);
  } catch (error) {
    console.log('error', { error, stack: error.stack, serialized: JSON.stringify(error) });
  }
}