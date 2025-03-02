import React from 'react';

const RecipeDisplay = ({ recipe }) => {
  if (!recipe) return null;

  return (
    <div className="recipe-display">
      <div className="recipe-content">
        <pre>{recipe}</pre>
      </div>
    </div>
  );
};

export default RecipeDisplay;