const {
  getMentionList,
  getPostData,
  getPostOptions,
  getMessageObject
} = require('../../common');

describe('getMentionList', () => {
  test('convert mention user', () => {
    const convertData = getMentionList('@GITHUB_USER_ID_1 aaa');
    expect(convertData).toStrictEqual(['<@SLACK_USER_ID_1>']);
  });

  test('convert mention users', () => {
    const convertData = getMentionList(
      '@GITHUB_USER_ID_1 aaa @GITHUB_USER_ID_2'
    );
    expect(convertData).toStrictEqual([
      '<@SLACK_USER_ID_1>',
      '<@SLACK_USER_ID_2>'
    ]);
  });

  test('return empty array when not in mapping.json', () => {
    const convertData = getMentionList('@GITHUB_USER_ID_5');
    expect(convertData).toStrictEqual([]);
  });

  test('return empty array when body is null or undefined', () => {
    expect(getMentionList(null)).toStrictEqual([]);
    expect(getMentionList(undefined)).toStrictEqual([]);
  });
});

describe('getPostData', () => {
  test('get data', () => {
    process.env.CHANNEL_ID = 'ABC123';
    process.env.API_TOKEN = 'DEF456';
    const message = { title: 'post data title' };
    expect(getPostData(message)).toStrictEqual({
      username: 'github2slack',
      channel: 'ABC123',
      text: message.title,
      token: 'DEF456'
    });
  });
});

describe('getPostOptions', () => {
  test('get options', () => {
    process.env.API_TOKEN = 'ABC123';
    expect(getPostOptions()).toStrictEqual({
      host: 'slack.com',
      port: '443',
      path: '/api/chat.postMessage',
      method: 'POST',
      headers: {
        Authorization: `Bearer ABC123`,
        'Content-Type': 'application/json'
      }
    });
  });
});

describe('getMessageObject', () => {
  let event = null;
  beforeEach(() => {
    event = {
      headers: { 'X-GitHub-Event': '' },
      body: {
        action: '',
        pull_request: {
          title: 'test pull_request title',
          html_url: 'https://github.com/hoge/fuga/pull/1',
          body: 'pull_request body'
        },
        requested_reviewer: { login: 'reviewer user' },
        review: { state: '' },
        issue: {
          title: 'test issue title',
          html_url: 'https://github.com/hoge/fuga/issues/1',
          body: 'issue body'
        },
        comment: {
          html_url: 'https://github.com/hoge/fuga/issues/1#issuecomment-12345',
          body: 'issue comment body'
        }
      }
    };
  });

  test('pull_request opened', () => {
    event.headers['X-GitHub-Event'] = 'pull_request';

    event.body.action = 'opened';
    event.body = JSON.stringify(event.body);
    expect(getMessageObject(event)).toStrictEqual({
      title:
        'Pullrequest Opened [<https://github.com/hoge/fuga/pull/1|test pull_request title>]',
      body: 'pull_request body'
    });
  });

  test('pull_request closed', () => {
    event.headers['X-GitHub-Event'] = 'pull_request';

    event.body.action = 'closed';
    event.body = JSON.stringify(event.body);
    expect(getMessageObject(event)).toStrictEqual({
      title:
        'Pullrequest Closed [<https://github.com/hoge/fuga/pull/1|test pull_request title>]',
      body: ''
    });
  });

  test('pull_request review_requested', () => {
    event.headers['X-GitHub-Event'] = 'pull_request';

    event.body.action = 'review_requested';
    event.body = JSON.stringify(event.body);
    expect(getMessageObject(event)).toStrictEqual({
      title:
        'Review requested [<https://github.com/hoge/fuga/pull/1|test pull_request title>]',
      body: '@reviewer user'
    });
  });

  test('issues opened', () => {
    event.headers['X-GitHub-Event'] = 'issues';

    event.body.action = 'opened';
    event.body = JSON.stringify(event.body);
    expect(getMessageObject(event)).toStrictEqual({
      title:
        'Issue Opened [<https://github.com/hoge/fuga/issues/1|test issue title>]',
      body: 'issue body'
    });
  });

  test('issues closed', () => {
    event.headers['X-GitHub-Event'] = 'issues';

    event.body.action = 'closed';
    event.body = JSON.stringify(event.body);
    expect(getMessageObject(event)).toStrictEqual({
      title:
        'Issue Closed [<https://github.com/hoge/fuga/issues/1|test issue title>]',
      body: ''
    });
  });

  test('issue_comment created', () => {
    event.headers['X-GitHub-Event'] = 'issue_comment';

    event.body.action = 'created';
    event.body = JSON.stringify(event.body);
    expect(getMessageObject(event)).toStrictEqual({
      title:
        'Comment on [<https://github.com/hoge/fuga/issues/1#issuecomment-12345|test issue title>]',
      body: 'issue comment body'
    });
  });

  test('pull_request_review approval', () => {
    event.headers['X-GitHub-Event'] = 'pull_request_review';

    event.body.action = 'submitted';
    event.body.review.state = 'approved';
    event.body = JSON.stringify(event.body);
    expect(getMessageObject(event)).toStrictEqual({
      title:
        'Pullrequest approval [<https://github.com/hoge/fuga/pull/1|test pull_request title>]',
      body: ''
    });
  });

  test('pull_request_review change_request', () => {
    event.headers['X-GitHub-Event'] = 'pull_request_review';

    event.body.action = 'submitted';
    event.body.review.state = 'changes_requested';
    event.body = JSON.stringify(event.body);
    expect(getMessageObject(event)).toStrictEqual({
      title:
        'Pullrequest change request [<https://github.com/hoge/fuga/pull/1|test pull_request title>]',
      body: ''
    });
  });

  test('pull_request_review comment', () => {
    event.headers['X-GitHub-Event'] = 'pull_request_review_comment';

    event.body.action = 'created';
    event.body = JSON.stringify(event.body);
    expect(getMessageObject(event)).toStrictEqual({
      title:
        'Review on [<https://github.com/hoge/fuga/issues/1#issuecomment-12345|test pull_request title>]',
      body: 'issue comment body'
    });
  });

  test('convert mention', () => {
    event.headers['X-GitHub-Event'] = 'pull_request';

    event.body.action = 'opened';
    event.body.pull_request.body = '@GITHUB_USER_ID_1 abc';
    event.body = JSON.stringify(event.body);
    expect(getMessageObject(event)).toStrictEqual({
      title:
        '<@SLACK_USER_ID_1> Pullrequest Opened [<https://github.com/hoge/fuga/pull/1|test pull_request title>]',
      body: '@GITHUB_USER_ID_1 abc'
    });
  });

  test('other event', () => {
    event.headers['X-GitHub-Event'] = 'hoge';

    event.body = JSON.stringify(event.body);
    expect(getMessageObject(event)).toStrictEqual({
      title: null,
      body: null
    });
  });
});
