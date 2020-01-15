var https = require('https');
exports.handler = async (event) => {
    const gitHubBody = JSON.parse(event.body);
    const eventName = event.headers['X-GitHub-Event'];

    const message = {
        title: null,
        url: null,
        body: null,
    };

    if (eventName === 'pull_request' && gitHubBody.action === 'opened') {
        message.title = `#${gitHubBody.pullRequest.number} ${gitHubBody.pullRequest.title}`;
        message.url = gitHubBody.pullRequest.html_url;
        message.body = gitHubBody.pullRequest.body;
    } else if (eventName === 'issues' && gitHubBody.action === 'opened')  {
        message.title = `#${gitHubBody.issue.number} ${gitHubBody.issue.title}`;
        message.url = gitHubBody.issue.html_url;
        message.body = gitHubBody.issue.body;
    } else if (eventName === 'issue_comment' && gitHubBody.action === 'created')  {
        message.title = `Comment on #${gitHubBody.issue.number} ${gitHubBody.issue.title}`;
        message.url = gitHubBody.comment.html_url;
        message.body = gitHubBody.comment.body;
    } else if (eventName === 'pull_request_review_comment' && gitHubBody.action === 'created')  {
        message.title = `Review on #${gitHubBody.pullRequest.number} ${gitHubBody.pullRequest.title}`;
        message.url = gitHubBody.comment.html_url;
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

    await Promise.all([post(message.body)]);
    
    return {
        statusCode: 200,
        body: JSON.stringify('Finish'),
    };
};

function post (message) {
    return new Promise((resolve, reject) => {
        const data = {
            username: "github2slack",
            channel: process.env['CHANNEL_ID'],
            attachments: [
              {
                text: message,
              }
            ],
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
