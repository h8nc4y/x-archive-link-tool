const ALLOWED_HOSTS = new Set(["x.com", "twitter.com", "mobile.twitter.com"]);
const USERNAME_PATTERN = /^[A-Za-z0-9_]{1,15}$/;
const POST_ID_PATTERN = /^[0-9]{1,19}$/;

export class XPostUrlValidationError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "XPostUrlValidationError";
    this.code = code;
  }
}

export function parseXPostUrl(input) {
  if (typeof input !== "string" || input.trim() === "") {
    throw new XPostUrlValidationError("URL must be a non-empty string.", "invalid_input");
  }

  let url;
  try {
    url = new URL(input.trim());
  } catch {
    throw new XPostUrlValidationError("URL is not valid.", "invalid_url");
  }

  if (url.protocol !== "https:") {
    throw new XPostUrlValidationError("URL protocol must be https.", "invalid_protocol");
  }

  if (!ALLOWED_HOSTS.has(url.hostname)) {
    throw new XPostUrlValidationError("URL host is not allowed.", "invalid_host");
  }

  const parts = url.pathname.split("/");
  if (parts.length === 5 && parts[0] === "" && parts[1] === "i" && parts[2] === "web" && parts[3] === "status") {
    const postId = parts[4];
    if (!POST_ID_PATTERN.test(postId)) {
      throw new XPostUrlValidationError("Post ID is not valid.", "invalid_post_id");
    }

    return {
      username: "未取得",
      postId,
      canonicalUrl: `https://x.com/i/web/status/${postId}`
    };
  }

  if (parts.length !== 4 || parts[0] !== "" || parts[2] !== "status") {
    throw new XPostUrlValidationError("URL path must be /{username}/status/{postId}.", "invalid_path");
  }

  const username = parts[1];
  const postId = parts[3];

  if (!USERNAME_PATTERN.test(username)) {
    throw new XPostUrlValidationError("Username is not valid.", "invalid_username");
  }

  if (!POST_ID_PATTERN.test(postId)) {
    throw new XPostUrlValidationError("Post ID is not valid.", "invalid_post_id");
  }

  return {
    username,
    postId,
    canonicalUrl: `https://x.com/${username}/status/${postId}`
  };
}
