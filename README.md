# github-to-slack-notification

## About
Notification script from github to slack

Convert github mentions to slack mentions

## Development
- `npm ci`
- `npm run test`

## Commit
- `npm run commit`

## Setting
### Create slack app
- Access to https://api.slack.com
- Create new app
- Set permission `chat:write:bot`
- Remember the OAuth Access Token
  - Use OAuth Access Token when you make a Lambda Script

### Create Lambda Script
- Create a AWS Lambda Script
  - Use Node.js
  - Trigger is AWS API Gateway
- Copy to index.js and common.js
- Create mapping.json
  - From github_id to slack_id
- Setting ENV Vals
  - API_TOKEN
    - OAuth Access Token
  - CHANNEL_ID
    - Notification slack channel id

### Setting Webhook
- Create GitHub repository Webhook setting
  - Payload URL
    - URL of API Gateway
  - Content type
    - application/json
  - SSL verification
    - Enable SSL verification
  - Which events would you like to trigger this webhook?
    - Send me everything.
  - Active
    - Check it
