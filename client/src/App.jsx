import React, { useState } from 'react';
import RecipeDisplay from './components/RecipeDisplay';

function App() {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/recipeStream', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add your form data here
      });

      const data = await response.json();
      setRecipe(data.recipe);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="form-container">
        {/* Your existing form code */}
      </div>
      <div className="recipe-container">
        {loading ? (
          <div>Generating recipe...</div>
        ) : (
          <RecipeDisplay recipe={recipe} />
        )}
      </div>
    </div>
  );
}

export default App;