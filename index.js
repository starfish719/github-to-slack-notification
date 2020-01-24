const https = require('https');
const MAPPING_LIST = require('./mapping.json');

function getMentionList(body) {
  const mentionList = [];

  if (body == null || body === undefined) {
    return mentionList;
  }

  Object.keys(MAPPING_LIST).forEach((key) => {
    if (body.indexOf(`@${key}`) >= 0) {
      mentionList.push(`<@${MAPPING_LIST[key]}>`);
    }
  });

  return mentionList;
}

function post(message) {
  return new Promise((resolve, reject) => {
    const data = {
      username: 'github2slack',
      channel: process.env.CHANNEL_ID,
      text: message.title,
      token: process.env.API_TOKEN,
    };
    const options = {
      host: 'slack.com',
      port: '443',
      path: '/api/chat.postMessage',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };
    const req = https.request(options, (res) => {
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
    req.on('error', (e) => {
      resolve(new Error(e));
    });
    req.on('for lint', (e) => {
      reject(new Error(e));
    });
    req.write(JSON.stringify(data));
    req.end();
  });
}

exports.handler = async (event) => {
  const gitHubBody = JSON.parse(event.body);
  const eventName = event.headers['X-GitHub-Event'];

  const message = {
    title: null,
    body: null,
  };

  if (eventName === 'pull_request') {
    if (gitHubBody.action === 'opened') {
      message.title = `Pullrequest Opened [<${gitHubBody.pull_request.html_url}|${gitHubBody.pull_request.title}>]`;
      message.body = gitHubBody.pull_request.body;
    } else if (gitHubBody.action === 'closed') {
      message.title = `Pullrequest Closed [<${gitHubBody.pull_request.html_url}|${gitHubBody.pull_request.title}>]`;
      message.body = '';
    } else if (gitHubBody.action === 'review_requested') {
      message.title = `Review requested [<${gitHubBody.pull_request.html_url}|${gitHubBody.pull_request.title}>]`;
      message.body = `@${gitHubBody.requested_reviewer.login}`;
    }
  } else if (eventName === 'issues') {
    if (gitHubBody.action === 'opened') {
      message.title = `Issue Opened [<${gitHubBody.issue.html_url}|${gitHubBody.issue.title}>]`;
      message.body = gitHubBody.issue.body;
    } else if (gitHubBody.action === 'closed') {
      message.title = `Issue Closed [<${gitHubBody.issue.html_url}|${gitHubBody.issue.title}>]`;
      message.body = '';
    }
  } else if (eventName === 'issue_comment' && gitHubBody.action === 'created') {
    message.title = `Comment on [<${gitHubBody.comment.html_url}|${gitHubBody.issue.title}>]`;
    message.body = gitHubBody.comment.body;
  } else if (eventName === 'pull_request_review' && gitHubBody.action === 'submitted') {
    if (gitHubBody.review.state === 'approved') {
      message.title = `Pullrequest approval [<${gitHubBody.pull_request.html_url}|${gitHubBody.pull_request.title}>]`;
      message.body = '';
    } else if (gitHubBody.review.state === 'changes_requested') {
      message.title = `Pullrequest change request [<${gitHubBody.pull_request.html_url}|${gitHubBody.pull_request.title}>]`;
      message.body = '';
    }
  } else if (eventName === 'pull_request_review_comment' && gitHubBody.action === 'created') {
    message.title = `Review on [<${gitHubBody.comment.html_url}|${gitHubBody.pull_request.title}>]`;
    message.body = gitHubBody.comment.body;
  } else {
    return {
      statusCode: 200,
      body: 'No post event',
    };
  }

  if (!message.title && !message.body) {
    return {
      statusCode: 200,
      body: 'No message',
    };
  }

  const mentionList = getMentionList(message.body);
  message.title = `${mentionList.join(' ')} ${message.title}`;

  await Promise.all([post(message)]);

  return {
    statusCode: 200,
    body: JSON.stringify('Finish'),
  };
};
