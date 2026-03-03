import express from "express";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MongoDB Schema
const userSchema = new mongoose.Schema({
  githubId: { type: String, required: true, unique: true },
  growthData: { type: mongoose.Schema.Types.Mixed, default: {} },
  radarData: { type: mongoose.Schema.Types.Mixed, default: {} },
});
const User = mongoose.model('User', userSchema);

async function startServer() {
  const app = express();
  const PORT = 3000;
  app.set('trust proxy', 1);

  app.use(express.json());
  app.use(cookieParser());

  // Connect to MongoDB
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("Connected to MongoDB");
    } catch (err) {
      console.error("MongoDB connection error:", err);
    }
  } else {
    console.warn("MONGODB_URI not set. Database features will not work.");
  }

  // GitHub OAuth Routes
  app.get("/api/auth/url", (req, res) => {
    const redirectUri = `${req.protocol}://${req.get("host")}/auth/callback`;
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID || "",
      redirect_uri: redirectUri,
      scope: "repo read:user",
    });
    res.json({ url: `https://github.com/login/oauth/authorize?${params.toString()}` });
  });

  app.get("/auth/callback", async (req, res) => {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      res.status(400).send("No code provided");
      return;
    }

    try {
      const redirectUri = `${req.protocol}://${req.get("host")}/auth/callback`;
      const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenResponse.json();
      if (tokenData.error) {
        throw new Error(tokenData.error_description || tokenData.error);
      }

      res.cookie("github_token", tokenData.access_token, {
        secure: true,
        sameSite: "none",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("OAuth error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("github_token", {
      secure: true,
      sameSite: "none",
      httpOnly: true,
    });
    res.json({ success: true });
  });

  app.get("/api/github/user", async (req, res) => {
    const token = req.cookies.github_token;
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch user");
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/github/repositories", async (req, res) => {
    const token = req.cookies.github_token;
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch repositories");
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch repositories" });
    }
  });

  // User Data Routes (MongoDB)
  app.get("/api/user/data", async (req, res) => {
    const token = req.cookies.github_token;
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      // Get user ID from GitHub
      const userRes = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (!userRes.ok) throw new Error("Failed to fetch user from GitHub");
      const userData = await userRes.json();
      const githubId = userData.id.toString();

      let user = await User.findOne({ githubId });
      if (!user) {
        user = await User.create({ githubId });
      }

      res.json({
        growthData: user.growthData,
        radarData: user.radarData
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ error: "Failed to fetch user data" });
    }
  });

  app.post("/api/user/data", async (req, res) => {
    const token = req.cookies.github_token;
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      // Get user ID from GitHub
      const userRes = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (!userRes.ok) throw new Error("Failed to fetch user from GitHub");
      const userData = await userRes.json();
      const githubId = userData.id.toString();

      const { growthData, radarData } = req.body;
      
      const updateData: any = {};
      if (growthData !== undefined) updateData.growthData = growthData;
      if (radarData !== undefined) updateData.radarData = radarData;

      const user = await User.findOneAndUpdate(
        { githubId },
        { $set: updateData },
        { new: true, upsert: true }
      );

      res.json({ success: true, data: user });
    } catch (error) {
      console.error("Error saving user data:", error);
      res.status(500).json({ error: "Failed to save user data" });
    }
  });

  // GitHub API Routes
  app.get("/api/github/contents", async (req, res) => {
    try {
      const { url } = req.query;
      const token = req.cookies.github_token;
      
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

      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'PortfolioPath-App'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(apiUrl, { headers });

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
      const token = req.cookies.github_token;
      
      if (!url || typeof url !== 'string') {
         res.status(400).json({ error: "Missing or invalid 'url' query parameter" });
         return;
      }

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, { headers });
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
    app.use(express.static('dist'));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
