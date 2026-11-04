import { AREAS } from "@/content/areas";
import { POSTS } from "@/content/blog";
import { CATEGORIES, PRODUCTS, productHref } from "@/content/catalogue";

export function sitePaths() {
  return [
    "/",
    "/download",
    "/premium",
    "/medicines",
    "/doctor-consultation",
    "/upload-prescription",
    "/pharmacy-partner",
    "/pharmacy-partner/thanks",
    "/blog",
    "/bengaluru",
    "/about",
    "/contact",
    "/contact/thanks",
    "/waitlist/thanks",
    "/search",
    "/privacy",
    "/terms",
    ...AREAS.map((area) => `/bengaluru/${area.slug}`),
    ...CATEGORIES.map((category) => `/medicines/${category.slug}`),
    ...POSTS.map((post) => `/blog/${post.slug}`),
    ...PRODUCTS.map((product) => productHref(product)),
  ];
}

export function htmlFile(urlPath: string) {
  if (urlPath === "/") return "index.html";
  return `${urlPath.replace(/^\//, "")}.html`;
}
