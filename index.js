const API = require('call-of-duty-api');

API.IWStats("lierrmm", "psn").then((output) => {
  console.log(output);  
}).catch((err) => {
    console.log(err);
});
