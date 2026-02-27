const express = require("express");

const app = express();
const port = 3000;

const BASE_URL = "https://rickandmortyapi.com/api";

async function searchResource(resourceType, searchTerm) {
  try {
    const response = await fetch(`${BASE_URL}/${resourceType}/?name=${encodeURIComponent(searchTerm)}`);
    
    if (response.status === 404) {
      return [];
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${resourceType}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error(`Error searching ${resourceType}:`, error.message);
    return [];
  }
}

app.get("/", (req, res) => {
  res.send("Hello World!");
});


app.get("/search", async (req, res) => {
  const searchTerm = req.query.term;
  const limitRaw = req.query.limit;
  
  if (!searchTerm) {
    return res.status(400).json({ 
      error: "Missing 'term' query parameter" 
    });
  }

  let limit = null;
  if (limitRaw !== undefined) {
    limit = Number.parseInt(limitRaw, 10);
    if (!Number.isFinite(limit) || limit <= 0) {
      return res.status(400).json({
        error: "Query parameter 'limit' must be a positive integer"
      });
    }
  }
  
  try {
    const [characters, locations, episodes] = await Promise.all([
      searchResource("character", searchTerm),
      searchResource("location", searchTerm),
      searchResource("episode", searchTerm)
    ]);
    

    const results = [];
    
    characters.forEach(character => {
      results.push({
        name: character.name,
        type: "character",
        url: character.url
      });
    });
    
    locations.forEach(location => {
      results.push({
        name: location.name,
        type: "location",
        url: location.url
      });
    });
    
    episodes.forEach(episode => {
      results.push({
        name: episode.name,
        type: "episode",
        url: episode.url
      });
    });
    
    const limitedResults = limit ? results.slice(0, limit) : results;
    
    res.json(limitedResults);
  } catch (error) {
    console.error("Error in /search endpoint:", error);
    res.status(500).json({ 
      error: "Internal server error" 
    });
  }
});

app.listen(port, () => {
  console.log(`Rick and Morty service listening on port ${port}!`);
});
