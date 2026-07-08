async function testConsumet() {
  const anilistId = 11061; // Hunter x Hunter 2011
  
  console.log(`Fetching data from Consumet for AniList ID: ${anilistId}...`);
  try {
    const response = await fetch(`https://api.consumet.org/meta/anilist/info/${anilistId}`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log("Consumet Response Data:");
    console.log(`Title: ${data.title?.english || data.title?.romaji}`);
    console.log(`Total Episodes (AniList): ${data.totalEpisodes}`);
    
    if (data.episodes && data.episodes.length > 0) {
       console.log(`Episodes found from provider: ${data.episodes.length}`);
       const dubEpisodes = data.episodes.filter(ep => ep.isDub || (ep.title && ep.title.toLowerCase().includes('dub')) || ep.type === "DUB" || ep.hasDub);
       console.log(`Has Dub? ${dubEpisodes.length > 0 ? "Yes" : "No"}`);
       
       console.log(`First Episode:`, data.episodes[0]);
    } else {
        console.log("No episodes data found in Consumet.");
    }

  } catch (error) {
    console.error("Failed to fetch from Consumet:", error.message);
  }
}

testConsumet();
