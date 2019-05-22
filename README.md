
# Meal Planner

This project implements a Voice App to help plan meals. The Voice Conversation is built using the [Violet](https://helloviolet.ai/) framework and is deployed using the [Serverless Framework](https://serverless.com/). The primary instance of this runs on [AWS Lambda](https://aws.amazon.com/lambda/) and [AWS DynamDB](https://aws.amazon.com/dynamodb/).

### Running

Running the code locally requires first installing Node.js and running:
```
npm install
npm start
```

The above commands will first download dependencies and then start the voice app locally along with the development tooling allowing you to run it in a browser.

### Deploying

While this project runs the development tooling by default, before deploying the project, it is helpful to run the code using the function-as-a-service infrastructure that comes with he Serverless framework. You can do this by running:
```
serverless offline
```

If you want to run the development tooling against this version of the code, you can do so by running:
```
node node_modules/violet/lib/violetToolSrvr.js
```

Deploying the code can be done by:
```
serverless deploy
```
