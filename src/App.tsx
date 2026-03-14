/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  ChefHat, 
  Package, 
  Calculator, 
  ArrowLeft,
  Scale,
  UtensilsCrossed,
  DollarSign,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Ingredient {
  id: number;
  name: string;
  unit: string;
  price: number;
  quantity_per_package: number;
}

interface RecipeIngredient {
  ingredient_id: number;
  name?: string;
  unit?: string;
  quantity: number;
}

interface Recipe {
  id: number;
  name: string;
  yield: number;
  totalCost: number;
  costPerUnit: number;
  ingredients?: (RecipeIngredient & { price: number; quantity_per_package: number })[];
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('s25_auth') === 'true');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [view, setView] = useState<'dashboard' | 'ingredients' | 'add-recipe' | 'recipe-detail'>('dashboard');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Form states
  const [newIngredient, setNewIngredient] = useState({ name: '', unit: 'kg', price: '', quantity_per_package: '' });
  const [editingIngredientId, setEditingIngredientId] = useState<number | null>(null);

  const [newRecipe, setNewRecipe] = useState({ name: '', yield: 1, ingredients: [] as RecipeIngredient[] });
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null);

  useEffect(() => {
    fetchIngredients();
    fetchRecipes();
  }, []);

  const fetchIngredients = async () => {
    const res = await fetch('/api/ingredients');
    const data = await res.json();
    setIngredients(data);
  };

  const fetchRecipes = async () => {
    const res = await fetch('/api/recipes');
    const data = await res.json();
    setRecipes(data);
  };

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...newIngredient,
      price: parseFloat(newIngredient.price),
      quantity_per_package: parseFloat(newIngredient.quantity_per_package)
    };

    if (editingIngredientId) {
      await fetch(`/api/ingredients/${editingIngredientId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      setEditingIngredientId(null);
    } else {
      await fetch('/api/ingredients', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
    }

    setNewIngredient({ name: '', unit: 'kg', price: '', quantity_per_package: '' });
    fetchIngredients();
    fetchRecipes(); // Refresh recipes to reflect new cost
  };

  const handleEditIngredient = (ing: Ingredient) => {
    setNewIngredient({
      name: ing.name,
      unit: ing.unit,
      price: ing.price.toString(),
      quantity_per_package: ing.quantity_per_package.toString()
    });
    setEditingIngredientId(ing.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteIngredient = async (id: number) => {
    if(!confirm('Tem certeza que deseja excluir este ingrediente?')) return;
    await fetch(`/api/ingredients/${id}`, { method: 'DELETE' });
    fetchIngredients();
    fetchRecipes(); // Refresh recipes as they might have lost an ingredient
  };

  const handleAddRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newRecipe.ingredients.length === 0) return alert('Adicione pelo menos um ingrediente');
    
    if (editingRecipeId) {
      await fetch(`/api/recipes/${editingRecipeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecipe)
      });
      setEditingRecipeId(null);
    } else {
      await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecipe)
      });
    }

    setNewRecipe({ name: '', yield: 1, ingredients: [] });
    fetchRecipes();
    setView('dashboard');
  };

  const handleEditRecipe = async (recipe: Recipe) => {
    const res = await fetch(`/api/recipes/${recipe.id}`);
    const data = await res.json();
    
    // A API retorna "id" mas o formulário usa "ingredient_id"
    const mappedIngredients = (data.ingredients || []).map((ing: any) => ({
      ingredient_id: ing.id || ing.ingredient_id,
      quantity: ing.quantity
    }));

    setNewRecipe({
      name: data.name,
      yield: data.yield,
      ingredients: mappedIngredients
    });
    setEditingRecipeId(recipe.id);
    setView('add-recipe');
  };

  const handleDeleteRecipe = async (id: number) => {
    if(!confirm('Tem certeza que deseja excluir esta receita?')) return;
    await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
    fetchRecipes();
  };

  const viewRecipeDetail = async (id: number) => {
    const res = await fetch(`/api/recipes/${id}`);
    const data = await res.json();
    setSelectedRecipe(data);
    setView('recipe-detail');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginPassword === '09041977') {
      setIsAuthenticated(true);
      sessionStorage.setItem('s25_auth', 'true');
      setLoginError(false);
    } else {
      setLoginError(true);
      setLoginPassword('');
    }
  };

  // Animations
  const pageVariants = {
    initial: { opacity: 0, scale: 0.98, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.98, y: -10, transition: { duration: 0.2 } }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-10">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-orange-500/30"
            >
              <UtensilsCrossed className="text-white w-10 h-10" strokeWidth={2.5} />
            </motion.div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              Salgadaria 25
            </h1>
            <p className="text-stone-500 text-sm mt-2 font-medium">Painel de Custos de Produção</p>
          </div>

          <form onSubmit={handleLogin} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-white/10 p-2.5 rounded-xl">
                <Lock className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Acesso Restrito</h2>
                <p className="text-stone-500 text-xs">Digite a senha para continuar</p>
              </div>
            </div>

            <div className="relative mb-6">
              <input
                type={showPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={e => { setLoginPassword(e.target.value); setLoginError(false); }}
                placeholder="Senha de acesso"
                autoFocus
                className={`w-full bg-white/10 border ${
                  loginError ? 'border-red-500/50 ring-2 ring-red-500/20' : 'border-white/10'
                } rounded-2xl px-5 py-4 text-white placeholder:text-stone-600 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all font-mono tracking-widest text-lg`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {loginError && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm font-semibold mb-4 flex items-center gap-2"
              >
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                Senha incorreta. Tente novamente.
              </motion.p>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 rounded-2xl font-bold text-lg tracking-wide hover:from-orange-600 hover:to-amber-600 transition-all shadow-xl shadow-orange-500/20"
            >
              Entrar
            </motion.button>
          </form>

          <p className="text-center text-stone-700 text-xs mt-8">© 2026 Salgadaria 25 — Todos os direitos reservados</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-stone-50 to-amber-50/50 text-stone-900 font-sans pb-12 selection:bg-orange-200">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-stone-200/50 px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => setView('dashboard')}
          >
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-2.5 rounded-2xl shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-all duration-300">
              <UtensilsCrossed className="text-white w-6 h-6" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Salgadaria 25
              </h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-stone-400 -mt-1">Painel de Custos</p>
            </div>
          </motion.div>
          <nav className="flex gap-2">
            <button 
              onClick={() => setView('ingredients')}
              className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                view === 'ingredients' 
                ? 'bg-stone-900 text-white shadow-md' 
                : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Estoque
            </button>
            <button 
              onClick={() => setView('dashboard')}
              className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                view === 'dashboard' 
                ? 'bg-stone-900 text-white shadow-md' 
                : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Receitas
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-10">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              variants={pageVariants}
              initial="initial" animate="animate" exit="exit"
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h2 className="text-4xl font-extrabold tracking-tight text-stone-800">Cardápio de Produção</h2>
                  <p className="text-stone-500 text-base mt-1">Gerencie e analise o custo real de cada salgado</p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setEditingRecipeId(null);
                    setNewRecipe({ name: '', yield: 1, ingredients: [] });
                    setView('add-recipe');
                  }}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3.5 rounded-2xl flex items-center gap-2 hover:from-orange-600 hover:to-amber-600 transition-all shadow-xl shadow-orange-500/20 font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  Nova Receita
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((recipe, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={recipe.id}
                    className="bg-white rounded-[2rem] p-7 shadow-sm border border-stone-100 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden"
                    onClick={() => viewRecipeDetail(recipe.id)}
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-orange-50 p-3 rounded-2xl">
                        <ChefHat className="w-6 h-6 text-orange-500" />
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteRecipe(recipe.id); }}
                        className="text-stone-300 hover:text-red-500 transition-colors bg-stone-50 hover:bg-red-50 p-2 rounded-full"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-stone-800 tracking-tight mb-6 line-clamp-2">{recipe.name}</h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-stone-100">
                        <span className="text-xs uppercase tracking-widest text-stone-500 font-bold">Rendimento</span>
                        <span className="text-stone-700 font-semibold">{recipe.yield} un</span>
                      </div>
                      <div className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-stone-100">
                        <span className="text-xs uppercase tracking-widest text-stone-500 font-bold">Lote Total</span>
                        <span className="text-stone-700 font-mono font-medium">R$ {recipe.totalCost.toFixed(2)}</span>
                      </div>
                      <div className="pt-4 border-t border-stone-100 flex justify-between items-center">
                        <span className="text-xs uppercase tracking-widest text-orange-600 font-black">Custo / Un</span>
                        <span className="text-3xl font-extrabold tracking-tight text-orange-600">R$ {recipe.costPerUnit.toFixed(2)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {recipes.length === 0 && (
                  <div className="col-span-full py-24 flex flex-col items-center justify-center bg-white/50 border-2 border-dashed border-stone-200 rounded-[2rem]">
                    <div className="bg-stone-100 p-6 rounded-full mb-6 relative">
                      <Calculator className="w-10 h-10 text-stone-400" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white animate-pulse"></div>
                    </div>
                    <h3 className="text-xl font-bold text-stone-700 mb-2">Seu cardápio está vazio</h3>
                    <p className="text-stone-500 max-w-sm text-center">Adicione sua primeira receita da Salgadaria 25 para começar a analisar seus custos e lucros.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'ingredients' && (
            <motion.div 
              key="ingredients"
              variants={pageVariants}
              initial="initial" animate="animate" exit="exit"
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              <div className="lg:col-span-4">
                <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-stone-200/40 border border-stone-100 sticky top-28">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center mb-6">
                    <Package className="w-6 h-6 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight mb-2">Novo Ingrediente</h2>
                  <p className="text-stone-500 text-sm mb-6 pb-6 border-b border-stone-100">Alimente o banco de dados com seus insumos de compra.</p>
                  
                  <form onSubmit={handleAddIngredient} className="space-y-5">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1.5 block pl-1">Nome do Insumo</label>
                      <input 
                        required
                        value={newIngredient.name}
                        onChange={e => setNewIngredient({...newIngredient, name: e.target.value})}
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all font-medium"
                        placeholder="Ex: Trigo, Carne Moída..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1.5 block pl-1">Unidade</label>
                        <select 
                          value={newIngredient.unit}
                          onChange={e => setNewIngredient({...newIngredient, unit: e.target.value})}
                          className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all font-medium cursor-pointer"
                        >
                          <option value="kg">Quilo (kg)</option>
                          <option value="g">Grama (g)</option>
                          <option value="l">Litro (l)</option>
                          <option value="ml">Mililitro (ml)</option>
                          <option value="un">Unidade (un)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1.5 block pl-1">Conteúdo</label>
                        <input 
                          required
                          type="number"
                          step="0.01"
                          value={newIngredient.quantity_per_package}
                          onChange={e => setNewIngredient({...newIngredient, quantity_per_package: e.target.value})}
                          className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all font-medium font-mono"
                          placeholder="1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1.5 block pl-1">Valor Pago (R$)</label>
                      <input 
                        required
                        type="number"
                        step="0.01"
                        value={newIngredient.price}
                        onChange={e => setNewIngredient({...newIngredient, price: e.target.value})}
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all font-medium font-mono text-orange-600"
                        placeholder="0.00"
                      />
                    </div>

                    {editingIngredientId && (
                      <button 
                        type="button"
                        onClick={() => {
                          setEditingIngredientId(null);
                          setNewIngredient({ name: '', unit: 'kg', price: '', quantity_per_package: '' });
                        }}
                        className="w-full text-stone-400 text-sm font-semibold hover:text-stone-800 transition-colors pt-4 block text-center"
                      >
                        Cancelar Edição
                      </button>
                    )}

                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold tracking-wide hover:bg-black transition-all mt-6 shadow-lg shadow-stone-900/20"
                    >
                      {editingIngredientId ? 'Atualizar Estoque' : 'Cadastrar Estoque'}
                    </motion.button>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-6">
                <div className="flex items-end justify-between">
                  <h2 className="text-3xl font-extrabold tracking-tight text-stone-800">Insumos Cadastrados</h2>
                  <span className="bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-full text-sm">
                    {ingredients.length} itens
                  </span>
                </div>
                
                <div className="bg-white rounded-[2rem] shadow-sm border border-stone-100 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50/50 border-b border-stone-100">
                        <th className="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-stone-400">Ingrediente</th>
                        <th className="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-stone-400">Embalagem</th>
                        <th className="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-stone-400">Preço Pago</th>
                        <th className="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-stone-400">Fração/Un</th>
                        <th className="px-8 py-5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {ingredients.map(ing => (
                        <tr key={ing.id} className="hover:bg-orange-50/30 transition-colors group">
                          <td className="px-8 py-5 font-bold text-stone-700">{ing.name}</td>
                          <td className="px-8 py-5 text-sm font-medium text-stone-500 bg-stone-50/50 w-32 border-x border-stone-100">{ing.quantity_per_package} {ing.unit}</td>
                          <td className="px-8 py-5 text-sm font-mono font-medium text-stone-600">R$ {ing.price.toFixed(2)}</td>
                          <td className="px-8 py-5 text-sm font-mono font-bold text-orange-600">
                            R$ {(ing.price / ing.quantity_per_package).toFixed(4)} <span className="text-stone-400 font-sans text-xs font-medium ml-1">/{ing.unit}</span>
                          </td>
                          <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleEditIngredient(ing)}
                              className="text-stone-400 hover:text-orange-500 hover:bg-orange-50 transition-all p-2 rounded-xl opacity-0 group-hover:opacity-100 font-semibold text-xs uppercase"
                            >
                              Editar
                            </button>
                            <button 
                              onClick={() => handleDeleteIngredient(ing.id)}
                              className="text-stone-300 hover:text-white hover:bg-red-500 transition-all p-2 rounded-xl opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {ingredients.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-8 py-16 text-center">
                            <div className="inline-flex bg-stone-100 p-4 rounded-full mb-3">
                              <Package className="w-6 h-6 text-stone-400" />
                            </div>
                            <p className="text-stone-500 font-medium">Você ainda não tem ingredientes.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'add-recipe' && (
            <motion.div 
              key="add-recipe"
              variants={pageVariants}
              initial="initial" animate="animate" exit="exit"
              className="max-w-4xl mx-auto"
            >
              <button 
                onClick={() => setView('dashboard')}
                className="flex items-center gap-2 text-stone-400 font-bold hover:text-stone-800 transition-colors mb-8 bg-white px-4 py-2 rounded-full border border-stone-200 shadow-sm w-fit shadow-stone-200/50 hover:-translate-x-1"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={3} />
                Voltar
              </button>

              <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-stone-200/50 border border-stone-100">
                <div className="mb-10 text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ChefHat className="w-8 h-8 text-orange-600" />
                  </div>
                  <h2 className="text-4xl font-extrabold tracking-tight text-stone-800">{editingRecipeId ? 'Editar Receita' : 'Modelar Receita'}</h2>
                  <p className="text-stone-500 mt-2">Defina o nome, rendimento e ingredientes da Salgadaria 25</p>
                </div>

                <form onSubmit={handleAddRecipe} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-stone-50/50 border border-stone-100 rounded-[2rem]">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1.5 block pl-1">Nome Específico</label>
                      <input 
                        required
                        value={newRecipe.name}
                        onChange={e => setNewRecipe({...newRecipe, name: e.target.value})}
                        className="w-full bg-white border border-stone-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all font-bold text-lg text-stone-800 placeholder:font-normal"
                        placeholder="Ex: Massa de Coxinha 10g"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1.5 block pl-1">Rendimento Bruto (Un)</label>
                      <input 
                        required
                        type="number"
                        value={newRecipe.yield}
                        onChange={e => setNewRecipe({...newRecipe, yield: parseInt(e.target.value) || 1})}
                        className="w-full bg-white border border-stone-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all font-mono font-bold text-lg text-stone-800"
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-stone-100 pb-4">
                      <div>
                        <h3 className="text-2xl font-bold tracking-tight text-stone-800">Ficha Técnica</h3>
                        <p className="text-stone-500 text-sm mt-1">Insira os itens que compõem a receita</p>
                      </div>
                      <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{newRecipe.ingredients.length} itens</span>
                    </div>
                    
                    {newRecipe.ingredients.length > 0 && (
                      <div className="space-y-3">
                        <AnimatePresence>
                          {newRecipe.ingredients.map((ri, index) => (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              key={index} 
                              className="flex items-center gap-4 bg-white border border-stone-200 px-6 py-4 rounded-2xl group shadow-sm"
                            >
                              <div className="bg-orange-50 p-2 rounded-xl">
                                <Scale className="w-5 h-5 text-orange-600" />
                              </div>
                              <div className="flex-1 border-r border-stone-100 pr-4">
                                <p className="font-bold text-stone-700 text-lg">{ingredients.find(i => i.id === ri.ingredient_id)?.name}</p>
                              </div>
                              <div className="w-36">
                                <p className="text-xs text-stone-400 uppercase tracking-widest font-bold mb-1">Quantidade</p>
                                <div className="flex items-center gap-1">
                                  <input 
                                    type="text"
                                    inputMode="decimal"
                                    value={ri.quantity}
                                    onChange={(e) => {
                                      const raw = e.target.value.replace(',', '.');
                                      const val = parseFloat(raw);
                                      const ings = [...newRecipe.ingredients];
                                      ings[index] = { ...ings[index], quantity: isNaN(val) ? 0 : val };
                                      setNewRecipe({...newRecipe, ingredients: ings});
                                    }}
                                    className="w-20 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-mono font-bold text-orange-600 focus:ring-2 focus:ring-orange-500/50 outline-none text-center"
                                  />
                                  <span className="text-xs text-stone-400 font-bold">{ingredients.find(i => i.id === ri.ingredient_id)?.unit}</span>
                                </div>
                              </div>
                              {(() => {
                                const found = ingredients.find(i => i.id === ri.ingredient_id);
                                const cost = found ? (found.price / found.quantity_per_package) * ri.quantity : 0;
                                return (
                                  <div className="w-28 text-right border-l border-stone-100 pl-4">
                                    <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mb-0.5">Custo</p>
                                    <p className="font-mono font-bold text-stone-700">R$ {cost.toFixed(2)}</p>
                                  </div>
                                );
                              })()}
                              <button 
                                type="button"
                                onClick={() => {
                                  const ings = [...newRecipe.ingredients];
                                  ings.splice(index, 1);
                                  setNewRecipe({...newRecipe, ingredients: ings});
                                }}
                                className="text-stone-300 hover:text-white hover:bg-red-500 transition-all p-3 rounded-xl ml-2"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}

                    <div className="bg-stone-50 border-2 border-dashed border-stone-200 p-8 rounded-[2rem] mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                        <div className="md:col-span-6">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1.5 block pl-1">Escolher do Estoque</label>
                          <select 
                            id="ing-select"
                            className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-orange-500/50 outline-none transition-all font-medium cursor-pointer"
                          >
                            <option value="">Selecione um ingrediente...</option>
                            {ingredients.map(ing => (
                              <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-3">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1.5 block pl-1">Use a mesma un. do esq.</label>
                          <input 
                            id="ing-qty"
                            type="text"
                            inputMode="decimal"
                            className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-orange-500/50 outline-none transition-all font-mono font-bold"
                            placeholder="Qtd (0,00)"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <motion.button 
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => {
                              const select = document.getElementById('ing-select') as HTMLSelectElement;
                              const qtyInput = document.getElementById('ing-qty') as HTMLInputElement;
                              const id = parseInt(select.value);
                              // Suporte para vírgula
                              const qtyRaw = qtyInput.value.replace(',', '.');
                              const qty = parseFloat(qtyRaw);
                              
                              if (id && qty > 0) {
                                setNewRecipe({
                                  ...newRecipe, 
                                  ingredients: [...newRecipe.ingredients, { ingredient_id: id, quantity: qty }]
                                });
                                select.value = "";
                                qtyInput.value = "";
                              } else {
                                alert("Selecione um ingrediente e insira uma quantidade válida.");
                              }
                            }}
                            className="w-full bg-stone-900 border border-stone-900 text-white py-4 rounded-2xl font-bold hover:bg-stone-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-stone-900/10"
                          >
                            <Plus className="w-5 h-5" />
                            Mesclar
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <motion.button 
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-5 rounded-2xl font-black tracking-wide text-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-xl shadow-orange-500/30 border border-orange-400/50"
                    >
                      {editingRecipeId ? 'Atualizar Receita' : 'Processar e Salvar Receita'}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {view === 'recipe-detail' && selectedRecipe && (
            <motion.div 
              key="recipe-detail"
              variants={pageVariants}
              initial="initial" animate="animate" exit="exit"
              className="max-w-5xl mx-auto"
            >
              <button 
                onClick={() => setView('dashboard')}
                className="flex items-center gap-2 text-stone-400 font-bold hover:text-stone-800 transition-colors mb-8 bg-white px-4 py-2 rounded-full border border-stone-200 shadow-sm w-fit"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={3} />
                Voltar
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                  <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-stone-200/40 border border-stone-100">
                    <div className="flex justify-between items-start mb-10 pb-10 border-b border-stone-100">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">Salgadaria 25</span>
                          <span className="text-stone-400 text-sm font-medium">Relatório de Carga</span>
                        </div>
                        <h2 className="text-5xl font-extrabold tracking-tight text-stone-800">{selectedRecipe.name}</h2>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEditRecipe(selectedRecipe); }}
                          className="bg-orange-50 border border-orange-100 hover:bg-orange-100 text-orange-600 px-6 py-4 rounded-2xl text-center shadow-inner font-bold flex items-center gap-2 transition-all cursor-pointer"
                        >
                          EDITAR
                        </button>
                        <div className="bg-stone-50 border border-stone-100 px-6 py-4 rounded-2xl text-center shadow-inner">
                          <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1">Padrão Bruto</p>
                          <p className="text-3xl font-black text-stone-700">{selectedRecipe.yield}<span className="text-lg font-bold text-stone-400 ml-1">un</span></p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-stone-800 mb-6">Detalhamento dos Custos Base</h3>
                      <div className="bg-stone-50 rounded-[2rem] border border-stone-200 overflow-hidden shadow-inner">
                        {selectedRecipe.ingredients?.map((ing, idx) => {
                          const cost = (ing.price / ing.quantity_per_package) * ing.quantity;
                          return (
                            <div key={idx} className="flex justify-between items-center p-6 border-b border-stone-200/60 last:border-0 hover:bg-white transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="bg-white border border-stone-100 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-stone-400 shadow-sm">
                                  {idx + 1}
                                </div>
                                <div>
                                  <p className="font-bold text-lg text-stone-700">{ing.name}</p>
                                  <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mt-0.5">Uso: {ing.quantity} {ing.unit}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-0.5">Fração R$</p>
                                <p className="font-mono text-xl font-bold text-orange-600">{(cost).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                  {/* Bloco de Resumo Financeiro */}
                  <div className="bg-stone-900 text-white rounded-[2.5rem] p-8 shadow-2xl shadow-stone-900/30 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <DollarSign className="w-48 h-48" />
                    </div>
                    
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-8 flex items-center gap-2">
                       Painel Financeiro
                    </h3>
                    
                    <div className="space-y-8 relative z-10">
                      <div>
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Custo Base Total</p>
                        <p className="text-4xl font-mono font-light tracking-tight">
                          {selectedRecipe.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>

                      <div className="pt-8 border-t border-white/10">
                        <div className="bg-gradient-to-r from-orange-500 to-amber-500 -mx-8 px-8 py-6 mb-2">
                          <p className="text-xs font-bold text-orange-100 uppercase tracking-widest mb-1">Custo Exato / Un</p>
                          <p className="text-5xl font-mono font-bold tracking-tight text-white drop-shadow-md">
                            {selectedRecipe.costPerUnit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <p className="text-[10px] uppercase font-bold text-stone-400 tracking-widest mb-3">Sugestão de Venda (Markup 300%)</p>
                        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10">
                          <p className="text-3xl font-mono font-bold text-orange-400">
                            {(selectedRecipe.costPerUnit * 3).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-[10px] text-stone-300 font-bold uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            Lucro Bruto: {((selectedRecipe.costPerUnit * 3) - selectedRecipe.costPerUnit).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / un
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dica da Salgadaria */}
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-[2.5rem] p-8 border border-orange-100 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                      <div className="bg-white p-2.5 rounded-xl shadow-sm border border-orange-100">
                        <Scale className="w-5 h-5 text-orange-500" />
                      </div>
                      <h4 className="font-bold text-stone-800">Cálculo Limpo</h4>
                    </div>
                    <p className="text-sm font-medium text-stone-600 leading-relaxed relative z-10">
                      O valor exibido acima não contabiliza taxas de delivery, fritura (óleo), energia ou embalagens unitárias e mão de obra. 
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
