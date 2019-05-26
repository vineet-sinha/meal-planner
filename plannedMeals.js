////////////////////////////////////////
// building out the model / data access
////////////////////////////////////////
const AWS = require('aws-sdk');
const uuidv1 = require('uuid/v1'); // timestamp based uuid

AWS.config.update({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000'
});

// var dynamodb = new AWS.DynamoDB();

var plannedMeals = {
  write: async function({user_id, meal_day, meal_name, meal_type}) {
    meal_day = meal_day.substring(0, 'YYYY-MM-DD'.length);

    var typeCode = 0;
    switch (meal_type) {
      case 'breakfast': typeCode = 0; break;
      case 'lunch': typeCode = 1; break;
      case 'dinner': typeCode = 2; break;
    }

    try {
      var docClient = new AWS.DynamoDB.DocumentClient();
      var saveParams = {
        TableName: 'PlannedMealsCollection',
        Item: {
          user_id: user_id,
          meal_date_ex: meal_day + '----' + typeCode + '----' + uuidv1(),
          meal_name: meal_name,
          meal_type: meal_type
      }};
      // console.log('Trying to write: ', JSON.stringify(saveParams, null, 2));
      var data = await docClient.put(saveParams).promise();
      // console.log('Added item:', JSON.stringify(data, null, 2));

    } catch (err) {
      console.error('Unable to add item. Error JSON:', JSON.stringify(err, null, 2));
    }
  },

  query: async function({user_id, meal_day_beg, meal_day_end, meal_name, meal_type}) {
    meal_day_beg = meal_day_beg.substring(0, 'YYYY-MM-DD'.length);
    meal_day_end = meal_day_end.substring(0, 'YYYY-MM-DD'.length);

    try {
      var docClient = new AWS.DynamoDB.DocumentClient();
      var queryParams = {
        TableName: 'PlannedMealsCollection',
        KeyConditionExpression: 'user_id = :user_id and meal_date_ex between :meal_day_beg and :meal_day_end',
        ExpressionAttributeValues: {
          ':user_id': user_id,
          ':meal_day_beg': meal_day_beg,
          ':meal_day_end': meal_day_end,
        },
        Limit: 25
      };
      console.log('Trying to query: ', JSON.stringify(queryParams, null, 2));
      var data = await docClient.query(queryParams).promise();
      console.log('Queried item:', JSON.stringify(data, null, 2));
      // return data.Items;
      return data.Items.filter(item=>{
        // these two are already done in the query
        // if (user_id && item.user_id !== user_id) return false;
        // if (meal_day && item.meal_date_ex.substring(0, meal_day.length) !== meal_day) return false;
        if (meal_name && item.meal_name !== meal_name) return false;
        if (meal_type && item.meal_type !== meal_type) return false;
        return true;
      });

    } catch (err) {
      console.error('Unable to query items. Error JSON:', JSON.stringify(err, null, 2));
    }
  },

  // this is what everyone will want to use instead of query - since we don't want to expose the actual meal_date_ex
  // meal_name & meal_type - are optional
  checkDay: async function({user_id, meal_day, meal_name, meal_type}) {
    meal_day = meal_day.substring(0, 'YYYY-MM-DD'.length);

    var nextDay = new Date(meal_day);
    nextDay.setDate(nextDay.getDate()+1);
    nextDay = nextDay.toISOString();
    nextDay = nextDay.substring(0, 'YYYY-MM-DD'.length);

    return await plannedMeals.query({user_id, meal_day_beg:meal_day, meal_day_end:nextDay, meal_name, meal_type});
  },

  // meal_name & meal_type - are optional
  checkWeek: async function({user_id, meal_day, meal_name, meal_type}) {
    meal_day = meal_day.substring(0, 'YYYY-MM-DD'.length);

    var nextWeek = new Date(meal_day);
    nextWeek.setDate(nextWeek.getDate()+7);
    nextWeek = nextWeek.toISOString();
    nextWeek = nextWeek.substring(0, 'YYYY-MM-DD'.length);

    return await plannedMeals.query({user_id, meal_day_beg:meal_day, meal_day_end:nextWeek, meal_name, meal_type});
  },

  update: async function({user_id, meal_day, meal_name, meal_type}, newRecVals) {
    // because we dont actually have meal_date_ex and we need it to do an update - we will need to first do a query with a range
    var results = await checkDay({user_id, meal_day, meal_type, meal_name});
    var record = results[0];
    if (results.length>0) {
      // there was more than one entry with the same meal_name and meal_type
      console.log('WARNING: There were multiple items with: ', {user_id, meal_day, meal_name, meal_type});
      console.log('WARNING: Changing to: ', newRecVals);
    }

    try {
      var docClient = new AWS.DynamoDB.DocumentClient();
      var updateParams = {
        TableName: 'PlannedMealsCollection',
        Key: {
          'user_id': record.user_id,
          'meal_date_ex': record.meal_date_ex
        },
        UpdateExpression: 'set',
        ExpressionAttributeValues: {},
        ReturnValues:"UPDATED_NEW"
      };
      Object.keys(newRecVals).forEach(k=>{
        if (updateParams.UpdateExpression.length!=3) updateParams.UpdateExpression+=',';
        updateParams.UpdateExpression += ` ${k}=:${k}`;
        updateParams.ExpressionAttributeValues[`:${k}`] = newRecVals[k];
      });
      console.log('Trying to do an update: ', JSON.stringify(updateParams, null, 2));
      var data = await docClient.update(queryParams).promise();
      console.log('Updated item:', JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Unable to query items. Error JSON:', JSON.stringify(err, null, 2));
    }

  },

  // dynamodb does not allow changing the value of keys!
  updateKey: async function({user_id, meal_day, meal_name, meal_type}, newRecVals) {
    // because we dont actually have meal_date_ex and we need it to do an update - we will need to first do a query with a range
    var results = await checkDay({user_id, meal_day, meal_type, meal_name});
    var record = results[0];
    if (results.length>0) {
      // there was more than one entry with the same meal_name and meal_type
      console.log('WARNING: There were multiple items with: ', {user_id, meal_day, meal_name, meal_type});
      console.log('WARNING: Deleting and replacing with to: ', newRecVals);
    }

    try {
      var docClient = new AWS.DynamoDB.DocumentClient();
      // delete
      var deleteParams = {
        TableName: 'PlannedMealsCollection',
        Key: {
          'user_id': record.user_id,
          'meal_date_ex': record.meal_date_ex
        }
      };
      console.log('Trying to delete: ', JSON.stringify(deleteParams, null, 2));
      var data = await docClient.delete(queryParams).promise();
      console.log('Deleted item:', JSON.stringify(data, null, 2));

      // create
      var newRec = {user_id, meal_day, meal_name, meal_type};
      Object.keys(newRecVals).forEach(k=>{ // we are really doing an Object.assign here
        newRec[k] = newRecVals[k];
      });
      await plannedMeals.write(newRec);
    } catch (err) {
      console.error('Unable to query items. Error JSON:', JSON.stringify(err, null, 2));
    }


  }

};

module.exports = plannedMeals;
