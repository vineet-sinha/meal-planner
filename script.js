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
// the script (cfl)
violet.addFlowScript(`<app>

  <choice id="launch">
    <expecting>What can you do</expecting>
    <say>I can help you track your meal planning.</say>
  </choice>

  <choice id="queryDinnerTonight">
    <expecting>What are we making today for dinner</expecting>
    <resolve value="app.checkDinnerTonight(response)"/>
  </choice>

  <dialog elicit="dialog.nextReqdParam()">
    <expecting>Lets plan a meal</expecting>
    <expecting>Lets plan a [[mealType]]</expecting>
    <expecting>Lets plan a meal for [[mealDay]]</expecting>
    <expecting>Lets plan a meal to have [[mealName]] for [[mealType]] on [[mealDay]]</expecting>

    <item name="mealDay" required>
      <ask>What day would you like to make it</ask>
      <expecting>I would like to make it on [[mealDay]]</expecting>
      <expecting>Make it on [[mealDay]]</expecting>
    </item>
    <item name="mealType" required>
      <ask>Would it be breakfast, lunch, or dinner</ask>
      <expecting>It would be [[mealType]]</expecting>
    </item>
    <item name="mealName" required>
      <ask>What would you like the meal to be called</ask>
      <expecting>I would like to call it [[mealName]]</expecting>
    </item>
    <resolve value="app.planMeal(response)"/>
  </dialog>

</app>`, {app});
