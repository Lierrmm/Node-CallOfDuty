[![NPM](https://nodei.co/npm/call-of-duty-api.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/call-of-duty-api/)

# Call Of Duty API Wrapper

Call of Duty Api is a wrapper for the "private" API that Activision use on the callofduty.com website.

# Initialize Module
```javascript
const API = require('call-of-duty-api');
```

# List of Platforms
- psn
- steam
- xbl

# Get Stats
```javascript
    API.IWStats(<gamertag>, <platform>).then((output) => {
      console.log(output);  
    }).catch((err) => {
        console.log(err);
    });
```

# Output
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
