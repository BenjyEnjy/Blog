/**
 * Retrieves a single Blog Post.
 * @param id Numeric identifier of the Blog Post.
 * @returns Blog Post content.
 */
async function retrieveBlogPost(id) {
  let response;
  try {
    response = await fetch(`/blog/posts/${id}.json`);
  } catch (error) {
    throw new Error(
      `Failed to initiate retrieval of Blog Post '${id}': ${error}`
    );
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Failed to retrieve Blog Post '${id}': HTTP status code ${response.status}`
    );
  }

  let json;
  try {
    json = await response.json();
  } catch (error) {
    throw new Error(`Failed to parse Blog Post '${id}' as JSON: ${error}`);
  }

  return json;
}

/**
 *
 * @returns
 */
async function retrieveAllBlogPosts() {
  const BATCH_SIZE = 15;
  const MAX_POSTS_EVER = 1000;
  let blogPosts = [];

  for (
    let startingBlogPostId = 1;
    startingBlogPostId < MAX_POSTS_EVER;
    startingBlogPostId += BATCH_SIZE
  ) {
    const results = await Promise.allSettled(
      getIdBatch(startingBlogPostId, BATCH_SIZE).map((id) =>
        retrieveBlogPost(id)
      )
    );

    const resultValues = results
      .filter((x) => x.status === "fulfilled")
      .map((x) => x.value);

    blogPosts = blogPosts.concat(resultValues.filter((x) => x));

    if (resultValues.includes(null)) {
      break;
    }
  }

  return blogPosts;
}

/**
 *
 * @param startingFromId
 * @param batchSize
 * @returns
 */
function getIdBatch(startingFromId, batchSize) {
  return Array.from({ length: batchSize }).map((_, i) => startingFromId + i);
}

(async () => {
  // Retrieve all Blog posts
  const blogPosts = await retrieveAllBlogPosts();

  const d = document.createElement("pre");
  d.textContent = blogPosts.map((x) => JSON.stringify(x)).join(", ");
  document.body.appendChild(d);
})();
