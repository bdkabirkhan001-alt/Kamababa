// FSI MMS WordPress REST API
// If your videos are normal WordPress Posts, keep this as-is.
// If your site uses a custom post type, change /posts/ to that endpoint.
const API_BASE = "https://fsimms.cam/wp-json/wp/v2/posts";
const PER_PAGE = 12;

// Optional: If your post data uses an ACF field for the video URL,
// put its REST API field name here, e.g. "video_url".
// Leave empty if you use the normal post content/embed.
const VIDEO_FIELD = "";
