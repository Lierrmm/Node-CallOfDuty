(function(COD, $) {

    COD.api = COD.api || {};

    COD.api.dev     = window.location.hostname.indexOf('cmsauthor') >= 0;
    COD.api.preview = window.location.hostname.indexOf('preview') >= 0;
    COD.api.stage   = window.location.hostname.indexOf('stage') >= 0;

    COD.api.cache = {};

    COD.api.error = function(call, error) {
        return 'API error: ' + error + ' (' + call + ').';
    };

    COD.api.ajax = function(url, opts, callback, error) {
        callback = typeof callback === 'function' ? callback : function(data) {};
        error = typeof error === 'function' ? error : function(err) {};

        var request = {
            url: url,
            type: 'GET',
            dataType: 'json',
            xhrFields: {
                withCredentials: true
            }
        };

        var req = $.extend(request, opts);

        return $.ajax(req).success(function(res) {
            if (!res) {
                error(COD.api.error(url, 'empty response'));
                return;
            }
            callback(res);
        }).fail(function(err) {
            error(COD.api.error(url, err.statusText));
        });
    };

    COD.api.cacheify = function(url, data) {
        COD.api.cache[url] = {
            data: data,
            timestamp: Date.now()
        };
    };

    COD.api.get = function(url, callback, error) {
        var currentTime = Date.now();
        var cache = COD.api.cache;
        var expiration = (5 * 60) * 1000; // FIVE MINS

        if(cache[url] && ((currentTime - cache[url].timestamp) < expiration)) {
            callback(cache[url].data);
        } else {
            COD.api.ajax(url, {}, function(res){
                COD.api.cacheify(url, res);
                callback(res);
            }, error);
        }
    };

    COD.api.post = function(url, data, callback, error) {
        var opts = {
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json'
        };
        COD.api.ajax(url, opts, callback, error);
    };

    COD.api.put = function(url, data, callback, error) {
        var opts = {
            type: 'PUT',
            data: JSON.stringify(data),
            contentType:'application/json'
        };
        COD.api.ajax(url, opts, callback, error);
    }

    COD.api.delete = function(url, callback, error) {
        COD.api.post(url, {}, callback, error);
    };

    COD.api.buildQueryString = function(queryObj) {
        queryObj = queryObj || {};
        var queryStringComponents = Object.keys(queryObj).map(function(name) {
            if (queryObj[name]) {
                return name + '=' + queryObj[name];
            }
        });
        return queryStringComponents.length ? '?' + queryStringComponents.join('&') : '';
    };

    COD.api.editQueryString = function(url, queryObj) {
        var qObj = $.extend({}, queryObj || {});
        var urlQuery = url.split('?');
        if (urlQuery.length < 2) return url + COD.api.buildQueryString(qObj);
        var qUrl = urlQuery[0];
        var qParams = urlQuery[1];
        var qParamsSplit = qParams.split('&');
        $.each(qParamsSplit, function(i, qItem) {
            var qItemSplit = qItem.split('=');
            var qItemKey = qItemSplit[0];
            var qItemVal = qItemSplit[1];
            qObj[qItemKey] = qObj[qItemKey] || qItemVal;
        });
        return qUrl + COD.api.buildQueryString(qObj);
    };


}(COD, jQuery));


var COD = COD || {};
var ATVI = ATVI || {};

(function(COD, ATVI, $) {
    COD.api = COD.api || {};
    COD.api.sso = COD.api.sso || {};

    COD.api.sso.url = 'https://profile.callofduty.com/';

    var hashId;
    COD.api.sso.hashId = function() {
        var id = hashId = hashId || ATVI.utils.getCookie("ACT_SSO_COOKIE");
        return id;
    };

    COD.api.sso.unoId = function() {
        var hashId = COD.api.sso.hashId();
        return ATVI.utils.decodeBase64(hashId).split(':')[0];
    };

    COD.api.sso.error = function(endpoint, error) {
        return 'API error: ' + error + ' (' + endpoint + ').';
    };

    COD.api.sso.get = function(endpoint, callback, error) {
        var url = COD.api.sso.url + endpoint;
        return COD.api.get(url, callback, error);
    };

    COD.api.sso.post = function(endpoint, data, callback, error) {
    	var csrfUrl = COD.api.sso.url + "cod/csrf";
    	$.get(csrfUrl)
    		.success(function() {
	    		var token = ATVI.utils.getCookie("XSRF-TOKEN", true);
	    		var url = COD.api.sso.url + endpoint;
	    		url += (url.indexOf("?") >= 0) ? "&" : "?";
	    		url += "_csrf=" + token;
	    		COD.api.post(url, data, callback, error);
    		})
    		.error(error);
    };

    COD.api.sso.delete = function(endpoint, callback, error) {
        var csrfUrl = COD.api.sso.url + "cod/csrf";
        $.get(csrfUrl)
            .success(function() {
                var token = ATVI.utils.getCookie("XSRF-TOKEN", true);
                var url = COD.api.sso.url + endpoint;
                url += (url.indexOf("?") >= 0) ? "&" : "?";
                url += "_csrf=" + token;
                COD.api.delete(url, callback, error);
            })
            .error(error);
    };

    COD.api.sso.getEmblems = function(game, platform, gamerId, callback, error) {
        callback = typeof callback === 'function' ? callback : function(data) {};
        error = typeof error === 'function' ? error : function(err) {};

        if (!game || !platform) {
            return error(COD.api.sso.error(endpoint, 'invalid parameters.'));
        }

        var endpoint;
        if(!gamerId) {
	        var unoId = COD.api.sso.unoId();
	        endpoint = ['cod', 'emblems', game, platform, 'uno', unoId].join('/');
        } else {
        	endpoint = ['cod', 'emblems', game, platform, 'gamer', gamerId].join('/');
        }
        var queryParams = {
            cache: Date.now()
        };
        endpoint = COD.api.editQueryString(endpoint, queryParams);

        COD.api.sso.get(endpoint, function(res) {
            res = res || {};
            var data = res.data || {};
            if (res.status !== 'success') return error(res.errors || res.status);
            return callback(data);
        }, error);
    };


    COD.api.sso.saveEmblem = function(emblem, game, platform, callback, error) {
        callback = typeof callback === 'function' ? callback : function(data) {};
        error = typeof error === 'function' ? error : function(err) {};

        var unoId = COD.api.sso.unoId();
        var endpoint = ['cod', 'emblems', game, platform, 'uno', unoId].join('/');
        if (!game || !platform || !unoId) {
            return error(COD.api.sso.error(endpoint, 'invalid parameters.'));
        }

        COD.api.sso.post(endpoint, emblem, function(res) {
            res = res || {};
            var data = res.data || {};
            if (res.status !== 'success') return error(data.message || res.status);
            return callback(data);
        }, error);
    };

    COD.api.sso.deleteEmblem = function(emblemId, game, platform, callback, error) {
        callback = typeof callback === 'function' ? callback : function(data) {};
        error = typeof error === 'function' ? error : function(err) {};

        var unoId = COD.api.sso.unoId();
        var endpoint = ['cod', 'emblems', game, platform, 'uno', unoId, 'delete', emblemId].join('/');
        if (!game || !platform || !unoId || !emblemId) {
            return error(COD.api.sso.error(endpoint, 'invalid parameters.'));
        }

        COD.api.sso.delete(endpoint, function(res) {
            res = res || {};
            var data = res.data || {};
            if (res.status !== 'success') return error(data.message || res.status);
            return callback(data);
        }, error);
    };

    COD.api.sso.shareEmblem = function(emblem, game, platform, callback, error) {
        callback = typeof callback === 'function' ? callback : function(data) {};
        error = typeof error === 'function' ? error : function(err) {};

        var unoId = COD.api.sso.unoId();
        var endpoint = ['cod', 'emblems', game, platform, 'uno', unoId, 'share'].join('/');
        if (!game || !platform || !unoId || !emblem) {
            return error(COD.api.sso.error(endpoint, 'invalid parameters (shareEmblem).'));
        }

        COD.api.sso.post(endpoint, emblem, function(res) {
            res = res || {};
            var data = res.data || {};
            if (res.status !== 'success') return error(data.message || res.status);
            return callback(data);
        }, error);
    };

    COD.api.sso.checkFreeSupplyDrops = function(callback, error) {
        callback = typeof callback === 'function' ? callback : function(data) {};
        error = typeof error === 'function' ? error : function(err) {};

        var endpoint = COD.api.sso.url + "promotions/redeem/cod/mycod";
        if(COD.api.dev) {
            var endpoint = "https://uat.callofduty.com/promotions/redeem/cod/mycod";
        }

        $.get(endpoint).success(function(res) {
            if (res && res.indexOf('success-subtitle') >= 0){
                callback(true);
            } else if(res.indexOf('entryLimit') >= 0){
                callback(false);
            } else {
                error('failed to get free drop status');
            }
        }).fail(error);

    };

    COD.api.sso.fetchFeed = function (callback, error) {
        var endpoint = `https://www.callofduty.com/site/cod/franchiseFeed/${ATVI.pageLocale}?source=web`;

        if(COD.api.dev || COD.api.stage) {
            endpoint = `/site/cod/franchiseFeed/${ATVI.pageLocale}?source=web`;
        }

        COD.api.get(endpoint, callback, error);
    };

    COD.api.sso.fetchMaps = function (callback, error) {
        var endpoint = "/content/atvi/callofduty/mycod/web/" + ATVI.pageLocale + "/data/json/iq-content-xapp.js";
        COD.api.get(endpoint, callback, error);
    };


})(COD, ATVI, jQuery);

var COD = COD || {};
var ATVI = ATVI || {};

(function(COD, ATVI, $) {
    COD.api = COD.api || {};
    COD.api.papi = COD.api.papi || {};

    COD.api.papi.url = '/api/papi-client/';
    if (COD.api.dev) {
        COD.api.papi.url = 'https://stage.callofduty.com/api/papi-client/';
    }

    COD.api.papi.error = function(endpoint, error) {
        return 'API error: ' + error + ' (' + endpoint + ').';
    };

    COD.api.papi.get = function(endpoint, callback, error) {
        var url = COD.api.papi.url + endpoint;
        return COD.api.get(url, callback, error);
    };

    COD.api.papi.post = function(endpoint, data, callback, error) {
        var url = COD.api.papi.url + endpoint;
        return COD.api.post(url, data, callback, error);
    };

	COD.api.papi.put = function(endpoint, data, callback, error) {
        var url = COD.api.papi.url + endpoint;
        return COD.api.put(url, data, callback, error);
    };

    COD.api.papi.leaderboard = function(opts, callback, error) {
        callback = typeof callback === 'function' ? callback : function(data) {};
        error = typeof error === 'function' ? error : function(err) {};
        opts = opts || {};
        var pageType = opts.pageType || 'page';
        var gameType = opts.gameType || 'core';
        var endpoint = [
            'leaderboards', 'v2',
            'title', opts.game,
            'platform', opts.platform,
            'time', opts.dateRange,
            'type', gameType,
            'mode', opts.gameMode,
            pageType, opts.page
        ];
        if(opts.group && opts.group != "all"){
            endpoint.push(opts.group);
        }
        endpoint = endpoint.join('/');
        var queryParams = {};
        if (opts.sort) queryParams.sort = opts.sort;
        endpoint = COD.api.editQueryString(endpoint, queryParams);

        if (!opts.game || !opts.platform || !opts.dateRange || !opts.gameMode || !opts.page) {
            var err = COD.api.papi.error(endpoint, 'invalid parameters.');
            error(err);
            return;
        }

        COD.api.papi.get(endpoint, function(res) {
            res = res || {};
            var data = res.data || {};
            if (res.status !== 'success') return error(data.message || res.status);
            return callback(data);
        }, error);
    };


    COD.api.papi.getItems = function(game, platform, idType, id, callback, error) {
        callback = typeof callback === 'function' ? callback : function(data) {};
        error = typeof error === 'function' ? error : function(err) {};

        var endpoint = ['inventory', 'v1', 'title', game, 'platform', platform, idType, encodeURIComponent(id), 'inventory'].join('/');

        if (!game || !platform || !idType || !id) {
            return error(COD.api.papi.error(endpoint, 'invalid parameters.'));
        }

        COD.api.papi.get(endpoint, function(res) {
            res = res || {};
            var data = res.data || {};
            if (res.status !== 'success') return error(data.message || res.status);
            return callback(data);
        }, error);
    };

    COD.api.papi.getCurrency = function(game, platform, idType, id, callback, error) {
        callback = typeof callback === 'function' ? callback : function(data) {};
        error = typeof error === 'function' ? error : function(err) {};

        var endpoint = ['inventory', 'v1', 'title', game, 'platform', platform, idType, encodeURIComponent(id), 'currency'].join('/');

        if (!game || !platform || !idType || !id) {
            return error(COD.api.papi.error(endpoint, 'invalid parameters.'));
        }

        COD.api.papi.get(endpoint, function(res) {
            res = res || {};
            var data = res.data || {};
            if (res.status !== 'success') return error(data.message || res.status);
            return callback(data);
        }, error);
    };

    COD.api.papi.purchaseItem = function(itemName, game, platform, idType, id, currencyType, callback, error) {
        callback = typeof callback === 'function' ? callback : function(data) {};
        error = typeof error === 'function' ? error : function(err) {};

        var endpoint = ['inventory', 'v1', 'title', game, 'platform', platform, idType, encodeURIComponent(id), 'item', itemName, 'purchaseWith', currencyType].join('/');

        if (!itemName || !game || !platform || !idType || !id || !currencyType) {
            return error(COD.api.papi.error(endpoint, 'invalid parameters.'));
        }

        COD.api.papi.post(endpoint, null, function(res) {
            res = res || {};
            var data = res.data || {};
            if (res.status !== 'success') return error(data.message || res.status);
            return callback(data);
        }, error);
    };

    COD.api.papi.redeemCrate = function(crateRarity, game, platform, idType, id, callback, error) {
        callback = typeof callback === 'function' ? callback : function(data) {};
        error = typeof error === 'function' ? error : function(err) {};

        var endpoint = ['inventory', 'v1', 'title', game, 'platform', platform, idType, encodeURIComponent(id), 'item', crateRarity, 'redeem'].join('/');

        if (!crateRarity || !game || !platform || !idType || !id) {
            return error(COD.api.papi.error(endpoint, 'invalid parameters.'));
        }

        COD.api.papi.post(endpoint, null, function(res) {
            res = res || {};
            var data = res.data || {};
            if (res.status !== 'success') return error(data.message || res.status);
            return callback(data);
        }, error);
    };

    COD.api.papi.loadoutWeapons = function(game, platform, gamertag, callback, error) {

        callback = typeof callback === 'function' ? callback : function(data) {};
        error = typeof error === 'function' ? error : function(err) {}; 
        game = game || "bo4";

        var endpoint = "loadouts/v3/title/" + game + "/items/mode/mp/en";

        COD.api.papi.get(endpoint, function(res){
            if(res.status == "error"){
                error(res.data);
            } else {
                callback(res.data);
            }
        })
    }

    COD.api.papi.loadoutClasses = function(game, platform, gamertag, callback, error) {
        callback = typeof callback === 'function' ? callback : function(data) {};
        error = typeof error === 'function' ? error : function(err) {}; 
        game = game || "bo4";

        var endpoint = ['loadouts/v3/title', game, 'platform', platform, 'gamer', encodeURIComponent(gamertag), 'mode/mp'].join('/');

        COD.api.papi.get(endpoint, function(res){
            if(res.status == "error") {
                error(res.data)
            } else {
                callback(res.data);
            }
        });
    }

    //https://stage.callofduty.com/api/papi-client/loadouts/v3/title/bo4/platform/xbl/gamertag/javagamer/mode/mp/slot/1
    COD.api.papi.submitLoadoutClass = function(game, platform, gamertag, slot, data, callback, error){
        callback = typeof callback === 'function' ? callback : function(data) {};
        error = typeof error === 'function' ? error : function(err) {}; 
        game = game || "bo4";

        var endpoint = ['loadouts/v3/title', game, 'platform', platform, 'gamer', gamertag, 'mode/mp/slot', slot].join('/');

        COD.api.papi.post(endpoint, data, callback, error);
    }

    COD.api.papi.userFeed = function (payload, callback, error) {
        var path = `userfeed/v1/friendFeed/rendered/${ATVI.pageLocale}/${payload.hashId}`;
        var endpoint = COD.api.papi.url + path;
        COD.api.get(endpoint, callback, error);
    };

    COD.api.papi.fetchMatchAnalysis = function (payload, callback, error) {
        var path = `ce/v2/title/${payload.game}/platform/${payload.platform}/gametype/${payload.type}/gamer/${payload.username}/summary/match_analysis/contentType/full/end/${payload.timestamp}/matchAnalysis/mobile/${ATVI.pageLocale}`;
        var endpoint = COD.api.papi.url + path;
        COD.api.get(endpoint, callback, error);
    };

    COD.api.papi.fetchBrief = function (payload, callback, error) {
        var path = `ce/v1/title/${payload.game}/platform/${payload.platform}/gametype/${payload.type}/gamer/${payload.username}/brief/mobile/${ATVI.pageLocale}`;
        var endpoint = COD.api.papi.url + path;
        COD.api.get(endpoint, callback, error);
    };

    COD.api.papi.fetchDebrief = function (payload, callback, error) {
        var path = `ce/v1/title/${payload.game}/platform/${payload.platform}/gametype/${payload.type}/gamer/${payload.username}/debrief/mobile/${ATVI.pageLocale}`;
        var endpoint = COD.api.papi.url + path;
        COD.api.get(endpoint, callback, error);
    };

    COD.api.papi.fetchMapModes = function (payload, callback, error) {
        var path = `ce/v1/title/${payload.game}/platform/${payload.platform}/gameType/${payload.type}/communityMapData/availability`;
        var endpoint = COD.api.papi.url + path;
        COD.api.get(endpoint, callback, error);
    };

})(COD, ATVI, jQuery);

var COD = COD || {};

(function(COD, $) {

    COD.api = COD.api || {};
    COD.api.papi = COD.api.papi || {};
    COD.api.papi.crm = COD.api.papi.crm || {};

    COD.api.papi.crm.path = 'crm/';

    COD.api.papi.crm.get = function(endpoint, callback, error) {
        callback = typeof callback === 'function' ? callback : function(data) {};
        error = typeof error === 'function' ? error : function(err) {};

        var endpoint = COD.api.papi.crm.path + endpoint;
        return COD.api.papi.get(endpoint, callback, function(err) {
            error('CRM ' + err);
        });
    };

    COD.api.papi.crm.identities = function(callback, error) {
        callback = typeof callback === 'function' ? callback : function(data) {};
        error = typeof error === 'function' ? error : function(err) {};

        var hashId = COD.api.sso.hashId();
        if (!hashId) {
            return error(COD.api.papi.error(endpoint, 'Cannot load SSO identities. No hashId id present in cookies.'));
        }

        var endpoint = ['cod', 'v2', 'identities', hashId].join('/');
        if (COD.api.dev) {
            var unoId = COD.api.sso.unoId();
            endpoint = ['cod', 'v2', 'identities', 'platform', 'uno', 'id', unoId].join('/');
        }

        COD.api.papi.crm.get(endpoint, function(res) {
            res = res || {};
            var data = (res.data || {}).titleIdentities || [];
            if (res.status !== 'success') return error(data.message || res.status);
            return callback(data);
        }, error);
    };

    COD.api.papi.crm.profile = function(game, platform, idType, id, type, callback, error) {
        callback = typeof callback === 'function' ? callback : function(data) {};
        error = typeof error === 'function' ? error : function(err) {};
        if(!type) {
            type = 'mp';
        } else if(typeof(type) == "function") {
            error = callback;
            callback = type;
            type = 'mp';
        }

        var endpoint = ['cod', 'v2', 'title', game, 'platform', platform, idType, encodeURIComponent(id), 'profile/type', type].join('/');

        if (!game || !platform || !idType || !id) {
            return error(COD.api.papi.error(endpoint, 'invalid parameters.'));
        }

        COD.api.papi.crm.get(endpoint, function(res) {
            res = res || {};
            var data = res.data || {};
            if (res.status !== 'success') return error(data.message || res.status);
            return callback(data);
        }, error);
    };

    COD.api.papi.crm.recentXDaysMatches = function(game, platform, idType, id, days, callback, error) {
        callback = typeof callback === 'function' ? callback : function(data) {};
        error = typeof error === 'function' ? error : function(err) {};

        days = days || 7;

        if (!game || !platform || !idType || !id) {
            var err = COD.api.papi.error(endpoint, 'invalid parameters).');
            return error(err);
        }

        var endpoint = ['cod', 'v2', 'title', game, 'platform', platform, idType, encodeURIComponent(id), 'matches', 'days', days].join('/');

        COD.api.papi.crm.get(endpoint, function(res) {
            res = res || {};
            if (res.status !== 'success') return error(data.message || res.status);
            var data = res.data || [];
            if (!data.matches) return callback(data);
            $.each(data.matches, function(i, m) {
                m.duration = m.utcEndSeconds - m.utcStartSeconds;
                m.playerStats.scorePerMinute = Math.round(m.playerStats.score / (m.duration || 1) * 60);
            });
            return callback(data);
        }, error);
    };

    COD.api.papi.crm.recentMatchesTimestamp = function(game, platform, idType, id, type, start, end, callback, error) {
        callback = typeof callback === 'function' ? callback : function(data) {};
        error = typeof error === 'function' ? error : function(err) {};

        start = start || 0;
        end = end || 0;
        type = type || 'mp';

        if (!game || !platform || !idType || !id ) {
            var err = COD.api.papi.error(endpoint, 'invalid parameters).');
            return error(err);
        }

        var endpoint = ['cod', 'v2', 'title', game, 'platform', platform, idType, encodeURIComponent(id), 'matches', type, 'start', start, 'end', end, 'details'].join('/');

        

        COD.api.papi.crm.get(endpoint, function(res) {
            res = res || {};
            var data = res.data || [];
            if (res.status !== 'success') return error(data.message || res.status);
            
            if (!data.matches) return callback(data);
            $.each(data.matches, function(i, m) {
                m.duration = m.utcEndSeconds - m.utcStartSeconds;
                m.playerStats.scorePerMinute = Math.round(m.playerStats.score / (m.duration || 1) * 60);
            });
            return callback(data);
        }, error);
    }

    COD.api.papi.crm.recentMatchesBasic = function(game, platform, idType, id, type, start, end, limit, callback, error) {
        callback = typeof callback === 'function' ? callback : function(data) {};
        error = typeof error === 'function' ? error : function(err) {};

        start = start || 0;
        end = end || 0;

        if (!game || !platform || !idType || !id) {
            var err = COD.api.papi.error(endpoint, 'invalid parameters).');
            return error(err);
        }

        var endpoint = ['cod', 'v2', 'title', game, 'platform', platform, idType, encodeURIComponent(id), 'matches/mp', 'start', start, 'end', end].join('/');

        if(limit && limit > 0) {
            endpoint += "?limit=" + limit;
        }
        

        COD.api.papi.crm.get(endpoint, function(res) {
            res = res || {};
            if (res.status !== 'success') return error(data.message || res.status);
            var data = res.data || [];
            if (!data.matches) return callback(data);
            $.each(data.matches, function(i, m) {
                m.duration = m.utcEndSeconds - m.utcStartSeconds;
                m.playerStats.scorePerMinute = Math.round(m.playerStats.score / (m.duration || 1) * 60);
            });
            return callback(data);
        }, error);
    }

    COD.api.papi.crm.weeklyRecap = function(game, platform, idType, id, callback, error) {
        callback = typeof callback === 'function' ? callback : function(data) {};
        error = typeof error === 'function' ? error : function(err) {};

        var endpoint = ['cod', 'v2', 'title', game, 'platform', platform, idType, encodeURIComponent(id), 'summary'].join('/');

        if (!game || !platform || !idType || !id) {
            return error(COD.api.papi.error(endpoint, 'invalid parameters.'));
        }

        COD.api.papi.crm.get(endpoint, function(res) {
            res = res || {};
            var data = res.data || {};
            if (res.status !== 'success') return error(data.message || res.status);
            return callback(data);
        }, error);
    };

    COD.api.papi.crm.ssoMotd = function(game, platform, callback, error) {
        callback = typeof callback === 'function' ? callback : function(data) {};
        error = typeof error === 'function' ? error : function(err) {};

        var lang = ATVI.utils.parseLocalizedPath(location.pathname.replace('/iw','/'));
        var locale =  lang.language + '-' +  lang.region.toUpperCase();
        var atviToken = ATVI.utils.getCookie('ACT_SSO_COOKIE');
        var motdParameter = ( atviToken !== undefined  && atviToken !== null ) ? '&token=' + atviToken : '';
        var endpoint = ['v1', 'messages', 'motd', game, platform].join('/');

        endpoint = endpoint + '?lang=' + locale + motdParameter;

        if (!game) {
            return error(COD.api.papi.error(endpoint, 'invalid parameters.'));
        }

        COD.api.papi.crm.get(endpoint, function(res) {
            var data = res.data || {};
            if (res.status !== 'success') return error(data.message || res.status);
            var message = data.message || {};
            message.id = data.messageID;
            message.title = message.title || '';
            message.content_long = message.content_long || '';
            message.content_long = message.content_long.replace(/(<([^>]+)>)/ig, '');
            callback(message);
        });
    };

    COD.api.papi.crm.friends = function(platform, username, callback, error) {
        callback = typeof callback === 'function' ? callback : function(data) {};
        error = typeof error === 'function' ? error : function(err) {};
        platform = platform || "psn";

        if(username == null){ return error(COD.api.papi.error(endpoint, "no username provided in friends call")); }
        var hashId = COD.api.sso.hashId();
        if (!hashId) {
            return error(COD.api.papi.error(endpoint, 'Cannot load SSO identities. No hashId id present in cookies.'));
        }

        var endpoint = ['cod', 'v2', 'friends', 'platform', platform, 'gamer', encodeURIComponent(username), 'presence', '1', hashId].join('/');

        COD.api.papi.crm.get(endpoint, function(res){
            res = res || {};
            var data = res.data || [];
            if (res.status !== 'success') return error(data.message || res.status);

            return callback(data);
        });
    }

    COD.api.papi.crm.friendsProfile = function(game, platform, username, callback, error) {
        callback = typeof callback === 'function' ? callback : function(data) {};
        error = typeof error === 'function' ? error : function(err) {};
        platform = platform || "psn";
        game = game || "wwii";

        if(username == null){ return error(COD.api.papi.error(endpoint, "no username provided in friends profile call")); }

        var endpoint = ['cod', 'v2', 'title', game, 'platform', platform, 'gamer', encodeURIComponent(username), 'profile', 'friends'].join('/');

        COD.api.papi.crm.get(endpoint, function(res){
            res = res || {};
            var data = res.data || [];
            if (res.status !== 'success') return error(data.message || res.status);
           

            return callback(data);
        });
    }

    COD.api.papi.crm.globalStats = function(game, callback, error) {
        callback = typeof callback === 'function' ? callback : function(data) {};
        error = typeof error === 'function' ? error : function(err) {}; 
        game = game || "wwii";

        var endpoint = "cod/v2/title/" + game +"/community";

        COD.api.papi.crm.get(endpoint, function(res){
            res = res || {};
            if (res.status !== 'success') return error(data.message || res.status);

            var data = res.data || {};

            return callback(data);
        });
    }

    COD.api.papi.crm.zombiesAuth = function(game, platform, username, code, callback, error ) {
        callback = typeof callback === 'function' ? callback : function(data) {};
        error = typeof error === 'function' ? error : function(err) {}; 
        game = game || "bo4";
        username = encodeURIComponent(username);
        code = encodeURIComponent(code);

        //https://stage.callofduty.com/api/papi-client/zmauth/v1/title/bo4/platform/psn/gamer/quechuan140/zombies/match/authenticated/phrase/Nearly%20Agonizing%20Short%20Corpses
        var endpoint = ["zmauth/v1/title", game, "platform", platform, "gamer", username, "zombies/match/authenticated/phrase", code].join('/');
		console.log(endpoint);
        COD.api.papi.get(endpoint, function(res) {
            if(res.status !== 'success') return error(res);

            return callback(res.data);
        })
        //callback({"gameLength":263850,"map":"zm_towers","numZombieRounds":4,"roundEnd":4,"downCount":3,"difficulty":1,"gameType":"zclassic","playerStats":{"brutusesKilled":0.0,"killedByCatalystCorrosive":0.0,"ballisticKnivesPickedup":0.0,"meleeKills":13.0,"instaKillPickedup":0.0,"doorsPurchased":0.0,"score":4790.0,"specialtyDeadshotDrank":0.0,"totalXp":2525.0,"startXp":229900.0,"totalShots":60.0,"specialtyFlakjacketDrank":0.0,"endRank":17.0,"specialtyAdditionalprimaryweaponDrank":0.0,"perksDrank":0.0,"killedByCatalystElectric":0.0,"killedByCatalystWater":0.0,"killedByNovaCrawler":0.0,"scoreEarned":3210.0,"powerTurnedon":0.0,"deaths":1.0,"catalystWatersKilled":0.0,"specialtyLongersprintDrank":0.0,"wallbuyWeaponsPurchased":1.0,"windowsBoarded":1.0,"killedByCatalystPlasma":0.0,"downs":6.0,"killedByGladiator":0.0,"prestige":0.0,"revives":2.0,"killedByBrutus":0.0,"bgbsChewed":2.0,"tigersKilled":0.0,"wonderWeaponKills":0.0,"suicides":0.0,"doublePointsPickedup":0.0,"grenadeKills":0.0,"specialtyQuickreviveDrank":0.0,"screecherMinigamesWon":0.0,"startRank":17.0,"killedByHellhound":0.0,"shieldsPurchased":0.0,"powerTurnedoff":0.0,"contaminationsReceived":0.0,"failedSacrifices":0.0,"kills":27.0,"nukePickedup":0.0,"scoreSpent":1400.0,"fullAmmoPickedup":0.0,"buildablesBuilt":0.0,"hellhoundsKilled":0.0,"boards":8.0,"failedRevives":0.0,"killedByAvogadro":0.0,"drops":2.0,"headshots":1.0,"catalystPlasmasKilled":0.0,"novaCrawlersKilled":0.0,"killedByBlightfather":0.0,"misses":13.0,"meatStinkPickedup":0.0,"claymoresPickedup":0.0,"killedByTiger":0.0,"specialtyScavengerDrank":0.0,"catalystsKilled":0.0,"contaminationsGiven":0.0,"zdogsKilled":0.0,"distanceTraveled":37976.0,"avogadroDefeated":0.0,"sacrifices":0.0,"gladiatorsKilled":0.0,"hitsTaken":15.0,"plantedBuildablesPickedup":0.0,"upgradedAmmoPurchased":0.0,"killedByCatalyst":0.0,"screecherTeleportersUsed":0.0,"blightfathersKilled":0.0,"screechersKilled":0.0,"specialtyArmorvestDrank":0.0,"carpenterPickedup":0.0,"claymoresPlanted":0.0,"screecherMinigamesLost":0.0,"hits":52.0,"specialtyRofDrank":0.0,"endXp":232425.0,"catalystElectricsKilled":0.0,"catalystCorrosivesKilled":0.0,"killedByZdog":0.0,"distanceSprinted":0.0,"specialtyFastreloadDrank":0.0,"ammoPurchased":0.0},"gameSettings":{"teamKillScore":4.0,"antiBoostDistance":0.0,"zmTalismanPerkModSingle":true,"zmWalkerState":0.0,"maxAllowedPrimaryAttachments":0.0,"zmHeadshotsOnly":false,"cleansedLoadout":false,"forwardSpawnTakesDamage":false,"presetClassesPerTeam":false,"zmZombieMaxSpeed":3.0,"zmTalismanExtraSemtex":true,"robotShield":false,"leaderBonus":0.0,"zmZombieHealthMult":1.0,"silentPlant":false,"draftMatchStartTime":3.0,"forwardSpawnIsNeutral":false,"friendlyEquipmentKeylines":false,"killstreaksGiveGameScore":false,"zmPerksSecretSauce":true,"destroyTime":0.0,"disallowprone":false,"zmMysteryBoxLimitMove":0.0,"zmElixirJoinTheParty":true,"zmPopcornDamageMult":1.0,"zmRunnerState":0.0,"pregameCACModifyTime":0.0,"timePausesWhenInZone":false,"zmHeavySpawnFreq":1.0,"disableCAC":true,"flagCaptureRateIncrease":false,"incrementalSpawnDelay":1.17549435E-38,"zmTalismanCoagulant":true,"zmTalismanBoxGuaranteeLMG":true,"allowAnnouncer":false,"zmRoundCap":0.0,"zmElixirWallPower":true,"playOfTheMatchBonusSearchTimePerEvent":2.0,"maxPlayerOffensive":0.0,"deployableBarrierExplosiveMultiplier":1.377532E-39,"pregameItemVoteEnabled":false,"ekiaResetOnDeath":false,"zmElixirLicensedContractor":true,"playerKillsMax":0.0,"zmTalismanBoxGuaranteeBoxOnly":true,"killcamTime":2.8E-45,"forwardSpawnHealth":0.0,"startPlayers":0.0,"roundSwitch":1.0,"zmElixirsIndividual":true,"maxTeamPlayers":0.0,"deployableBarrierCanBeDamaged":false,"zmElixirShieldsUp":true,"zmPowerupSharing":true,"carryScore":0.0,"draftHideEnemyTeam":false,"zmElixirsLegendary":true,"deathPointLoss":false,"flagCaptureGracePeriod":0.0,"zmTalismansEpic":true,"deathCircle":false,"zmElixirCrawlSpace":true,"zmElixirFreeFire":true,"gameAdvertisementRuleRoundsWon":0.0,"zmElixirPointDrops":true,"useItemSpawns":false,"zmElixirPopShocks":true,"zmPerksPhdSlider":true,"killPointsInEnemyProtectedZone":0.0,"disableAmbientFx":false,"zmPointsLossType":0.0,"zmTalismanStartWeaponLMG":true,"zmPowerDoorState":1.0,"zmSpecialRoundsEnabled":true,"zmElixirPhantomReload":true,"teamKillPunishCount":3.0,"allowBattleChatter":true,"zmTrapsEnabled":true,"useDoors":true,"zmKillCap":0.0,"infectionMode":0.0,"neutralZone":false,"zmWeaponsTR":true,"fogOfWarMinimap":false,"zmDifficulty":1.0,"zmTalismanSpecialStartLvl2":true,"zmHealthRegenDelay":1.0,"zmTalismanSpecialStartLvl3":true,"flagCanBeNeutralized":false,"zmZombieDamageMult":1.0,"delayPlayer":false,"zmSuperPaPEnabled":true,"zmBotsEnabled":false,"zmPointsLossValue":0.0,"zmLastStandDuration":2.0,"zmElixirAntiEntrapment":true,"teamScorePerKillDenied":0.0,"teamKillPointLoss":false,"zmWallBuysEnabled":true,"zmPowerupCarpenter":true,"zmPointsFixed":false,"forwardSpawnDefaultDisableTime":0.0,"zmTalismanPerkStart4":true,"zmElixirAnywhereButHere":true,"teamAssignment":0.0,"zmTalismanPerkStart1":true,"zmTalismanPerkStart3":true,"zmTalismanPerkStart2":true,"voipDeadHearAllLiving":false,"draftTime":30.0,"disallowaimslowdown":false,"draftEveryRound":false,"playOfTheMatchBonusSearchTimeMaxPerEvent":4.0,"zmHealthOnKill":0.0,"zmSpecWeaponChargeRate":1.0,"roundScoreLimit":0.0,"zmEndOnQuest":false,"playerRespawnDelay":2.3509887E-38,"zmElixirsRare":true,"zmSpecWeaponIsEnabled":true,"zmCatalystAggro":true,"decayCapturedZones":false,"zmHeavyHealthMult":1.0,"roundLimit":1.0,"skipLastStand":false,"teamKillReducedPenalty":5.74E-42,"OvertimetimeLimit":1.6940659E-21,"zmPerksVictorious":true,"idleFlagDecay":false,"playOfTheMatchBlacklistDebuff":2.75515E-40,"zmPerksStaminUp":true,"disableweapondrop":true,"zmPowerupFireSale":true,"zmPopcornState":1.0,"allowSpectating":false,"pointsPerPrimaryKill":0.0,"zmLimitedDownsIsEnabled":false,"pickupTime":0.0,"zmWeaponsSniper":true,"teamKillPenalty":2.0,"zmTalismanStartWeaponAR":true,"decayProgress":false,"pregameItemVoteRoundTime":0.0,"zmWeaponsKnife":true,"zmShieldDurability":1.0,"scoreLimit":7500.0,"scoreResetOnDeath":false,"zmElixirImmolationLiquidation":true,"pregameItemMaxVotes":0.0,"cumulativeRoundScores":false,"roundStartExplosiveDelay":2.2966E-41,"flagDecayTime":0.0,"zmMiniBossDamageMult":1.0,"zmPerksStoneCold":true,"carrierArmor":0.0,"maxPlayOfTheMatchEvents":10.0,"playerSprintTime":3.593E-42,"carrierMoveSpeed":0.0,"zmElixirsEnabled":true,"zmElixirsCooldown":1.0,"gameAdvertisementRuleRound":0.0,"waveRespawnDelay":1.6282582E-27,"roundStartKillstreakDelay":5.92339E-39,"wagermatchhud":false,"allowMapScripting":false,"zmTalismanShieldDurabilityRare":true,"zmMysteryBoxIsLimited":false,"maxAllocation":0.0,"zmElixirRespinCycle":true,"zmTalismansCommon":true,"objectivePingTime":0.0,"zmElixirTemporalGift":true,"ticketsLostOnTimeAmount":0.0,"zmElixirSwordFlay":true,"zmElixirPhoenixUp":true,"gameAdvertisementRuleStopAtGameStart":false,"preroundperiod":0.0,"zmCatalystDamageMult":1.0,"ticketsEarnedAtStageWin4":0.0,"ticketsEarnedAtStageWin3":0.0,"shutdownDamage":0.0,"ticketsEarnedAtStageWin2":0.0,"zmElixirPowerKeg":true,"ticketsEarnedAtStageWin1":0.0,"capDecay":false,"ticketsEarnedAtStageWin0":0.0,"spawnHealthBoostTime":0.0,"pregameDraftType":0.0,"maxBots":3.0,"allowaimslowdown":false,"zmBotsMax":1.0,"useEmblemInsteadOfFactionIcon":false,"scorePerPlayer":false,"zmLimitedDownsAmount":0.0,"zmElixirInPlainsight":true,"vehiclesTimed":true,"allowFinalKillcam":false,"zmPointLossOnDeath":0.0,"spawnsuicidepenalty":0.0,"zmTalismanExtraMolotov":true,"zmPowerupSpecialWeapon":true,"pregamePreStageTime":0.0,"zmElixirNearDeathExperience":true,"maxPlayOfTheMatchEventTime":20.0,"killcamGrenadeTime":9.1841E-41,"ballCount":0.0,"zmCrawlerAggro":true,"characterCustomization":0.0,"playerForceRespawn":true,"zmElixirHeadScan":true,"scoreThiefPowerGainFactor":0.0,"zmPopcornHealthMult":1.0,"forceRadar":0.0,"gunSelection":0.0,"zmMiniBossHealthMult":1.0,"zmBarricadeState":true,"escalationEnabled":false,"teamScorePerHeadshot":0.0,"zmTalismanExtraFrag":true,"playOfTheMatchAllowSkip":true,"autoDestroyTime":0.0,"randomObjectiveLocations":0.0,"zmElixirArsenalAccelerator":true,"zmWeaponsMelee":true,"zmCatalystState":1.0,"zmPointLossOnDown":0.0,"hardcoreMode":false,"zmElixirCtrlZ":true,"trmMaxHeight":3.85186E-34,"zmPowerupChaosPoints":true,"zmElixirWallToWall":true,"servermsec":50.0,"plantTime":4.5918E-41,"throwScore":0.0,"voipEveryoneHearsEveryone":false,"zmPerksMuleKick":true,"zmElixirWhosKeepingScore":true,"zmTalismansLegendary":true,"draftEnabled":true,"oldschoolMode":false,"zmElixirDeadOfNuclearWinter":true,"spawnGroupRadius":450.0,"setbacks":0.0,"allowKillcam":false,"zmTalismanShieldDurabilityLegendary":true,"zmCatalystHealthMult":1.0,"zmMysteryBoxLimit":0.0,"playerObjectiveHeldRespawnDelay":4.5918E-41,"zmRandomWallBuys":0.0,"useSpawnGroups":false,"zmCraftingKeyline":false,"capturesPerReturnSite":0.0,"zmHealthStartingBars":3.0,"scoreEquipmentPowerTimeFactor":-0.5039253,"zmElixirBoardGames":true,"timeLimit":1.4E-44,"zmElixirStockOption":true,"zmWeaponsLMG":true,"zmShowTimer":false,"idleFlagResetTime":0.0,"zmPowerupsIsLimitedRound":false,"zmTalismanBoxGuaranteeWonder":true,"zmPerkDecay":1.0,"pregamePositionShuffleMethod":0.0,"allowInGameTeamChange":false,"zmElixirSodaFountain":true,"disableContracts":false,"maxAllowedSkills":0.0,"pointsForSurvivalBonus":0.0,"spawnprotectiontime":0.0,"zmMysteryBoxLimitRound":0.0,"flagRespawnTime":0.0,"ticketsLostOnTimeInterval":0.0,"teamScorePerCleanDeposit":0.0,"zmPerksSpeed":true,"scoreHeroPowerGainFactor":1.4E-45,"rebootPlayers":false,"extraTime":1.17549435E-38,"zmElixirNowhereButThere":true,"totalKillsMax":0.0,"zmPowerupNuke":true,"headshotsonly":false,"zmElixirBloodDebt":true,"zmTalismanExtraClaymore":true,"bonusLivesForCapturingZone":0.0,"zmElixirsEpic":true,"zmPowerupMaxAmmo":true,"loadoutKillstreaksEnabled":true,"pregamePostRoundTime":0.0,"teamScorePerKill":0.0,"disableManualHealing":false,"zmPowerupFrequency":1.0,"zmWonderWeaponIsEnabled":true,"zmWeaponsAR":true,"ekiaClearTime":0.0,"kothMode":false,"disableAttachments":false,"pointsPerSecondaryKill":0.0,"zmPerksDeadshot":true,"voipKillersHearVictim":true,"zmTalismansUltra":true,"zmPowerupDouble":true,"disableClassSelection":false,"zmPowerState":1.0,"zmPerksActive":true,"zmElixirAlwaysDoneSwiftly":true,"zmHeavyAggro":true,"playerHealthRegenTime":9.7E-44,"bulletDamageScalar":1.4E-45,"zmTalismanReducePAPCost":true,"prematchperiod":0.0,"spawntraptriggertime":4.5918E-41,"objectiveSpawnTime":0.0,"droppedTagRespawn":false,"playerMaxHealth":100.0,"zmWeaponsShotgun":true,"zmMiniBossState":1.0,"zmElixirNowYouSeeMe":true,"forwardSpawnDefaultBuildTime":0.0,"captureTime":1.4E-44,"lowImpactBots":false,"fowRevealEnabled":false,"zmElixirPerkaholic":true,"scoreHeroPowerTimeFactor":5.877875E-39,"maxPlayerEventsPerMinute":0.0,"zmSelfReviveAmount":0.0,"perksEnabled":false,"depositTime":0.0,"maxPlayOfTheMatchTotalTime":60.0,"weaponTimer":0.0,"zmPowerupsLimitRound":0.0,"zmShieldIsEnabled":true,"pregamePostStageTime":0.0,"forwardSpawnEnabled":false,"zmCrawlerDamageMult":1.0,"zmEquipmentChargeRate":1.0,"teamScorePerKillConfirmed":0.0,"usableDynents":false,"zmMysteryBoxState":2.0,"prematchrequirement":0.0,"zmHealthDrain":0.0,"zmTalismansRare":true,"zmZombieMinSpeed":0.0,"deployableBarrierDestroyTime":0.0,"movePlayers":false,"deathZones":false,"crateCaptureTime":2.3322E-41,"deployableBarrierBuildTime":0.0,"playOfTheMatchAllowCinematicCameras":true,"pregameScorestreakModifyTime":0.0,"zmZombieSpread":1.0,"inactivityKick":0.0,"zmTalismanStartWeaponSMG":true,"flagCaptureCondition":false,"voipDeadChatWithTeam":true,"zmPointLossOnTeammateDeath":0.0,"zmElixirEquipMint":true,"zmCatalystSpawnFreq":1.0,"zmTalismansIndividual":true,"zmPointsStarting":5.0,"cleanDepositOnlineTime":0.0,"pointsPerWeaponKill":0.0,"gameAdvertisementRuleTimeLeft":0.0,"hideEnemiesExceptSensorDart":false,"robotSpeed":0.0,"zmElixirsDurables":true,"classicMode":false,"zmMysteryBoxIsLimitedRound":false,"maxActiveKillcams":0.0,"maxPlayerDefensive":0.0,"friendlyfiretype":0.0,"vehiclesEnabled":true,"zmTalismanSpecialXPRate":true,"forwardSpawnProximityActivate":false,"zmCrawlerHealthMult":1.0,"zmHeavyState":1.0,"draftSwitchCooldown":0.0,"forwardSpawnTeamSpecificSpawns":false,"forwardSpawnProximityRadius":0.0,"pregameDraftEnabled":false,"zmTalismanPerkPermanent4":true,"zmTalismanShieldPrice":true,"zmTalismanPerkPermanent2":true,"zmTalismanPerkPermanent3":true,"zmPowerupFreePerk":true,"zmTalismanPerkPermanent1":true,"playerQueuedRespawn":false,"zmElixirAftertaste":true,"zmElixirDangerClosest":true,"maxPlayers":4.0,"voipDeadChatWithDead":false,"bootTime":0.0,"pointsPerMeleeKill":0.0,"zmPerksQuickRevive":true,"zmElixirExtraCredit":true,"voipLobbyChatPartyOnly":false,"zmMinibossSpawnFreq":1.0,"zmCrawlerState":1.0,"autoTeamBalance":false,"bombTimer":-1.1920929E-7,"teamKillSpawnDelay":20.0,"zmPerksWidowsWail":true,"cleanDepositRotation":0.0,"zmElixirNewtonianNegation":true,"voipDeadHearKiller":false,"boastAllowCam":false,"zmWeaponsSMG":true,"pregameDraftRoundTime":0.0,"zmHealthRegenRate":2.0,"teamCount":1.0,"killcamHistorySeconds":60.0,"hotPotato":false,"zmPowerupsActive":true,"maxSuicidesBeforeKick":0.0,"zmTalismansEnabled":true,"zmEquipmentIsEnabled":true,"spawnHealthBoostPercent":0.0,"zmHeavyDamageMult":1.0,"zmPerksJuggernaut":true,"onlyHeadshots":false,"teamScorePerDeath":0.0,"boastEnabled":false,"zmElixirCacheBack":true,"draftRequiredClients":0.0,"ticketsLostOnDeath":0.0,"playOfTheMatchBlacklistGraceRate":0.0,"zmPerksBandolier":true,"forwardSpawnFastUseMultiplier":0.0,"heliUseNavvolumePaths":false,"killEventScoreMultiplier":4.59177E-40,"weaponCount":0.0,"zmTimeCap":0.0,"teamNumLives":0.0,"disableThirdPersonSpectating":false,"zmTalismanImpatient":true,"zmWeaponsPistol":true,"multiBomb":false,"playerNumLives":0.0,"magic":true,"zmMainQuestIsEnabled":true,"disableCompass":false,"pregamePositionSortType":0.0,"ticketsGivenAtStageStart2":0.0,"spectateType":1.0,"ticketsGivenAtStageStart1":0.0,"zmElixirUndeadManWalking":true,"ticketsGivenAtStageStart4":0.0,"zmPerksAllRandom":false,"ticketsGivenAtStageStart3":0.0,"ticketsGivenAtStageStart0":0.0,"allowprone":false,"enableArmorFeedback":false,"zmPopcornSpawnFreq":1.0,"objectiveHealth":0.0,"gameAdvertisementRuleScorePercent":0.0,"zmPerksElectricBurst":true,"zmMysteryBoxIsLimitedMove":false,"zmDoorState":1.0,"zmElixirAlchemicalAntithesis":true,"playOfTheMatchBufferSize":1.4E-44,"deployableBarrierHealth":0.0,"spawnteamkilledpenalty":0.0,"pregameAlwaysShowStreakEdit":false,"zmPointsLossPercent":0.0,"allowdogs":false,"pregameAlwaysShowCACEdit":false,"disableTacInsert":false,"rebootTime":0.0,"zmStartingWeaponEnabled":true,"zmPerksCooldown":true,"deployableBarriersEnabled":false,"zmTalismanPerkReduceCost4":true,"voipDeadHearTeamLiving":true,"zmPaPEnabled":1.0,"zmTalismanPerkReduceCost3":true,"deployableBarrierRechargeTime":0.0,"zmTalismanPerkReduceCost2":true,"zmPowerupInstakill":true,"zmTalismanPerkReduceCost1":true,"zmElixirsCommon":true,"allowhitmarkers":2.0,"startRound":1.0,"maxObjectiveEventsPerMinute":1.14794E-41,"pointsPerPrimaryGrenadeKill":0.0,"enemyCarrierVisible":0.0,"roundWinLimit":0.0,"allowPlayOfTheMatch":false,"specialistChangeCooldownTime":0.0,"zmMiniBossAggro":true,"defuseTime":5.878189E-39,"zmPointsLossOnHit":false,"spawnSelectEnabled":false,"zmElixirBurnedOut":true,"maxAllowedSecondaryAttachments":0.0,"zmRetainWeapons":true,"allowCinematicSpectate":false,"zmPerksDeathPerception":true,"zmTalismanExtraMiniturret":true,"zmPerksDyingWish":true,"zmElixirKillJoy":true,"playOfTheMatchAllowBotBookmarks":true,"playOfTheMatchIgnoreKillBookmark":false},"teamScore":3210,"alliesScore":0,"utcStartTimeSeconds":1538439232,"utcEndTimeSeconds":1538439549,"matchID":"2274762526967524868","isPrivateMatch":"false","playerCount":1});
    }

})(COD, jQuery);
