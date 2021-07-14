const axios = require('axios');
const uniqid = require('uniqid');
const rateLimit = require('axios-rate-limit');
const crypto = require('crypto');

const userAgent = "a4b471be-4ad2-47e2-ba0e-e1f2aa04bff9";
let baseCookie = "new_SiteId=cod; ACT_SSO_LOCALE=en_US;country=US;";
let ssoCookie;
let loggedIn = false;
let debug = 0;

let apiAxios = axios.create({
    headers: {
        common: {
            "content-type": "application/json",
            "Cookie": baseCookie,
            "userAgent": userAgent,
            "x-requested-with": userAgent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "Connection": "keep-alive"
        },
    }
});

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

    const cookieHelper = require('cookie');
    

    return new Promise(async(resolve, reject) => {
        let data = new URLSearchParams({ email: encodeURIComponent(username) });
        console.log(data);
        // let response = await loginAxios.get('https://profile.callofduty.com/cod/script/siteDictionary/loc_en_US.json').catch(console.log)
        // let neededCookies = response.headers["set-cookie"].join(";");
        // let CookieObj = cookieHelper.parse(neededCookies);
        // console.log(CookieObj);

        // response2 = await axios.get('https://profile.callofduty.com/cod/login').catch(e => console.log(e.data))
        // neededCookies2 = response2.headers["set-cookie"].join(";");
        // let CookieObj2 = cookieHelper.parse(neededCookies2);
        // //console.log(CookieObj2);

        // //https://profile.callofduty.com/akam/11/49d86355
        // response2 = await axios.get('https://profile.callofduty.com/akam/11/49d86355').catch(e => console.log(e.data))
        // neededCookies3 = response2.headers["set-cookie"].join(";");
        // let CookieObj3 = cookieHelper.parse(neededCookies3);
        // //console.log(CookieObj3);

        // let baseCookie2 = `AMCVS_0FB367C2524450B90A490D4C@AdobeOrg=1; _gcl_au=1.1.422828117.1626245767; gtm.custom.bot.flag=human;AMCV_0FB367C2524450B90A490D4C@AdobeOrg=-637568504|MCIDTS|18823|MCMID|00158842383788701031764955417294559117|MCAAMLH-1626850566|6|MCAAMB-1626850566|6G1ynYcLPuiQxYZrsz_pkqfLG9yMXBpb2zX5dvJdYQJzPXImdj0y|MCOPTOUT-1626252970s|NONE|MCAID|NONE|MCSYNCSOP|411-18830|vVersion|5.1.1;ACT_SSO_LOCALE=en_US; s_cc=true; _fbp=fb.1.1626245772596.1417353536; _gid=GA1.2.1464048312.1626245773;_scid=3c7c48f8-633a-4b39-846d-109869348018;_ga_ZN5RJYMCDQ=GS1.1.1626245770.1.1.1626245864.0; _ga=GA1.2.1740492336.1626245773;OptanonConsent=consentId=a6ae4e2d-59b7-47bc-81b1-c15e88c576fe&datestamp=Wed Jul 14 2021 07:57:44 GMT 0100 (BritishSummerTime)&version=6.13.0&interactionCount=1&isIABGlobal=false&hosts=&landingPath=https://profile.callofduty.com/cod/login&groups=1:1,2:1,3:1,4:1;gpv_pn=callofduty:sso-callofduty:login; s_tp=1221; s_ppv=callofduty:sso-callofduty:login,77,77,942;s_nr=1626246235269-New;s_sq=activision.prd=&c.&a.&activitymap.&page=callofduty%3Asso-callofduty%3Alogin&link=SIGN%20IN&region=login-info&pageIDType=1&.activitymap&.a&.c&pid=callofduty%3Asso-callofduty%3Alogin&pidt=1&oid=SIGN%20IN&oidt=3&ot=SUBMIT`;
        // let builtCookie = `gtm.custom.bot.flag=human;ak_bmsc=${CookieObj3["ak_bmsc"]};comid=${CookieObj["comid"]};_abck=${CookieObj["_abck"]};`
        // console.log(builtCookie);
        // loginAxios.defaults.headers.common["Cookie"] = `${builtCookie};`;

        let response = await loginAxios.get( 'https://profile.callofduty.com/cod/login' );
        neededCookies3 = response.headers["set-cookie"].join(";");
        let CookieObj3 = cookieHelper.parse(neededCookies3);
        console.log(CookieObj3);

        loginAxios.defaults.headers.common["content-type"] = "application/x-www-form-urlencoded";
        loginAxios.post(`https://profile.callofduty.com/cod/checkEmailFormat`, data).then((response) => {
            neededCookies4 = response.headers["set-cookie"].join(";");
            let CookieObj4 = cookieHelper.parse(neededCookies4);
            console.log(CookieObj4);
            loginAxios.defaults.headers.common['Cookie'] = `_abck=${CookieObj4["_abck"]};XSRF-TOKEN=${CookieObj3['XSRF-TOKEN'].value};bm_sz=${CookieObj4["bm_sz"]};new_SiteId=cod;comid=cod;`;
            data = new URLSearchParams({ username: encodeURIComponent(username), password, remember_me: true, _csrf: CookieObj3["XSRF-TOKEN"] });
            data = decodeURIComponent(data);
            console.log(data);
            // ISSUE WITH XSRF TOKEN IN COOKIES AND _csrf. Replacing with browser values works so need to find where they are coming from.
            loginAxios.post('https://profile.callofduty.com/do_login', data).then((response) => {
                console.log(response.headers);
                apiAxios.defaults.headers.common.Cookie = `${neededCookies};`;
                console.log("done");
            }).catch(e=>console.log(e.response.data));  
        }).catch(console.log);
    });

};