////////////////////////////////////////
// building out the conroller
////////////////////////////////////////


// the main controller
class AppController {
  constructor(plannedMeals) {
    this.plannedMeals = plannedMeals
  }

  // utils
  makeDevEasier(response) {
    var dayProps = ['mealDay', 'newMealDay'];
    dayProps.forEach(d=>{
      if (response.get(d) === 'today') response.set(d, new Date());
      if (response.get(d) === 'tomorrow') {
        var mDay = new Date();
        mDay.setDate(day.getDate()+1)
        response.set(d, mDay);
      }
    });
  }

  // create records
  async planMeal(response) {
    this.makeDevEasier(response);

    if (response.get('mealDay').indexOf('W') != -1) {
      // we do not support week's as days
      response.say(`Sorry. Can you please provide a day?`)
      return false;
    }

    var writtenMP = await this.plannedMeals.write({
      user_id: response.get('userId'),
      meal_day: response.get('mealDay'),
      meal_name: response.get('mealName'),
      meal_type: response.get('mealType')
    });
    response.set('mealDayPretty', this._dateToRelDay(writtenMP.meal_date_ex));
  }

  // query records
  async anyMealsPlannedTonight(response) {
    var results = await this.plannedMeals.checkDay({
      user_id: response.get('userId'),
      meal_day: new Date().toISOString(),
    });
    if (results.length > 0) {
      // check mealType
      for (let mp of results) {
        if (mp.meal_type==='dinner') {
          response.set('mealName', mp.meal_name);
          return 'planned';
        }
      }
      return 'plannedOnlyOtherMeals';
    }
    results = await this.plannedMeals.checkWeek({
      user_id: response.get('userId'),
      meal_day: new Date().toISOString(),
    });
    if (results.length > 0) {
      return 'plannedOnlyLaterInTheWeek';
    }
    return 'nonePlanned';
  }

  async anyMealsPlannedGeneric(response) {
    this.makeDevEasier(response);
    var mealDay = response.get('mealDay');
    if (!mealDay) mealDay = new Date().toISOString(); // no day means today
    var results = await this.plannedMeals.checkDay({
      user_id: response.get('userId'),
      meal_day: mealDay,
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
    results = await this.plannedMeals.checkWeek({
      user_id: response.get('userId'),
      meal_day: response.get('mealDay'),
    });
    if (results.length > 0) {
      response.set('availMealDayPretty', this._dateToRelDay(results[0].meal_date_ex, 'on'));
      return 'plannedButOtherTimeInWeek';
    }
    return 'nonePlannedThisWeek';
  }

  _dateToRelDay(mealDateEx) {
    var dayStr = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var monthStr = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var today = new Date();
    mealDateEx = new Date(mealDateEx.substring(0, 'YYYY-MM-DD'.length));
    var dateDiff = mealDateEx.getUTCDate()-today.getUTCDate();
    switch (dateDiff) {
      case 0: return 'today';
      case -1: return 'yesterday';
      case -2: return 'day before yesterday';
      case 1: return 'tomorrow';
      case 2: return 'day after tomorrow';
    }
    if (dateDiff<0 && dateDiff>-7) {
      return `on the last ${dayStr[mealDateEx.getUTCDay()]}`;
    }
    if (dateDiff>0 && dateDiff<7) {
      return `on ${dayStr[mealDateEx.getUTCDay()]}`;
      // return `on the coming ${dayStr[mealDateEx.getUTCDay()]}`;
    }
    return ` on the <say-as interpret-as="ordinal">${mealDateEx.getUTCDate()}</say-as> ${monthStr[mealDateEx.getUTCMonth()]}`;
  }

  async anyMealsPlannedOpenEnded(response) {
    var results = await this.plannedMeals.checkWeek({
      user_id: response.get('userId'),
      meal_day: new Date().toISOString(),
    });
    if (!results) return 'err';
    if (results.length == 0) return 'nonePlannedThisWeek'

    // results are sorted by date and type (breakfast comes first)
    var mp = results[0];
    response.set('mealName', mp.meal_name);
    response.set('mealType', mp.meal_type);
    response.set('mealDay', mp.meal_date_ex);
    response.set('mealDayPretty', this._dateToRelDay(mp.meal_date_ex));
    return 'planned';
  }

  // update records
  async updateDate(response) {
    await this.plannedMeals.update({
      user_id: response.get('userId'),
      meal_day: response.get('mealDay'),
      meal_type: response.get('mealType'),
      meal_name: response.get('mealName'),
    }, {meal_day: response.get('newMealDay')});
    response.set('mealDay', response.get('newMealDay'));
  }
  async updateMealType(response) {
    await this.plannedMeals.update({
      user_id: response.get('userId'),
      meal_day: response.get('mealDay'),
      meal_type: response.get('mealType'),
      meal_name: response.get('mealName'),
    }, {meal_type: response.get('newMealType')});
    response.set('mealType', response.get('newMealType'));
  }
};

module.exports = AppController;
