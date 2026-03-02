import express from "express";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // GitHub API Routes
  app.get("/api/github/contents", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url || typeof url !== 'string') {
         res.status(400).json({ error: "Missing or invalid 'url' query parameter" });
         return;
      }

      // Parse GitHub URL: https://github.com/owner/repo
      // or https://github.com/owner/repo/tree/branch/path
      const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+)\/?(.*))?/);
      if (!match) {
         res.status(400).json({ error: "Invalid GitHub repository URL" });
         return;
      }

      const [, owner, repo, branch, path] = match;
      const apiPath = path ? path : '';
      const ref = branch ? `?ref=${branch}` : '';
      
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${apiPath}${ref}`;

      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'PortfolioPath-App'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("GitHub API Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch GitHub contents" });
    }
  });

  app.get("/api/github/raw", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url || typeof url !== 'string') {
         res.status(400).json({ error: "Missing or invalid 'url' query parameter" });
         return;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch raw content: ${response.statusText}`);
      }

      const text = await response.text();
      res.send(text);
    } catch (error: any) {
      console.error("Raw Content Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch raw content" });
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
    // Production static file serving (if needed in the future)
    // For this environment, we rely on Vite middleware mostly, 
    // but standard practice would be serving dist/ here.
    app.use(express.static('dist'));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
