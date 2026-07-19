# Michaël Vandenbulcke — Systems Field Notes theme

`mvdb` is the first-party Hugo theme for [mvdb.io](https://mvdb.io/). It has no runtime dependency on PaperMod or another theme.

## Structure

- `layouts/_default/` owns the base, home/list, taxonomy, and article views.
- `layouts/partials/` contains the document head, SEO/social metadata, navigation, article helpers, and footer behavior.
- `layouts/shortcodes/figure.html` supports local page-bundle images, captions, intrinsic dimensions, and the legacy `#center` suffix.
- `assets/css/` is deliberately ordered: tokens/base, header, home, lists/taxonomy, article/content, syntax, footer/utilities, then responsive rules. `head.html` concatenates, minifies, and fingerprints those files with Hugo Pipes.
- Hugo's built-in RSS and sitemap templates remain active; the theme supplies the production-aware `robots.txt` template.

## Integration

Set `theme: mvdb` in the site configuration. Root-level `layouts/` and matching root assets override theme files in Hugo, so remove the old editorial overrides after comparing a clean theme build. PaperMod and its submodule can then be removed.

The theme expects the existing site parameters (`author`, `description`, `images`, `mainSections`, `DateFormat`, theme controls, social icons, and article display flags). Homepage curation is opt-in through `featured: true` and `featuredOrder` in post front matter. A `lastmod` at least 24 hours after `date` produces a visible “Reviewed” item.

## Maintenance

Keep component rules in their existing asset file and preserve the numeric prefixes: the pipeline order is part of the cascade. Site-specific head or footer additions can be placed in theme overrides for `partials/extend_head.html` and `partials/extend_footer.html`.

The migration was informed by the behavior of the MIT-licensed [hugo-PaperMod](https://github.com/adityatelange/hugo-PaperMod) theme by Aditya Telange; this implementation and its assets are self-contained. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
