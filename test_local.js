async function testLocalApi() {
  const anilistId = 11061; // Hunter x Hunter 2011
  // Aniko backend runs on 7860 in the background terminal
  const apiUrl = `http://localhost:7860/api/episodes/${anilistId}`;
  
  console.log(`Fetching data from aapke khud ke Aniko Backend se: ${apiUrl}...`);
  try {
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log("\nAapke API ka Response Data:");
    if (data.episodes && data.episodes.sub) {
        console.log(`Sub Episodes Count: ${data.episodes.sub.length}`);
    }
    if (data.episodes && data.episodes.dub) {
        console.log(`Dub Episodes Count: ${data.episodes.dub.length}`);
        
        if (data.episodes.dub.length > 0) {
            console.log("\nFirst Dub Episode Example:");
            const firstDub = data.episodes.dub[0];
            console.log(`  Title: ${firstDub.title}`);
            console.log(`  Episode Number: ${firstDub.number}`);
            console.log(`  hasDub Flag: ${firstDub.hasDub}`);
            console.log(`  hasSub Flag: ${firstDub.hasSub}`);
        }
    }

  } catch (error) {
    console.error("Failed to fetch from Local Aniko API:", error.message);
  }
}

testLocalApi();
