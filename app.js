const violet = require('violet').script({
  invocationName: 'meal planner'
});

const plannedMeals = require('./plannedMeals');
const AppController = require('./appController');
var appController = new AppController(plannedMeals);

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
violet.loadFlowScript('script.cfl', {app: appController});
