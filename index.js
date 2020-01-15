exports.handler = async (event) => {

    const gitHubBody = JSON.parse(event.body);
    const eventName = event.headers['X-GitHub-Event'];

    const message = {
        title: null,
        url: null,
        body: null,
    }

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

    // TODO POST処理
    
    return {
        statusCode: 200,
        body: JSON.stringify('Finish'),
    };
};
