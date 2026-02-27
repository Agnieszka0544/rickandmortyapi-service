import express from 'express';
import {Request, Response} from 'express';

const app = express();
const port = 3000;

const BASE_URL = "https://rickandmortyapi.com/api";

interface Character {
  id: number,
  name: string,
  type: string,
  url: string,
  episode: string[]
}

interface Location {
  id: number;
  name: string;
  type: string;
  url: string;
}

interface Episode {
  name: string,
  type: string,
  url: string
}

interface SearchResult {
  name: string;
  type: 'character' | 'location' | 'episode';
  url: string;
}

interface CharacterPair {
  character1: {
    name: string;
    url: string;
  };
  character2: {
    name: string;
    url: string;
  };
  episodes: number;
}

interface ApiResponse<T> {
  info: {
    count: number;
    pages: number;
    next: string | null;
    prev: string | null;
  };
  results: T[];
}

async function searchResource(resourceType: string, searchTerm: string): Promise<(Character | Location | Episode)[]> {
  try {
    const response = await fetch(`${BASE_URL}/${resourceType}/?name=${encodeURIComponent(searchTerm)}`);
    
    if (response.status === 404) {
      return [];
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${resourceType}: ${response.statusText}`);
    }
    
    const data = await response.json() as ApiResponse<Character | Location | Episode>;
    return data.results || [];
  } catch (error: any) {
    console.error(`Error searching ${resourceType}:`, error.message);
    return [];
  }
}

async function getAllCharacters() {
  try{
    const response = await fetch(`${BASE_URL}/character/`);

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch charactes: ${response.statusText}`);
    }

    const data = await response.json() as ApiResponse<Character>;
    return data.results || [];
  } catch (error: any) {
    console.error(`Error searching characters:`, error.message);
    return [];
  }
}


app.get("/search", async (req: Request, res: Response) => {
  const searchTerm = req.query.term as string;
  const limitRaw = req.query.limit as string | undefined;
  
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
    

    const results: SearchResult[] = [];
    
    (characters as Character[]).forEach(character => {
      results.push({
        name: character.name,
        type: "character",
        url: character.url
      });
    });
    
    (locations as Location[]).forEach(location => {
      results.push({
        name: location.name,
        type: "location",
        url: location.url
      });
    });
    
    (episodes as Episode[]).forEach(episode => {
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


app.get("/top-pairs", async (req: Request, res: Response) => {
  const minEpisodesRaw = req.query.min as string | undefined;
  const maxEpisodesRaw = req.query.max as string | undefined;
  const limitRaw = req.query.limit as string | undefined;

  let minEpisodes = 0;
  let maxEpisodes = Infinity;
  let limit = 20;

  if (minEpisodesRaw !== undefined) {
    minEpisodes = Number.parseInt(minEpisodesRaw, 10);
    if (!Number.isFinite(minEpisodes) || minEpisodes < 0) {
      return res.status(400).json({
        error: "Query parameter 'min' must be a non-negative integer"
      });
    }
  }

  if (maxEpisodesRaw !== undefined) {
    maxEpisodes = Number.parseInt(maxEpisodesRaw, 10);
    if (!Number.isFinite(maxEpisodes) || maxEpisodes < 0) {
      return res.status(400).json({
        error: "Query parameter 'max' must be a non-negative integer"
      });
    }
  }

  if (limitRaw !== undefined) {
    limit = Number.parseInt(limitRaw, 10);
    if (!Number.isFinite(limit) || limit <= 0) {
      return res.status(400).json({
        error: "Query parameter 'limit' must be a positive integer"
      });
    }
  }

  try {
    const allCharacters = await getAllCharacters();

    const charactersWithEpisodes: { id: number; name: string; url: string; episodes: string[] }[] = [];
    
    (allCharacters as Character[]).forEach((character: Character) => {
      charactersWithEpisodes.push({
        id: character.id,
        name: character.name,
        url: character.url,
        episodes: character.episode
      });
    });

    const charactersPairs: CharacterPair[] = [];

    charactersWithEpisodes.forEach(character1 => {
      charactersWithEpisodes.forEach(character2 => {
        if(character1.id < character2.id) {
          const characterBEpisodeSet = new Set(character2.episodes);
          const commonEpisodes = character1.episodes.filter(ep => characterBEpisodeSet.has(ep));
          
          if (commonEpisodes.length > 0) {
            charactersPairs.push({
              character1: { 
                name: character1.name,
                url: character1.url
               },
              character2: { 
                name: character2.name, 
                url: character2.url
              },
              episodes: commonEpisodes.length
            });
          }
        }
      });
    });

    const sortedPairs = charactersPairs.sort((a, b) => b.episodes - a.episodes);
    const filteredPairs = sortedPairs.filter(pair => pair.episodes >= minEpisodes && pair.episodes <= maxEpisodes);
    const limitedResults = filteredPairs.slice(0, limit);
    
    res.json(limitedResults);

  } catch(error: any) {
    console.error("Error in /top-pairs endpoint:", error.message, error.stack);
    res.status(500).json({
      error: "Internal server error"
    });
  }
});


app.listen(port, () => {
  console.log(`Rick and Morty service listening on port ${port}!`);
});
