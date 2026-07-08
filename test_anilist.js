const ANIME_QUERY = `
  query ($page: Int, $sort: [MediaSort], $status_in: [MediaStatus], $seasonYear: Int, $season: MediaSeason) {
    Page(page: $page, perPage: 15) {
      media(type: ANIME, sort: $sort, status_in: $status_in, isAdult: false, seasonYear: $seasonYear, season: $season) {
        id
        title { romaji english native }
        format
        status
        episodes
        seasonYear
        popularity
      }
    }
  }
`;

const currentVars = {
  page: 1,
  sort: ["END_DATE_DESC"],
  status_in: ["FINISHED"]
};

const trendingFinishedVars = {
  page: 1,
  sort: ["TRENDING_DESC"],
  status_in: ["FINISHED"]
};

async function runQuery(vars) {
  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        query: ANIME_QUERY,
        variables: vars,
      }),
    });

    const data = await response.json();
    if (data.errors) {
      console.error(data.errors);
      return;
    }
    const mediaList = data?.data?.Page?.media || [];
    mediaList.slice(0, 10).forEach((anime, index) => {
      console.log(`${index + 1}. ${anime.title.english || anime.title.romaji} (Pop: ${anime.popularity})`);
    });
  } catch (error) {
    console.error(error.message);
  }
}

async function main() {
    console.log("=== Original Logic (END_DATE_DESC) ===");
    await runQuery(currentVars);
    
    console.log("\n=== Proposed Logic (TRENDING_DESC + FINISHED) ===");
    await runQuery(trendingFinishedVars);
}

main();
