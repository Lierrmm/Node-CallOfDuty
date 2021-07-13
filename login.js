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


    return new Promise(async(resolve, reject) => {

        let data = new URLSearchParams({ email: encodeURIComponent(username) });
        console.log(data);

        let response = await loginAxios.get('https://profile.callofduty.com/cod/script/siteConfig/loc_en_US');


        let response2 = await loginAxios.get(
            "https://profile.callofduty.com/cod/login?redirectUrl=https%3A%2F%2Fwww.callofduty.com%2Fuk%2Fen%2F"
          );
        
        let tagStart = /<meta name="_csrf" content="(.*)+"\/>/gm;

        let execs = tagStart.exec(response2.data);
        let csrf = execs[1];
        let tempCookies = response.headers["set-cookie"];
        loginAxios.defaults.headers.common["content-type"] = "application/x-www-form-urlencoded";
        loginAxios.post(`https://profile.callofduty.com/cod/checkEmailFormat`, data).then((response) =>{
            let cookies = response.headers['set-cookie'];
            loginAxios.defaults.headers.common["Cookie"] = `${baseCookie}${tempCookies.join(';')};`;
            data = new URLSearchParams({ username: encodeURIComponent(username), password, remember_me: true, _csrf: csrf });
            data = decodeURIComponent(data);
            console.log(data);
            // ISSUE WITH XSRF TOKEN IN COOKIES AND _csrf. Replacing with browser values works so need to find where they are coming from.
            loginAxios.post('https://profile.callofduty.com/do_login', data).then((response) => {
                console.log(response.headers);
                apiAxios.defaults.headers.common.Cookie = `${baseCookie}${response.headers["set-cookie"].join(';')}`;
                console.log("done");
            }).catch(e=>console.log(e.response.data));  
        }).catch(console.log);
    });

};