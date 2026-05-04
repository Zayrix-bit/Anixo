import express from "express";
import cors from "cors";
import { META, ANIME } from "@consumet/extensions";
import process from "node:process";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const cache = new Map();
const CACHE_TTL = 1000 * 60 * 60;

app.get("/api/check-dub/:anilistId", async (req, res) => {
  const { anilistId } = req.params;

  const cached = cache.get(anilistId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    res.set("Cache-Control", "public, max-age=3600");
    return res.json(cached.data);
  }

  try {
    const anilist = new META.Anilist();
    const gogo = new ANIME.Gogoanime();
    
    let episodes = 0;
    let hasDub = false;

    try {
      const [info, gogoSearch] = await Promise.all([
        anilist.fetchAnimeInfo(anilistId).catch(() => null),
        // Search Gogoanime to see if a Dub version exists
        anilist.fetchAnimeInfo(anilistId).then(info => 
          info ? gogo.search(`${info.title.english || info.title.romaji} (Dub)`) : null
        ).catch(() => null)
      ]);

      episodes = info?.episodes ?? 0;
      
      // If we found a result in Gogoanime search for "(Dub)", it likely has dub
      if (gogoSearch && gogoSearch.results && gogoSearch.results.length > 0) {
        hasDub = true;
      } else if (info && info.hasDub) {
        // Some Consumet providers might already have this info
        hasDub = true;
      }

    } catch (err) {
      console.error("Dub check error:", err);
      const fallback = { anilistId, hasSub: true, hasDub: false, subCount: 0, dubCount: 0 };
      cache.set(anilistId, { data: fallback, timestamp: Date.now() });
      res.set("Cache-Control", "public, max-age=3600");
      return res.json(fallback);
    }

    const result = {
      anilistId,
      hasSub: true,
      hasDub: hasDub,
      subCount: episodes,
      dubCount: hasDub ? episodes : 0,
    };

    cache.set(anilistId, { data: result, timestamp: Date.now() });
    res.set("Cache-Control", "public, max-age=3600");
    return res.json(result);
  } catch {
    return res.status(500).json({
      error: "Failed to check dub availability",
      hasSub: true,
      hasDub: true,
    });
  }
});

app.get("/api/recent-dub", async (req, res) => {
  try {
    const gogo = new ANIME.Gogoanime();
    const data = await gogo.fetchRecentEpisodes(1, 2); // type 2 = Dub
    
    // Map Consumet results to AniList-like objects for frontend compatibility
    const results = data.results.map(item => ({
      id: item.id, // Consumet ID
      title: { 
        romaji: item.title,
        english: item.title 
      },
      coverImage: {
        large: item.image,
        extraLarge: item.image
      },
      episodes: item.episodeNumber,
      format: "TV",
      status: "RELEASING"
    }));

    res.json({ media: results });
  } catch (err) {
    console.error("Consumet recent-dub error:", err);
    res.status(500).json({ error: "Failed to fetch recent dubs" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`🚀 AniXO Server running on http://localhost:${PORT}`);
  console.log(`📡 Dub check endpoint: http://localhost:${PORT}/api/check-dub/:anilistId`);
});
