const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/combinedSearch', async (req, res) => {
  try {
    const apiKey = 'My-API-Key';

    let { query, recipeType, cuisine, diet, maxPreparationTime, sort, intolerances, instructionsRequired } = req.body;

    // Validate query parameter
    if (!query || /^\W+$/.test(query)) {
      return res.status(400).send('Invalid query');
    }

    // Remove trailing numbers, periods, and commas from the query
    query = query.replace(/[0-9.,]+$/, '');

    const params = {
      apiKey,
      query,
      type: recipeType,
      diet,
      maxReadyTime: maxPreparationTime,
      sort,
      intolerances,
      instructionsRequired,
    };

    const apiUrl = 'https://api.spoonacular.com/recipes/complexSearch';

    const response = await axios.get(apiUrl, { params });
    const recipes = response.data.results;

    const responseData = [];

    for (const recipe of recipes) {
      const recipeId = recipe.id;
      const recipeUrl = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${apiKey}`;

      const recipeResponse = await axios.get(recipeUrl);
      const recipeData = recipeResponse.data;
      const recipeDetails = {
        recipeName: recipeData.title,
        summary: recipeData.summary,
        preparationSteps: recipeData.instructions,
        ingredients: recipeData.extendedIngredients.map(ingredient => ingredient.original),
        diet: recipeData.attributes && recipeData.attributes.diet,
        maxPreparationTime: recipeData.readyInMinutes,
        servings: recipeData.servings,
        imageUrl: recipeData.image,
        dishTypes: recipeData.dishTypes,
      };

      responseData.push(recipeDetails);
    }

    // Generate HTML markup
    let html = '<html><body><ul>';

    for (const recipe of responseData) {
      html += `
        <li>
          <h2><strong>${recipe.recipeName}</strong></h2>
          <ul>
            <li><strong>Summary:</strong> ${recipe.summary}</li>
            <li><strong>Preparation Steps:</strong> ${recipe.preparationSteps}</li>
            <li><strong>Ingredients:</strong> ${recipe.ingredients.join(', ')}</li>
            <li><strong>Max Preparation Time:</strong> ${recipe.maxPreparationTime} minutes</li>
            <li><strong>Servings:</strong> ${recipe.servings}</li>
            <img src="${recipe.imageUrl}" alt="Recipe Image">
            <li><strong>Dish Types:</strong> ${JSON.stringify(recipe.dishTypes)}</li>
          </ul>
        </li>`;
    }

    html += '</ul></body></html>';

    res.send(html);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
});

app.listen(process.env.PORT || port, () => {
  console.log(`Server is listening on port ${port}`);
});