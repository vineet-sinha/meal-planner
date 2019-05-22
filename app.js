const violet = require('violet').script({
  invocationName: 'meal planner'
});

/*
model:
 * plan meals for the week
    - day (mon, ...)
    - type of meal (breakfast, lunch, dinner)
    - meal/dish name
    - cuisine (optional)
    - ingredients (optional)
  - track of grocery items
  - track favorites
action:
  - query/find items
  - create/add to the meal planner
  - modify
 */

// the model
var model = {};

// the controller
var app = {
  planMeal: (response)=>{
    model[response.get('mealDay')] = {
      mealName: response.get('mealName'),
      mealType: response.get('mealType')
    };
    response.say(`Great.`);
  },
  checkDinnerTonight: (response)=>{
    if (Object.keys(model).length == 0)
      response.say(`Sorry, I do not have anything planned yet`);
    if (!model['today'])
      response.say(`Sorry, I do not have anything planned for tonight`);
    if (Object.keys(model).length) {
      var plannedDay = 'someday'
      response.say(`Sorry, I only have planned for ${plannedDay}`);
    }
    response.say(`I am not sure.`);
  }
};


violet.addInputTypes({
  mealName: "phrase",
  mealType: {
    type: "mealTypeName",
    values: ["breakfast", "lunch", "dinner"]
  },
  // mealDay: "date",
  mealDay: {
    type: "mealDayName",
    values: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
  },
});

// the script
violet.loadFlowScript('script.cfl', {app});
