async function testAnify() {
  const anilistId = 11061; // Hunter x Hunter 2011
  
  console.log(`Fetching data from Anify for AniList ID: ${anilistId}...`);
  try {
    const response = await fetch(`https://api.anify.tv/episodes/${anilistId}`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log("Anify Response Data:");
    // The data usually contains providers and their episodes.
    if (Array.isArray(data)) {
        data.forEach(provider => {
            console.log(`\nProvider: ${provider.providerId}`);
            if (provider.episodes && provider.episodes.data) {
                console.log(`Has Sub? ${provider.episodes.hasSub}`);
                console.log(`Has Dub? ${provider.episodes.hasDub}`);
            } else if (provider.episodes) {
                 // newer anify format
                console.log(`Episodes found: ${provider.episodes.length}`);
                // check first episode for sub/dub flags
                if (provider.episodes.length > 0) {
                     console.log(`First episode hasDub: ${provider.episodes[0].hasDub}`);
                }
            }
        });
    } else {
        console.log(JSON.stringify(data).slice(0, 500) + "...");
    }

  } catch (error) {
    console.error("Failed to fetch from Anify:", error.message);
  }
}

testAnify();
