const PATH = window.location.hostname === "localhost" ? "" : "/blog";

/**
 * Retrieves a single Blog Post.
 * @param id Numeric identifier of the Blog Post.
 * @returns Blog Post content.
 */
async function retrieveBlogPost(id) {
  let response;
  try {
    response = await fetch(`${PATH}/posts/${id}/metadata.json`);
  } catch (error) {
    throw new Error(`Failed to initiate retrieval of Blog Post '${id}': ${error}`);
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to retrieve Blog Post '${id}': HTTP status code ${response.status}`);
  }

  let json;
  try {
    json = await response.json();
  } catch (error) {
    throw new Error(`Failed to parse Blog Post '${id}' as JSON: ${error}`);
  }

  return { ...json, id };
}

/**
 *
 * @returns
 */
async function retrieveAllBlogPostMetadatas() {
  const BATCH_SIZE = 15;
  const MAX_POSTS_EVER = 1000;
  let blogPosts = [];

  for (let startingBlogPostId = 1; startingBlogPostId < MAX_POSTS_EVER; startingBlogPostId += BATCH_SIZE) {
    const results = await Promise.allSettled(getIdBatch(startingBlogPostId, BATCH_SIZE).map((id) => retrieveBlogPost(id)));

    const resultValues = results.filter((x) => x.status === "fulfilled").map((x) => x.value);

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

/**
 *
 */
function appendBlogPostSummaryElements(blogPostMetadatas) {
  const blogPostSummaryContainer = document.querySelector("#blog-post-summaries");

  const blogPostSummaryTemplate = document.querySelector("template#blog-post-summary");
  const blogPostSummaryTagTemplate = document.querySelector("template#blog-post-summary-tag");

  blogPostMetadatas.forEach((blogPostMetadata) => {
    const blogPostElement = blogPostSummaryTemplate.content.cloneNode(true);

    const linkElement = blogPostElement.querySelector(".blog-post-summary-link");
    linkElement.href = `${PATH}/posts/${blogPostMetadata.id}`;

    const titleElement = blogPostElement.querySelector(".blog-post-summary-title");
    titleElement.textContent = blogPostMetadata.title || "(Untitled)";

    const categoryElement = blogPostElement.querySelector(".blog-post-summary-category");
    categoryElement.category = blogPostMetadata.category || "General";

    const tagsElement = blogPostElement.querySelector(".blog-post-summary-tags");

    if (Array.isArray(blogPostMetadata.tags)) {
      blogPostMetadata.tags.forEach((tag) => {
        const blogPostTagElement = blogPostSummaryTagTemplate.content.cloneNode(true);

        const nameElement = blogPostTagElement.querySelector(".blog-post-summary-tag-name");
        nameElement.textContent = tag;

        tagsElement.appendChild(blogPostTagElement);
      });
    }

    blogPostSummaryContainer.appendChild(blogPostElement);
  });
}


(async () => {
  // Retrieve all Blog Posts
  const blogPostMetadatas = await retrieveAllBlogPostMetadatas();

  // Add each Blog Post to the page
  appendBlogPostSummaryElements(blogPostMetadatas);
})();
