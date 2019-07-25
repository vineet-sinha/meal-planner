// bst does not have common respnse primitives, so we need to align
module.exports = {
  onRequest: (test, request) => {
    // console.log('request: ', request);

  },
  onResponse: (test, response) => {
    // console.log('response: ', response);
    if ('contextOut' in response) {
      response.contextOut.forEach(ctx=>{
        if (ctx.name != 'session') return;
        response.sessionAttributes = ctx.parameters;
      });
    }
    console.log('sessionAttributes: ', response.sessionAttributes)
  }
}
