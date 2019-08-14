////////////////////////////////////////
// building out the model
////////////////////////////////////////

const DynDB = require('./lib/dynDB');
const dynDB = new DynDB({
  collection: 'PlannedMealsCollection',
  keys: ['user_id', 'meal_date_ex'],
  query: {
    keyConditionEx: {
      'meal_date_ex': ['between', ':meal_day_beg', 'and', ':meal_day_end']
    },
    defaultLimit: 25
  }
});

const uuidv1 = require('uuid/v1'); // timestamp based uuid

const plannedMeals = {
  write: async function(mealPlan /*{user_id, meal_day, meal_name, meal_type}*/) {
    mealPlan.meal_day = mealPlan.meal_day.substring(0, 'YYYY-MM-DD'.length);

    var typeCode = 0;
    switch (mealPlan.meal_type) {
      case 'breakfast': typeCode = 0; break;
      case 'lunch': typeCode = 1; break;
      case 'dinner': typeCode = 2; break;
    }
    mealPlan.meal_date_ex = mealPlan.meal_day + '----' + typeCode + '----' + uuidv1();
    delete mealPlan.meal_day; // we don't save it - can be retrieved from meal_date_ex

    await dynDB.insert(mealPlan);

    return mealPlan;
  },

  query: async function(mealPlan /*{user_id, meal_day_beg, meal_day_end, meal_name, meal_type}*/) {
    mealPlan.meal_day_beg = mealPlan.meal_day_beg.substring(0, 'YYYY-MM-DD'.length);
    mealPlan.meal_day_end = mealPlan.meal_day_end.substring(0, 'YYYY-MM-DD'.length);

    return await dynDB.query(mealPlan);
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

  // NOTE: not really called - since we are always in the changing keys during update for this app
  _rawUpdate: async function({user_id, meal_day, meal_name, meal_type}, newRecVals) {
    // because we dont actually have meal_date_ex and we need it to do an update - we will need to first do a query with a range
    var results = await this.checkDay({user_id, meal_day, meal_type, meal_name});
    var record = results[0];
    if (results.length>0) {
      // there was more than one entry with the same meal_name and meal_type
      console.log('WARNING: There were multiple items with: ', {user_id, meal_day, meal_name, meal_type});
      console.log('WARNING: Changing to: ', newRecVals);
    }

    await dynDB.update(record, newRecVals);
  },

  update: async function({user_id, meal_day, meal_name, meal_type}, newRecVals) {
    // note: when not changing keys we can just short circuit to _rawUpdate above
    // dynamodb does not allow changing the value of keys - so we need to delete and then create
    // because we dont actually have meal_date_ex and we need it to do an update - we will need to first do a query with a range
    var results = await this.checkDay({user_id, meal_day, meal_type, meal_name});

    if (results.length>1) {
      // there was more than one entry with the same meal_name and meal_type
      console.log('WARNING: There were multiple items with: ', {user_id, meal_day, meal_name, meal_type});
      console.log('WARNING: Deleting and replacing with to: ', newRecVals);
    }

    if (results.length>0) await dynDB.delete(results[0]);

    // create
    var newRec = {user_id, meal_day, meal_name, meal_type};
    Object.keys(newRecVals).forEach(k=>{ // we are really doing an Object.assign here
      newRec[k] = newRecVals[k];
    });
    await plannedMeals.write(newRec);
  },

  remove: async function({user_id, meal_day, meal_name, meal_type}) {
    var results = await this.checkDay({user_id, meal_day, meal_type, meal_name});

    if (results.length>1) {
      // there was more than one entry with the same meal_name and meal_type
      console.log('WARNING: There were multiple items with: ', {user_id, meal_day, meal_name, meal_type});
    }

    if (results.length>0) await dynDB.delete(results[0]);
  }

};

module.exports = plannedMeals;
