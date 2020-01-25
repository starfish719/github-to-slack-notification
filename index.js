const { getMessageObject, post } = require('./common');

exports.handler = async event => {
  const msgObj = getMessageObject(event);

  if (!msgObj.title && !msgObj.body) {
    return {
      statusCode: 200,
      body: 'No message'
    };
  }

  await Promise.all([post(msgObj)]);

  return {
    statusCode: 200,
    body: JSON.stringify('Finish')
  };
};
