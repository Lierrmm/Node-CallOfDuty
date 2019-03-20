## Important

Call of Duty has updated their API so that you need to pass certain cookies. I have implemented a way around this, however some people are complaining of 403 errors. If you receive a 403 error, then please create a Issue with the title [403] [What endpoint] and add the call you actually made in the description.

[![NPM](https://nodei.co/npm/call-of-duty-api.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/call-of-duty-api/)

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/408dae7e59104196a5b7c0df62ff21bc)](https://app.codacy.com/app/Lierrmm/Node-CallOfDuty?utm_source=github.com&utm_medium=referral&utm_content=Lierrmm/Node-CallOfDuty&utm_campaign=Badge_Grade_Dashboard)[![install size](https://packagephobia.now.sh/badge?p=call-of-duty-api)](https://packagephobia.now.sh/result?p=call-of-duty-api)

# Call Of Duty API Wrapper

Call of Duty Api is a wrapper for the "private" API that Activision use on the callofduty.com website.

## Initialize Module
```javascript
const API = require('call-of-duty-api');
```

## List of Platforms
-   psn
-   steam
-   xbl

## Get Stats
```javascript
    API.IWStats(<gamertag>, <platform>).then((output) => {
      console.log(output);  
    }).catch((err) => {
        console.log(err);
    });
```

## Output
```javascript 
{
    title: 'iw',
    platform: 'platform',
    username: 'gamertag',
    mp:
    { lifetime: { all: [Object], mode: [Object] },
    weekly: null,
    level: 0,
    maxLevel: 0,
    levelXpRemainder: 0,
    levelXpGained: 0,
    prestige: 0,
    prestigeId: 0,
    maxPrestige: 0 },
    zombies:
    { lifetime: { all: [Object], mode: {} },
    weekly: { all: [Object], mode: {} } },
    engagement: { timePlayedAll: 440544, seasonPass: 1 } 
}
```
