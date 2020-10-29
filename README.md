# kabia
social network to learn and practice Basque


Add this code in a file called keys.js inside /config directory using your own API keys, secrets and credentials
```
module.exports = {
  //Session secret (express-session)
  sessionSecret: "",

  //MongoDB Atlas DB URI
  dbURI: "",

  //AWS
  AWS_ACCESS_KEY_ID: "",
  AWS_SECRET_ACCESS_KEY: "",
  AWS_REGION: "",

  //Google OAuth
  GOOGLE_CLIENT_ID: "",
  GOOGLE_CLIENT_SECRET: "",

  //Facebook OAuth
  FACEBOOK_APP_ID: "",
  FACEBOOK_APP_SECRET: "",

  //User for E2E testing
  PUPPETEER_E2E_TEST_EMAIL: "",
  PUPPETEER_E2E_TEST_PASSWORD: "",

  //Send emails using AWS SES: true or false
  send_email_allowed: , 

  //Used domain name and express web server port number
  domain: "",
  PORT: ,

  //Stun and turn servers URLs
  stunTurnServers: ``
 
};
```