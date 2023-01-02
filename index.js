const PATH = window.location.hostname.includes("github.io") ? "/blog" : "";

/**
 * Retrieves a single Blog Post metadata.
 * @param id Numeric identifier of the Blog Post.
 * @returns Blog Post metadata.
 */
async function retrieveBlogPostMetadata(id) {
  if (!id) {
    throw new Error(`No id specified`);
  }

  let response;
  try {
    response = await fetch(`${PATH}/posts/${id}/metadata.json`);
  } catch (error) {
    throw new Error(`Failed to initiate retrieval of Blog Post '${id}' metadata: ${error}`);
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to retrieve Blog Post '${id}' metadata: HTTP status code ${response.status}`);
  }

  let json;
  try {
    json = await response.json();
  } catch (error) {
    throw new Error(`Failed to parse Blog Post '${id}' metadata as JSON: ${error}`);
  }

  return { ...json, id };
}

/**
 * Retrieves a single Blog Post content.
 * @param id Numeric identifier of the Blog Post.
 * @returns Blog Post content.
 */
async function retrieveBlogPostContent(id) {
  if (!id) {
    throw new Error(`No id specified`);
  }

  let response;
  try {
    response = await fetch(`${PATH}/posts/${id}/content.md`);
  } catch (error) {
    throw new Error(`Failed to initiate retrieval of Blog Post '${id}' content: ${error}`);
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to retrieve Blog Post '${id}' content: HTTP status code ${response.status}`);
  }

  let content;
  try {
    content = await response.text();
  } catch (error) {
    throw new Error(`Failed to parse Blog Post '${id}' content as text: ${error}`);
  }

  return content;
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
    const results = await Promise.allSettled(getIdBatch(startingBlogPostId, BATCH_SIZE).map((id) => retrieveBlogPostMetadata(id)));

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
function appendBlogPostElement(blogPost) {
  if (!blogPost) {
    throw new Error(`Blog post empty`);
  }

  const blogPostContainer = document.querySelector("#blog-post-container");

  const blogPostTemplate = document.querySelector("template#blog-post");
  const blogPostTagTemplate = document.querySelector("template#blog-post-tag");

  const blogPostElement = blogPostTemplate.content.cloneNode(true);

  const titleElement = blogPostElement.querySelector(".blog-post-title");
  titleElement.textContent = blogPost.title || "(Untitled)";

  const timestampElement = blogPostElement.querySelector(".blog-post-timestamp");
  const timestampDate = new Date(blogPost.timestamp);
  timestampElement.textContent = `${timestampDate.toLocaleDateString(undefined, { month: "short" })} ${timestampDate.toLocaleDateString(undefined, {
    day: "2-digit",
  })}`;

  const categoryElement = blogPostElement.querySelector(".blog-post-category");
  categoryElement.textContent = blogPost.category || "General";

  const contentElement = blogPostElement.querySelector(".blog-post-content");
  contentElement.innerHTML = window.markdownit().render(blogPost.content || "");

  const tagsElement = blogPostElement.querySelector(".blog-post-tags");

  if (Array.isArray(blogPost.tags)) {
    blogPost.tags.forEach((tag) => {
      const blogPostTagElement = blogPostTagTemplate.content.cloneNode(true);

      const nameElement = blogPostTagElement.querySelector(".blog-post-tag-name");
      nameElement.textContent = tag;

      tagsElement.appendChild(blogPostTagElement);
    });
  }

  blogPostContainer.appendChild(blogPostElement);
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
    linkElement.href = `${PATH}/posts?id=${blogPostMetadata.id}-${(blogPostMetadata.title || "")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/gi, "")}`;

    const titleElement = blogPostElement.querySelector(".blog-post-summary-title");
    titleElement.textContent = blogPostMetadata.title || "(Untitled)";

    const timestampElement = blogPostElement.querySelector(".blog-post-summary-timestamp");
    const timestampDate = new Date(blogPostMetadata.timestamp);
    timestampElement.textContent = `${timestampDate.toLocaleDateString(undefined, { month: "short" })} ${timestampDate.toLocaleDateString(undefined, {
      day: "2-digit",
    })}`;

    const categoryElement = blogPostElement.querySelector(".blog-post-summary-category");
    categoryElement.textContent = blogPostMetadata.category || "General";

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
