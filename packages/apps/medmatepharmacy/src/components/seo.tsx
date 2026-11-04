import { DEFAULT_KEYWORDS, OG_IMAGE, SITE_URL, absoluteUrl, type PageMeta } from "@/lib/site";

export function Seo({
  title,
  description,
  path,
  type = "website",
  absolute,
  noindex,
  keywords,
  rss,
  canonical = true,
  article,
}: PageMeta) {
  const fullTitle = absolute ? title : `${title} | MedMate`;
  const url = absoluteUrl(path);
  const image = SITE_URL + OG_IMAGE.url;
  const keywordList = (keywords ?? DEFAULT_KEYWORDS).join(",");
  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywordList} />
      <meta name="robots" content={noindex ? (canonical ? "noindex, follow" : "noindex") : "index, follow"} />
      {noindex ? null : <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1" />}
      {canonical ? <link rel="canonical" href={url} /> : null}
      {rss ? <link rel="alternate" type="application/rss+xml" href={`${SITE_URL}/blog/rss.xml`} title="MedMate blog" /> : null}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="MedMate" />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content={String(OG_IMAGE.width)} />
      <meta property="og:image:height" content={String(OG_IMAGE.height)} />
      <meta property="og:image:alt" content={OG_IMAGE.alt} />
      <meta property="og:type" content={type} />
      {article ? (
        <>
          <meta property="article:published_time" content={article.publishedTime} />
          <meta property="article:modified_time" content={article.modifiedTime} />
          <meta property="article:section" content={article.section} />
          {article.tags.map((tag) => <meta key={tag} property="article:tag" content={tag} />)}
        </>
      ) : null}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </>
  );
}
