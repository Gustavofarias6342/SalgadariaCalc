import express from "express";
import { createServer as createViteServer } from "vite";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

// Supabase Connection String (from .env)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = process.env.PORT || 3000;

  let client;
  // Wait for DB to connect and create tables if they don't exist
  try {
    client = await pool.connect();
    console.log("Database connection established.");
    await client.query(`
      CREATE TABLE IF NOT EXISTS ingredients (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        unit TEXT NOT NULL,
        price REAL NOT NULL,
        quantity_per_package REAL NOT NULL
      );

      CREATE TABLE IF NOT EXISTS recipes (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        yield INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS recipe_ingredients (
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
        quantity REAL NOT NULL
      );
    `);
    console.log("Database tables verified/created.");
  } catch (err) {
    console.error("Database initialization error:", err);
    throw err;
  } finally {
    if (client) client.release();
  }

  // API Routes
  
  // Ingredients
  app.get("/api/ingredients", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM ingredients ORDER BY id ASC");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/ingredients", async (req, res) => {
    const { name, unit, price, quantity_per_package } = req.body;
    try {
      const result = await pool.query(
        "INSERT INTO ingredients (name, unit, price, quantity_per_package) VALUES ($1, $2, $3, $4) RETURNING id",
        [name, unit, price, quantity_per_package]
      );
      res.json({ id: result.rows[0].id });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.put("/api/ingredients/:id", async (req, res) => {
    const { name, unit, price, quantity_per_package } = req.body;
    try {
      await pool.query(
        "UPDATE ingredients SET name = $1, unit = $2, price = $3, quantity_per_package = $4 WHERE id = $5",
        [name, unit, price, quantity_per_package, req.params.id]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete("/api/ingredients/:id", async (req, res) => {
    try {
      await pool.query("DELETE FROM ingredients WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Recipes
  app.get("/api/recipes", async (req, res) => {
    try {
      const recipesResult = await pool.query("SELECT * FROM recipes ORDER BY id ASC");
      const recipes = recipesResult.rows;

      const recipesWithCosts = await Promise.all(recipes.map(async (recipe: any) => {
        const ingredientsResult = await pool.query(`
          SELECT ri.quantity, i.price, i.quantity_per_package
          FROM recipe_ingredients ri
          JOIN ingredients i ON ri.ingredient_id = i.id
          WHERE ri.recipe_id = $1
        `, [recipe.id]);

        const ingredients = ingredientsResult.rows;
        const totalCost = ingredients.reduce((sum: number, ing: any) => {
          const costPerUnit = ing.price / ing.quantity_per_package;
          return sum + (ing.quantity * costPerUnit);
        }, 0);

        return {
          ...recipe,
          totalCost,
          costPerUnit: totalCost / recipe.yield
        };
      }));
      res.json(recipesWithCosts);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/recipes/:id", async (req, res) => {
    try {
      const recipeResult = await pool.query("SELECT * FROM recipes WHERE id = $1", [req.params.id]);
      const recipe = recipeResult.rows[0];
      
      if (!recipe) return res.status(404).json({ error: "Recipe not found" });

      const ingredientsResult = await pool.query(`
        SELECT i.id, i.name, i.unit, ri.quantity, i.price, i.quantity_per_package
        FROM recipe_ingredients ri
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.recipe_id = $1
      `, [req.params.id]);

      const ingredients = ingredientsResult.rows;
      const totalCost = ingredients.reduce((sum: number, ing: any) => {
        const costPerUnit = ing.price / ing.quantity_per_package;
        return sum + (ing.quantity * costPerUnit);
      }, 0);

      res.json({ 
        ...recipe, 
        totalCost,
        costPerUnit: totalCost / recipe.yield,
        ingredients 
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/recipes", async (req, res) => {
    const { name, yield: recipeYield, ingredients } = req.body;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const recipeResult = await client.query(
        "INSERT INTO recipes (name, yield) VALUES ($1, $2) RETURNING id",
        [name, recipeYield]
      );
      const recipeId = recipeResult.rows[0].id;

      for (const ing of ingredients) {
        await client.query(
          "INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES ($1, $2, $3)",
          [recipeId, ing.ingredient_id, ing.quantity]
        );
      }
      
      await client.query('COMMIT');
      res.json({ id: recipeId });
    } catch (e) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: (e as Error).message });
    } finally {
      client.release();
    }
  });

  app.put("/api/recipes/:id", async (req, res) => {
    const { name, yield: recipeYield, ingredients } = req.body;
    const recipeId = req.params.id;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Atualiza a receita principal
      await client.query(
        "UPDATE recipes SET name = $1, yield = $2 WHERE id = $3",
        [name, recipeYield, recipeId]
      );

      // Deleta todos os ingredientes antigos
      await client.query("DELETE FROM recipe_ingredients WHERE recipe_id = $1", [recipeId]);

      // Insere os novos ingredientes
      for (const ing of ingredients) {
        await client.query(
          "INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES ($1, $2, $3)",
          [recipeId, ing.ingredient_id, ing.quantity]
        );
      }
      
      await client.query('COMMIT');
      res.json({ success: true });
    } catch (e) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: (e as Error).message });
    } finally {
      client.release();
    }
  });

  app.delete("/api/recipes/:id", async (req, res) => {
    try {
      await pool.query("DELETE FROM recipes WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("/:path*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("CRITICAL ERROR DURING SERVER STARTUP:", err);
  process.exit(1);
});
