////////////////////////////////////////
// wrapper for dynamo db, goal is to allow:
// - increased configuration while setup
// - ease of use of api's (given configuration above)
// - allow core model code to not be minimally dependent on db api's
////////////////////////////////////////
const AWS = require('aws-sdk');

AWS.config.update({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000'
});

// var dynamodb = new AWS.DynamoDB();

class DynDB {
  constructor(cfg) {
    this.cfg = cfg;
    this.docClient = new AWS.DynamoDB.DocumentClient();
  }

  // adds an item to the collection
  async insert(item) {
    var createParams = {
      TableName: this.cfg.collection,
      Item: item
    };

    try {
      console.log('Trying to write: ', JSON.stringify(createParams, null, 2));
      var data = await this.docClient.put(createParams).promise();
      console.log('Added item:', JSON.stringify(data, null, 2));
      return data;

    } catch (err) {
      console.error('Unable to insert item. Error:', err);
    }
  }

  // adds an item to the collection
  async query(item) {
    // console.log(`===> in dynDB.query: `, item)
    var attrToFilter = Object.keys(item);
    var _removeAttrToFilter = (attr)=>{
      var ndx = attrToFilter.indexOf(attr);
      if (ndx > -1) attrToFilter.splice(ndx, 1);
    }

    var queryParams = {
      TableName: this.cfg.collection,
      ExpressionAttributeValues: {}
    };
    if (this.cfg.query && this.cfg.query.defaultLimit) queryParams.Limit = this.cfg.query.defaultLimit;
    this.cfg.keys.forEach(k=>{
      if (queryParams.KeyConditionExpression)
        queryParams.KeyConditionExpression += ' and '
      else
        queryParams.KeyConditionExpression = ''
      if (this.cfg.query && this.cfg.query.keyConditionEx && this.cfg.query.keyConditionEx[k]) {
        queryParams.KeyConditionExpression += `${k} ${this.cfg.query.keyConditionEx[k].join(' ')}`;
        this.cfg.query.keyConditionEx[k].filter(x=>x.startsWith(':')).forEach(x=>{
          x = x.substring(1); // remove the starting ':' (so that we can access variables)
          queryParams.ExpressionAttributeValues[`:${x}`] = item[x];
          // console.log(`===> added to queryParams ... ${x} -> ${item[x]}`)
          _removeAttrToFilter(x);
        });
      } else {
        queryParams.KeyConditionExpression += `${k} = :${k}`;
        queryParams.ExpressionAttributeValues[`:${k}`] = item[k];
        // console.log(`===> added to queryParams ... ${k} -> ${item[k]}`)
        _removeAttrToFilter(k);
      }
    });

    try {
      console.log('Trying to query: ', JSON.stringify(queryParams, null, 2));
      var data = await this.docClient.query(queryParams).promise();
      console.log('Queried item:', JSON.stringify(data, null, 2));
      return data.Items.filter(queryItem=>{
        for (let a of attrToFilter) {
          if (item[a] && queryItem[a] !== item[a]) return false;
        }
        return true;
      });

    } catch (err) {
      console.error('Unable to query items. Error:', err);
    }
  }

  async update(record, newRecVals) {
    try {
      var updateParams = {
        TableName: this.cfg.collection,
        Key: {},
        UpdateExpression: 'set',
        ExpressionAttributeValues: {},
        ReturnValues: "UPDATED_NEW"
      };
      this.cfg.keys.forEach(k=>{
        updateParams.Key[k] = record[k];
      });
      Object.keys(newRecVals).forEach(k=>{
        if (updateParams.UpdateExpression.length!=3) updateParams.UpdateExpression+=',';
        updateParams.UpdateExpression += ` ${k}=:${k}`;
        updateParams.ExpressionAttributeValues[`:${k}`] = newRecVals[k];
      });
      console.log('Trying to do an update: ', JSON.stringify(updateParams, null, 2));
      var data = await this.docClient.update(updateParams).promise();
      console.log('Updated item:', JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Unable to update items. Error:', err);
    }

  }

  async delete(record) {
    try {
      var deleteParams = {
        TableName: 'PlannedMealsCollection',
        Key: {}
      };
      this.cfg.keys.forEach(k=>{
        deleteParams.Key[k] = record[k];
      });
      console.log('Trying to delete: ', JSON.stringify(deleteParams, null, 2));
      var data = await this.docClient.delete(deleteParams).promise();
      console.log('Deleted item:', JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Unable to delete item. Error:', err);
    }

  }

};

module.exports = DynDB;
