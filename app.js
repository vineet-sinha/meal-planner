const violet = require('violet').script({
  invocationName: 'meal planner'
});


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
    if (Object.keys(model).length)
      response.say(`Sorry, I only have planned for ${plannedDay}`);
    response.say(`I am not sure.`);
  }
};

// the script
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

violet.addInputTypes({
  mealName: "phrase",
  mealType: {
    type: "mealTypeName",
    values: ["breakfast", "lunch", "dinner"]
  },
  mealDay: {
    type: "mealDayName",
    values: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
  },
});

violet.loadFlowScript('script.cfl', {app});
