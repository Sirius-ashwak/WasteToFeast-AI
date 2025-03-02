import React, { useState, useCallback } from 'react';
import { Search, ChefHat, Utensils, Clock, Users, Leaf, PlusCircle, Trash2, RefreshCw, Camera, X, Image as ImageIcon, BarChart, DollarSign, Recycle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface Recipe {
  id: number;
  title: string;
  ingredients: string[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  imageUrl: string;
  tags: string[];
  difficulty?: string;
  sustainability?: number;
  costSaving?: number;
}

interface Ingredient {
  name: string;
  freshness: 'fresh' | 'use soon' | 'expired';
  expiryDate?: string;
  quantity?: string;
}

// Mock data for demonstration
const mockRecipes: Recipe[] = [
  {
    id: 1,
    title: "Vegetable Stir Fry",
    ingredients: ["2 carrots, sliced", "1 bell pepper, diced", "1 onion, sliced", "2 cloves garlic, minced", "2 tbsp soy sauce", "1 tbsp olive oil"],
    instructions: [
      "Heat oil in a large pan over medium-high heat.",
      "Add onions and garlic, sauté until fragrant.",
      "Add carrots and bell peppers, stir fry for 5 minutes.",
      "Add soy sauce and continue cooking for 2 minutes.",
      "Serve hot over rice or noodles."
    ],
    prepTime: 10,
    cookTime: 15,
    servings: 2,
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    tags: ["vegetarian", "quick", "healthy"],
    difficulty: "easy",
    sustainability: 85,
    costSaving: 3.50
  },
  {
    id: 2,
    title: "Banana Pancakes",
    ingredients: ["2 ripe bananas, mashed", "2 eggs", "1/2 cup flour", "1/4 tsp cinnamon", "1 tbsp butter"],
    instructions: [
      "Mash bananas in a bowl.",
      "Whisk in eggs, then add flour and cinnamon.",
      "Heat butter in a pan over medium heat.",
      "Pour small amounts of batter to form pancakes.",
      "Cook until bubbles form, then flip and cook other side.",
      "Serve with maple syrup or honey."
    ],
    prepTime: 5,
    cookTime: 10,
    servings: 2,
    imageUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    tags: ["breakfast", "sweet", "quick"],
    difficulty: "easy",
    sustainability: 90,
    costSaving: 2.75
  },
  {
    id: 3,
    title: "Pasta with Tomato Sauce",
    ingredients: ["200g pasta", "1 can diced tomatoes", "1 onion, diced", "2 cloves garlic, minced", "1 tbsp olive oil", "1 tsp dried basil", "Salt and pepper to taste"],
    instructions: [
      "Cook pasta according to package instructions.",
      "In a separate pan, heat oil and sauté onions and garlic.",
      "Add diced tomatoes, basil, salt, and pepper.",
      "Simmer for 10 minutes.",
      "Drain pasta and mix with sauce.",
      "Serve hot with grated cheese if desired."
    ],
    prepTime: 5,
    cookTime: 20,
    servings: 3,
    imageUrl: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    tags: ["pasta", "dinner", "italian"],
    difficulty: "medium",
    sustainability: 75,
    costSaving: 4.20
  }
];

function App() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>(mockRecipes);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [userProfile, setUserProfile] = useState({
    dietaryPreferences: ['vegetarian'],
    allergies: [],
    favoriteCuisines: ['italian', 'asian']
  });
  const [impactStats, setImpactStats] = useState({
    wasteReduced: 3.2, // kg
    moneySaved: 42.50, // dollars
    co2Prevented: 6.8 // kg
  });
  const [showFreshnessModal, setShowFreshnessModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  const handleAddIngredient = () => {
    if (currentIngredient.trim() !== '' && !ingredients.some(ing => ing.name === currentIngredient.trim())) {
      const newIngredient: Ingredient = {
        name: currentIngredient.trim(),
        freshness: 'fresh',
        expiryDate: getRandomExpiryDate()
      };
      setIngredients([...ingredients, newIngredient]);
      setCurrentIngredient('');
      filterRecipes([...ingredients, newIngredient], activeFilters);
    }
  };

  const getRandomExpiryDate = () => {
    const today = new Date();
    const daysToAdd = Math.floor(Math.random() * 10) - 2; // -2 to 7 days
    today.setDate(today.getDate() + daysToAdd);
    return today.toISOString().split('T')[0];
  };

  const getFreshnessFromDate = (dateStr?: string): 'fresh' | 'use soon' | 'expired' => {
    if (!dateStr) return 'fresh';
    
    const today = new Date();
    const expiryDate = new Date(dateStr);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'expired';
    if (diffDays <= 2) return 'use soon';
    return 'fresh';
  };

  const handleRemoveIngredient = (ingredientName: string) => {
    const newIngredients = ingredients.filter(item => item.name !== ingredientName);
    setIngredients(newIngredients);
    filterRecipes(newIngredients, activeFilters);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddIngredient();
    }
  };

  const filterRecipes = (ingredientsList: Ingredient[], tags: string[]) => {
    if (ingredientsList.length === 0 && tags.length === 0) {
      setFilteredRecipes(recipes);
      return;
    }

    const filtered = recipes.filter(recipe => {
      // Check if recipe contains at least one of the selected ingredients
      const hasIngredient = ingredientsList.length === 0 || ingredientsList.some(ing => 
        recipe.ingredients.some(recipeIng => 
          recipeIng.toLowerCase().includes(ing.name.toLowerCase())
        )
      );

      // Check if recipe has all selected tags
      const hasTags = tags.length === 0 || tags.every(tag => 
        recipe.tags.includes(tag)
      );

      return hasIngredient && hasTags;
    });

    setFilteredRecipes(filtered);
  };

  const toggleFilter = (tag: string) => {
    const newFilters = activeFilters.includes(tag)
      ? activeFilters.filter(t => t !== tag)
      : [...activeFilters, tag];
    
    setActiveFilters(newFilters);
    filterRecipes(ingredients, newFilters);
  };

  const generateRecipes = () => {
    setIsGenerating(true);
    
    // Simulate AI generation with a timeout
    setTimeout(() => {
      // In a real app, this would be an API call to an AI service
      const newRecipes: Recipe[] = [
        ...recipes,
        {
          id: recipes.length + 1,
          title: `${ingredients[0]?.name || 'Mixed'} and ${ingredients.length > 1 ? ingredients[1].name : 'Herbs'} Special`,
          ingredients: [...ingredients.map(ing => ing.name), "salt", "pepper", "olive oil"],
          instructions: [
            "Prepare all ingredients by washing and chopping as needed.",
            `Combine ${ingredients.map(ing => ing.name).join(', ')} in a bowl.`,
            "Season with salt and pepper to taste.",
            "Cook over medium heat for 15 minutes, stirring occasionally.",
            "Serve hot and enjoy your custom creation!"
          ],
          prepTime: 10,
          cookTime: 15,
          servings: 2,
          imageUrl: "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
          tags: ["custom", "quick"],
          difficulty: "medium",
          sustainability: 95,
          costSaving: 5.30
        }
      ];
      
      // Update impact stats
      setImpactStats(prev => ({
        wasteReduced: prev.wasteReduced + 0.8,
        moneySaved: prev.moneySaved + 5.30,
        co2Prevented: prev.co2Prevented + 1.2
      }));
      
      setRecipes(newRecipes);
      filterRecipes(ingredients, activeFilters);
      setIsGenerating(false);
    }, 2000);
  };

  const clearAll = () => {
    setIngredients([]);
    setActiveFilters([]);
    setFilteredRecipes(recipes);
    setPreviewImage(null);
  };

  // Image analysis functionality
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Simulate image analysis
      setIsAnalyzingImage(true);
      setTimeout(() => {
        // Mock AI image analysis - in a real app, this would be an API call to a computer vision service
        const detectedIngredients = simulateImageAnalysis(file.name);
        
        // Add detected ingredients
        const newIngredients = [...ingredients];
        detectedIngredients.forEach(ingredient => {
          if (!ingredients.some(ing => ing.name === ingredient.name)) {
            newIngredients.push(ingredient);
          }
        });
        
        setIngredients(newIngredients);
        filterRecipes(newIngredients, activeFilters);
        setIsAnalyzingImage(false);
        setShowImageModal(false);
      }, 2500);
    }
  }, [ingredients, activeFilters]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1
  });

  // Mock function to simulate image analysis
  const simulateImageAnalysis = (filename: string): Ingredient[] => {
    // In a real app, this would be replaced with actual AI image analysis
    const lowerFilename = filename.toLowerCase();
    
    if (lowerFilename.includes('tomato') || lowerFilename.includes('red')) {
      return [
        { name: 'tomato', freshness: 'fresh', expiryDate: getRandomExpiryDate() },
        { name: 'basil', freshness: 'use soon', expiryDate: getRandomExpiryDate() }
      ];
    } else if (lowerFilename.includes('banana') || lowerFilename.includes('fruit')) {
      return [
        { name: 'banana', freshness: 'use soon', expiryDate: getRandomExpiryDate() },
        { name: 'honey', freshness: 'fresh', expiryDate: getRandomExpiryDate() }
      ];
    } else if (lowerFilename.includes('vegetable') || lowerFilename.includes('veg')) {
      return [
        { name: 'carrot', freshness: 'fresh', expiryDate: getRandomExpiryDate() },
        { name: 'bell pepper', freshness: 'use soon', expiryDate: getRandomExpiryDate() },
        { name: 'onion', freshness: 'fresh', expiryDate: getRandomExpiryDate() }
      ];
    } else {
      // Default ingredients if no specific pattern is matched
      return [
        { name: 'onion', freshness: 'fresh', expiryDate: getRandomExpiryDate() },
        { name: 'garlic', freshness: 'fresh', expiryDate: getRandomExpiryDate() },
        { name: 'olive oil', freshness: 'fresh', expiryDate: getRandomExpiryDate() }
      ];
    }
  };

  const showIngredientDetails = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setShowFreshnessModal(true);
  };

  // Get all unique tags from recipes
  const allTags = Array.from(new Set(recipes.flatMap(recipe => recipe.tags)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-800">Savour</h1>
            </div>
            <p className="text-sm text-gray-600 italic">Reduce food waste, save money, help the planet</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Impact Stats */}
        <section className="mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Impact</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg flex items-center">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <Recycle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Food Waste Reduced</p>
                  <p className="text-xl font-bold text-gray-800">{impactStats.wasteReduced.toFixed(1)} kg</p>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Money Saved</p>
                  <p className="text-xl font-bold text-gray-800">${impactStats.moneySaved.toFixed(2)}</p>
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg flex items-center">
                <div className="bg-purple-100 p-3 rounded-full mr-4">
                  <Leaf className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">CO₂ Emissions Prevented</p>
                  <p className="text-xl font-bold text-gray-800">{impactStats.co2Prevented.toFixed(1)} kg</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">What ingredients do you have?</h2>
            
            <div className="flex mb-4">
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={currentIngredient}
                  onChange={(e) => setCurrentIngredient(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter an ingredient..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              <button
                onClick={handleAddIngredient}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 transition duration-200 flex items-center"
              >
                <PlusCircle className="h-5 w-5 mr-1" />
                Add
              </button>
              <button
                onClick={() => setShowImageModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-lg transition duration-200 flex items-center"
              >
                <Camera className="h-5 w-5 mr-1" />
                Scan
              </button>
            </div>

            {previewImage && (
              <div className="mb-4">
                <div className="relative inline-block">
                  <img 
                    src={previewImage} 
                    alt="Ingredient preview" 
                    className="h-24 w-auto rounded-md object-cover border border-gray-300"
                  />
                  <button 
                    onClick={() => setPreviewImage(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {ingredients.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((ingredient, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 rounded-full text-sm flex items-center cursor-pointer ${
                        ingredient.freshness === 'fresh' 
                          ? 'bg-green-100 text-green-800' 
                          : ingredient.freshness === 'use soon'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                      onClick={() => showIngredientDetails(ingredient)}
                    >
                      {ingredient.name}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveIngredient(ingredient.name);
                        }}
                        className="ml-2 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                  {ingredients.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center hover:bg-gray-200"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>
            )}

            {ingredients.length > 0 && (
              <button
                onClick={generateRecipes}
                disabled={isGenerating}
                className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition duration-200 flex items-center justify-center ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Generating recipes...
                  </>
                ) : (
                  <>
                    <ChefHat className="h-5 w-5 mr-2" />
                    Generate AI Recipe
                  </>
                )}
              </button>
            )}
          </div>
        </section>

        <section className="mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Filters</h2>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleFilter(tag)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    activeFilters.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            {filteredRecipes.length > 0 ? 'Recipes for You' : 'No matching recipes found'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <div key={recipe.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-200">
                <img
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">{recipe.title}</h3>
                  
                  <div className="flex items-center text-gray-600 mb-4">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="text-sm">{recipe.prepTime + recipe.cookTime} mins</span>
                    <span className="mx-2">•</span>
                    <Users className="h-4 w-4 mr-1" />
                    <span className="text-sm">{recipe.servings} servings</span>
                    {recipe.difficulty && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="text-sm capitalize">{recipe.difficulty}</span>
                      </>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 mb-2">Ingredients:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {recipe.ingredients.slice(0, 3).map((ingredient, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          {ingredient}
                        </li>
                      ))}
                      {recipe.ingredients.length > 3 && (
                        <li className="text-blue-600">+{recipe.ingredients.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                  
                  {/* Sustainability and cost metrics */}
                  {(recipe.sustainability !== undefined || recipe.costSaving !== undefined) && (
                    <div className="mb-4 flex space-x-2">
                      {recipe.sustainability !== undefined && (
                        <div className="bg-green-50 px-2 py-1 rounded text-xs flex items-center">
                          <Leaf className="h-3 w-3 mr-1 text-green-600" />
                          <span>{recipe.sustainability}% sustainable</span>
                        </div>
                      )}
                      {recipe.costSaving !== undefined && (
                        <div className="bg-blue-50 px-2 py-1 rounded text-xs flex items-center">
                          <DollarSign className="h-3 w-3 mr-1 text-blue-600" />
                          <span>Save ${recipe.costSaving.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {recipe.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition duration-200 flex items-center justify-center">
                    <Utensils className="h-4 w-4 mr-2" />
                    View Recipe
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Image Upload Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Scan Ingredients</h3>
              <button 
                onClick={() => setShowImageModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition duration-200 ${
                isDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-500'
              }`}
            >
              <input {...getInputProps()} />
              <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              {isAnalyzingImage ? (
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 mx-auto text-green-500 animate-spin mb-2" />
                  <p className="text-gray-600">Analyzing ingredients...</p>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 mb-2">Drag & drop an image here, or click to select</p>
                  <p className="text-sm text-gray-500">Supported formats: JPG, PNG, WEBP</p>
                </>
              )}
            </div>
            
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Our AI will analyze your image and identify ingredients</p>
            </div>
          </div>
        </div>
      )}

      {/* Freshness Assessment Modal */}
      {showFreshnessModal && selectedIngredient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Ingredient Details</h3>
              <button 
                onClick={() => setShowFreshnessModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <h4 className="text-lg font-medium mb-2 capitalize">{selectedIngredient.name}</h4>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Freshness Status:</p>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  selectedIngredient.freshness === 'fresh' 
                    ? 'bg-green-100 text-green-800' 
                    : selectedIngredient.freshness === 'use soon'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }`}>
                  {selectedIngredient.freshness === 'fresh' && 'Fresh'}
                  {selectedIngredient.freshness === 'use soon' && 'Use Soon'}
                  {selectedIngredient.freshness === 'expired' && 'Expired'}
                </div>
              </div>
              
              {selectedIngredient.expiryDate && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Estimated Expiry Date:</p>
                  <p className="font-medium">{new Date(selectedIngredient.expiryDate).toLocaleDateString()}</p>
                </div>
              )}
              
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h5 className="font-medium text-blue-800 mb-2">Storage Tips</h5>
                <p className="text-sm text-blue-700">
                  {selectedIngredient.name.includes('tomato') && 'Store at room temperature away from direct sunlight. Refrigerate only when fully ripe.'}
                  {selectedIngredient.name.includes('banana') && 'Store at room temperature. Refrigerate only when fully ripe to extend life by a few days.'}
                  {selectedIngredient.name.includes('onion') && 'Store in a cool, dry, dark place with good ventilation. Keep away from potatoes.'}
                  {selectedIngredient.name.includes('carrot') && 'Remove tops, place in a container with water, and refrigerate. Change water every 4-5 days.'}
                  {selectedIngredient.name.includes('bell pepper') && 'Store in the refrigerator crisper drawer in a plastic bag with a few holes.'}
                  {selectedIngredient.name.includes('garlic') && 'Store in a cool, dry place with good air circulation. Do not refrigerate.'}
                  {!['tomato', 'banana', 'onion', 'carrot', 'bell pepper', 'garlic'].some(item => selectedIngredient.name.includes(item)) && 
                    'Store properly according to type. Most produce lasts longer in the refrigerator crisper drawer.'}
                </p>
              </div>
              
              {selectedIngredient.freshness === 'expired' && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h5 className="font-medium text-red-800 mb-2">Safety Warning</h5>
                  <p className="text-sm text-red-700">
                    This item appears to be past its prime. Check carefully for signs of spoilage before using.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowFreshnessModal(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <ChefHat className="h-6 w-6 text-green-400" />
              <h2 className="text-xl font-bold">Savour</h2>
            </div>
            <div className="flex items-center space-x-1">
              <Leaf className="h-5 w-5 text-green-400" />
              <p className="text-sm">Reducing food waste, one recipe at a time</p>
            </div>
          </div>
          <div className="mt-6 text-center text-gray-400 text-sm">
            <p>© 2025 Savour. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;