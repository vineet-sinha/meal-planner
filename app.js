const violet = require('violet').script({
  invocationName: 'meal planner'
});

const plannedMeals = require('./plannedMeals');

// the main controller
var app = {
  // utils
  makeDevEasier: (response)=>{
    if (response.get('mealDay') === 'today') response.set('mealDay', new Date());
    if (response.get('mealDay') === 'tomorrow') {
      var mDay = new Date();
      mDay.setDate(day.getDate()+1)
      response.set('mealDay', mDay);
    }
  },

  // create records
  planMeal: (response)=>{
    app.makeDevEasier(response);

    if (response.get('mealDay').indexOf('W') != -1) {
      // we do not support week's as days
      response.say(`Sorry. Can you please provide a day?`)
      return;
    }

    plannedMeals.write({
      user_id: response.get('userId'),
      meal_day: response.get('mealDay'),
      meal_name: response.get('mealName'),
      meal_type: response.get('mealType')
    });
    response.say(`Great.`);
  },

  // query records
  anyMealsPlannedTonight: async function(response) {
    var results = await plannedMeals.checkDay({
      userId: response.get('userId'),
      mealDay: new Date().toISOString(),
    });
    if (results.length > 0) {
      // check mealType
      for (let mp of results) {
        if (mp.meal_type==='dinner') {
          response.set('mealName', mp.meal_name);
          return 'planned';
        }
        return 'plannedOnlyOtherMeals';
      }
    }
    results = await plannedMeals.checkWeek({
      user_id: response.get('userId'),
      meal_day: new Date().toISOString(),
    });
    if (results.length > 0) {
      return 'plannedOnlyLaterInTheWeek';
    }
    return 'nonePlanned';
  },

  anyMealsPlannedGeneric: async function(response) {
    app.makeDevEasier(response);
    var results = await plannedMeals.checkDay({
      user_id: response.get('userId'),
      meal_day: response.get('mealDay'),
    });
    if (results.length > 0) {
      // check mealType
      var availMealType = null;
      for (let mp of results) {
        if (mp.meal_type===response.get('mealType')) {
          response.set('mealName', mp.meal_name);
          return 'planned';
        }
        availMealType = mp.meal_type;
      }
      // because we have one result - we will def have a value in availMealType
      response.set('availMealType', availMealType);
      return 'plannedButDifferentMeal';
    }
    results = await plannedMeals.checkWeek({
      user_id: response.get('userId'),
      meal_day: response.get('mealDay'),
    });
    if (results.length > 0) {
      response.set('availMealDay', app._dateToRelDay(results[0].meal_date_ex));
      return 'plannedButOtherTimeInWeek';
    }
    return 'nonePlannedThisWeek';
  },

  _dateToRelDay: function(mealDateEx) {
    var dayStr = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var monthStr = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var today = new Date();
    mealDateEx = new Date(mealDateEx.substring(0, 'YYYY-MM-DD'.length));
    var dateDiff = mealDateEx.getDate()-today.getDate();
    switch (dateDiff) {
      case 0: return 'today';
      case -1: return 'yesterday';
      case -2: return 'day before yesterday';
      case 1: return 'tomorrow';
      case 2: return 'day after tomorrow';
    }
    if (dateDiff<0 && dateDiff>-7) {
      return `last ${dayStr[mealDateEx.getDay()]}`;
    }
    if (dateDiff>0 && dateDiff<7) {
      return `coming ${dayStr[mealDateEx.getDay()]}`;
    }
    return ` ${mealDateEx.getDate()} ${monthStr[mealDateEx.getMonth()]}`;
  },

  anyMealsPlannedOpenEnded: async function(response) {
    var results = await plannedMeals.checkWeek({
      user_id: response.get('userId'),
      meal_day: new Date().toISOString(),
    });
    if (results.length == 0) return 'nonePlannedThisWeek'

    // results are sorted by date and type (breakfast comes first)
    var mp = results[0];
    response.set('mealName', mp.meal_name);
    response.set('mealType', mp.meal_type);
    response.set('mealDay', app._dateToRelDay(mp.meal_date_ex));
    return 'planned';
  },

  // update records
  updateDate: async function(response) {
    await plannedMeals.updateKey({
      user_id: response.get('userId'),
      meal_day: response.get('mealDay'),
      meal_type: response.get('mealType'),
      meal_name: response.get('mealName'),
    }, {meal_day: response.get('newMealDay')});
    response.set('mealDay', response.get('newMealDay'));
  },
  updateMealType: async function(response) {
    await plannedMeals.update({
      user_id: response.get('userId'),
      meal_day: response.get('mealDay'),
      meal_type: response.get('mealType'),
      meal_name: response.get('mealName'),
    }, {meal_type: response.get('newMealType')});
    response.set('mealType', response.get('newMealType'));
  }
};


violet.addInputTypes({
  mealName: "phrase",
  mealType: {
    type: "mealTypeName",
    values: ["breakfast", "lunch", "dinner"]
  },
  newMealType: "mealTypeName",
  mealDay: "date",
  newMealDay: "date",
  // mealDay: {
  //   type: "mealDayName",
  //   values: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
  // },
});

// the script
violet.loadFlowScript('script.cfl', {app});
