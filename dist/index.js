const axios = require('axios');
let qs =  require('qs');

let usersRequests = {};

module.exports = {
  api: process.env.bitsoApi || "",
  secret: process.env.bitsoSecret || "",
  baseUrl: "https://api.bitso.com/v3/",
  requestPublic: function(endpoint, params = {}){
    //console.log(params)
    return axios.get(`${this.baseUrl}${endpoint}`, {params})
      .then(({data})=>data)
      .catch((err)=>console.log(err));
  },
  available_books: function(params = {}){
    return this.requestPublic('available_books/', params);
  },
  order_book: function(params = {book:'btc_mxn'}){
    return this.requestPublic('order_book/', params);
  },
  trades: function(params = {book:'btc_mxn'}){
    return this.requestPublic('trades/', params);
  },
  ticker: function(params = {book:'btc_mxn'}){
    return this.requestPublic('ticker/', params);
  },

  requestPrivate: function(endpoint, params, method, credentials){
    let secret = "";
    let apiKey = "";
    let baseUrl = this.baseUrl;
    if(credentials.key && credentials.secret){
      secret = credentials.secret;
      apiKey = credentials.key;
    } else {
      secret = this.secret;
      apiKey = this.api;
    }
    if(!usersRequests[apiKey]) usersRequests[apiKey] = [];
    return new Promise( function(resolve, refuse){
      usersRequests[apiKey].unshift(() => {
        let nonce = new Date().getTime();
        let json_payload = '';//params ? qs.stringify(params) : ""; // not working D:
        let request_path = `/v3/${endpoint}?` + qs.stringify(params);

        // Create the signature
        let Data = nonce + method.toLocaleUpperCase() + request_path + json_payload;
        let crypto = require('crypto');
        let signature = crypto.createHmac('sha256', secret).update(Data).digest('hex');
        let auth_header = "Bitso " + apiKey + ":" + nonce + ":" + signature;

        let config = {
          headers: {
            'Authorization': auth_header,
          },
        };
        let args =
          method === `get` ?
            [config] :
            [json_payload, config];
        //console.log(`${this.baseUrl}${endpoint}?` + qs.stringify(params), ...args);
        return axios[method](`${baseUrl}${endpoint}?` + qs.stringify(params), ...args)
          .then(({data})=>{
            usersRequests[apiKey].pop();
            if(usersRequests[apiKey].length) usersRequests[apiKey][usersRequests[apiKey].length-1]();
            resolve(data)
          })
          .catch((err)=>{
            usersRequests[apiKey].pop();
            if(usersRequests[apiKey].length) usersRequests[apiKey][usersRequests[apiKey].length-1]();
            console.error(err.response.data);
            refuse(err)
          });
      });
      if(usersRequests[apiKey].length == 1){
        usersRequests[apiKey][usersRequests[apiKey].length-1]();
      }
    });
  },
  account_status: function(params = {}, credentials={}){
    return this.requestPrivate('account_status/', false, 'get', credentials)
  },
  balance: function(params = {}, credentials={}){
    return this.requestPrivate('balance/', false, 'get', credentials);
  },
  fees: function(params = {}, credentials={}){
    return this.requestPrivate('fees/', false, 'get', credentials);
  },
  ledger: function(params = {limit:100}, credentials={}){
    return this.requestPrivate('ledger/', params, 'get', credentials);
  },
  withdrawals: function(params = {limit:100}, credentials={}){
    return this.requestPrivate('withdrawals/', params, 'get', credentials);
  },
  fundings: function(params = {limit:100}, credentials={}){
    return this.requestPrivate('fundings/', params, 'get', credentials);
  },
  user_trades: function(params = {limit:100, book: 'btc_mxn'}, credentials={}){
    return this.requestPrivate('user_trades/', params, 'get', credentials);
  },
  open_orders: function(params = {book: 'btc_mxn'}, credentials={}){
    return this.requestPrivate('open_orders/', params, 'get', credentials);
  },
  funding_destination: function(params = {fund_currency: 'eth'}, credentials={}){
    return this.requestPrivate('funding_destination/', params, 'get', credentials);
  },
  bitcoin_withdrawal: function(params = {amount: 0, address:'invalid'}, credentials={}){
    if(amount === 0) return console.error("Incorrect withdrawal information");;
    return this.requestPrivate('bitcoin_withdrawal/', params, 'post', credentials);
  },
  ether_withdrawal: function(params = {amount: 0, address:'invalid'}, credentials={}){
    if(amount === 0) return console.error("Incorrect withdrawal information");;
    return this.requestPrivate('ether_withdrawal/', params, 'post', credentials);
  },
  spei_withdrawal: function(params = {amount: 0, recipient_given_names:'invalid',
        recipient_family_names: "", clabe: "", notes_ref: "", numeric_ref: ""}, credentials={}){
    if(amount === 0) return console.error("Incorrect withdrawal information");;
    return this.requestPrivate('spei_withdrawal/', params, 'post', credentials);
  },
  mx_bank_codes: function(params = {}, credentials={}){
    return this.requestPrivate('mx_bank_codes/', params, 'get', credentials);
  },
};
