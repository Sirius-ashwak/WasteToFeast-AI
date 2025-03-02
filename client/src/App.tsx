import React, { useState, useCallback } from 'react';
import { Search, ChefHat, Utensils, Clock, Users, Leaf, PlusCircle, 
         Trash2, RefreshCw, Camera, X, Image as ImageIcon, 
         BarChart, DollarSign, Recycle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Recipe, Ingredient } from './types/Recipe';

function App() {
  const [activeTab, setActiveTab] = useState('generate');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setSelectedImage(URL.createObjectURL(file));
    // Add image analysis logic here
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <ChefHat className="h-8 w-8 text-green-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Recipe AI</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('generate')}
              className={`${
                activeTab === 'generate'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Generate Recipe
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`${
                activeTab === 'saved'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Saved Recipes
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Add Ingredients</h2>
              <div className="space-y-4">
                {/* Ingredient Input Form */}
                <form className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter ingredient"
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Add
                  </button>
                </form>

                {/* Ingredients List */}
                <div className="space-y-2">
                  {ingredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <span className="text-gray-700">{ingredient.name}</span>
                      <button
                        onClick={() => {
                          const newIngredients = [...ingredients];
                          newIngredients.splice(index, 1);
                          setIngredients(newIngredients);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Generated Recipe</h2>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 text-green-600 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Recipe Content */}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;