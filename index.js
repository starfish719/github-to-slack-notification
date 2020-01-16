var https = require('https');
const MAPPING_LIST = require('./mapping.json');
exports.handler = async (event) => {
    const gitHubBody = JSON.parse(event.body);
    const eventName = event.headers['X-GitHub-Event'];

    const message = {
        title: null,
        body: null,
    };

    if (eventName === 'pull_request' && gitHubBody.action === 'opened') {
        message.title = `Pullrequest Opened [<${gitHubBody.pullRequest.html_url}|${gitHubBody.pullRequest.title}>]`;
        message.body = gitHubBody.pullRequest.body;
    } else if (eventName === 'issues' && gitHubBody.action === 'opened')  {
        message.title = `Issue Opened [<${gitHubBody.issue.html_url}|${gitHubBody.issue.title}>]`;
        message.body = gitHubBody.issue.body;
    } else if (eventName === 'issue_comment' && gitHubBody.action === 'created')  {
        message.title = `Issue Comment on [<${gitHubBody.comment.html_url}|${gitHubBody.issue.title}>]`;
        message.body = gitHubBody.comment.body;
    } else if (eventName === 'pull_request_review_comment' && gitHubBody.action === 'created')  {
        message.title = `Review on [<${gitHubBody.comment.html_url}|${gitHubBody.pullRequest.title}>]`;
        message.body = gitHubBody.comment.body;
    } else {
        return {
            statusCode: 200,
            body: 'No post event',
        }; 
    }

    if (!message.body) {
        return {
            statusCode: 200,
            body: 'No message',
        }; 
    }

    mentionList = getMentionList(message.body);
    message.title = mentionList.join(' ') + ' ' + message.title;

    await Promise.all([post(message)]);
    
    return {
        statusCode: 200,
        body: JSON.stringify('Finish'),
    };
};

function getMentionList (body) {
    if (body == null || body === undefined) {
        body = '';
    }

    var mentionList = [];
    Object.keys(MAPPING_LIST).forEach(function (key) {
        if (body.indexOf('@' + key) >= 0) {
            mentionList.push('<@' + MAPPING_LIST[key] + '>');
        }
    });

    return mentionList;
}

function post (message) {
    return new Promise((resolve, reject) => {
        const data = {
            username: "github2slack",
            channel: process.env['CHANNEL_ID'],
            text: message.title,
            token: process.env['API_TOKEN'],
        };
        const options = {
            host: 'slack.com',
            port: '443',
            path: '/api/chat.postMessage',
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + process.env['API_TOKEN'],
                'Content-Type': 'application/json',
            },
        };
        const req = https.request(options, res => {
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                const result = JSON.parse(chunk);
                if (result.ok) {
                    resolve(chunk);
                } else {
                    resolve(new Error());
                }
            });
        });
        req.on('error', e => {
            resolve(new Error());
        });
        req.write(JSON.stringify(data));
        req.end();
    });
}
