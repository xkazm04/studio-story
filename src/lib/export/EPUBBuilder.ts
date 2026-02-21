/**
 * EPUBBuilder - E-book Format Export
 *
 * Generates EPUB 3.0 compliant e-books for:
 * - Novel/prose export
 * - Readable script format
 * - Multi-chapter organization
 * - Cover image support
 * - Table of contents generation
 */

// JSZip is dynamically imported to avoid build issues if not installed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JSZipType = any;

// ============================================================================
// Types
// ============================================================================

export interface EPUBMetadata {
  title: string;
  author: string;
  language: string;
  identifier: string;  // ISBN or UUID
  publisher?: string;
  description?: string;
  subject?: string[];
  rights?: string;
  publicationDate?: string;
  modifiedDate?: string;
}

export interface EPUBChapter {
  id: string;
  title: string;
  content: string;  // HTML content
  order: number;
  fileName?: string;
}

export interface EPUBImage {
  id: string;
  fileName: string;
  mimeType: string;
  data: ArrayBuffer | Blob;
  isCover?: boolean;
}

export interface EPUBExportOptions {
  // Format
  format: 'epub' | 'mobi';
  epubVersion: '2.0' | '3.0';

  // Content
  includeCover: boolean;
  includeTableOfContents: boolean;
  includeChapterNumbers: boolean;

  // Styling
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  theme: 'light' | 'dark' | 'sepia';

  // Navigation
  generateLandmarks: boolean;
  generatePageList: boolean;
}

export interface EPUBGeneratorResult {
  blob: Blob;
  filename: string;
  chapterCount: number;
  wordCount: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_EPUB_OPTIONS: EPUBExportOptions = {
  format: 'epub',
  epubVersion: '3.0',
  includeCover: true,
  includeTableOfContents: true,
  includeChapterNumbers: true,
  fontFamily: 'Georgia, serif',
  fontSize: '1em',
  lineHeight: '1.6',
  theme: 'light',
  generateLandmarks: true,
  generatePageList: false,
};

const MIMETYPE = 'application/epub+zip';

// ============================================================================
// EPUB Structure Templates
// ============================================================================

const CONTAINER_XML = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

function generateOPF(
  metadata: EPUBMetadata,
  chapters: EPUBChapter[],
  images: EPUBImage[],
  options: EPUBExportOptions
): string {
  const identifier = metadata.identifier || `urn:uuid:${generateUUID()}`;
  const modifiedDate = metadata.modifiedDate || new Date().toISOString();

  const manifestItems: string[] = [];
  const spineItems: string[] = [];

  // Add stylesheet
  manifestItems.push('<item id="stylesheet" href="styles/main.css" media-type="text/css"/>');

  // Add cover if present
  const coverImage = images.find(img => img.isCover);
  if (coverImage && options.includeCover) {
    manifestItems.push(`<item id="cover-image" href="images/${coverImage.fileName}" media-type="${coverImage.mimeType}" properties="cover-image"/>`);
    manifestItems.push('<item id="cover" href="text/cover.xhtml" media-type="application/xhtml+xml"/>');
    spineItems.push('<itemref idref="cover" linear="no"/>');
  }

  // Add TOC if enabled
  if (options.includeTableOfContents) {
    manifestItems.push('<item id="toc" href="text/toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>');
    spineItems.push('<itemref idref="toc"/>');
  }

  // Add chapters
  for (const chapter of chapters) {
    const fileName = chapter.fileName || `chapter_${chapter.order.toString().padStart(3, '0')}.xhtml`;
    manifestItems.push(`<item id="${chapter.id}" href="text/${fileName}" media-type="application/xhtml+xml"/>`);
    spineItems.push(`<itemref idref="${chapter.id}"/>`);
  }

  // Add other images
  for (const image of images.filter(img => !img.isCover)) {
    manifestItems.push(`<item id="${image.id}" href="images/${image.fileName}" media-type="${image.mimeType}"/>`);
  }

  // Add NCX for EPUB 2.0 compatibility
  manifestItems.push('<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>');

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="${options.epubVersion}" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:identifier id="BookId">${identifier}</dc:identifier>
    <dc:title>${escapeXML(metadata.title)}</dc:title>
    <dc:creator>${escapeXML(metadata.author)}</dc:creator>
    <dc:language>${metadata.language}</dc:language>
    ${metadata.publisher ? `<dc:publisher>${escapeXML(metadata.publisher)}</dc:publisher>` : ''}
    ${metadata.description ? `<dc:description>${escapeXML(metadata.description)}</dc:description>` : ''}
    ${metadata.subject?.map(s => `<dc:subject>${escapeXML(s)}</dc:subject>`).join('\n    ') || ''}
    ${metadata.rights ? `<dc:rights>${escapeXML(metadata.rights)}</dc:rights>` : ''}
    ${metadata.publicationDate ? `<dc:date>${metadata.publicationDate}</dc:date>` : ''}
    <meta property="dcterms:modified">${modifiedDate}</meta>
  </metadata>
  <manifest>
    ${manifestItems.join('\n    ')}
  </manifest>
  <spine toc="ncx">
    ${spineItems.join('\n    ')}
  </spine>
</package>`;
}

function generateNCX(
  metadata: EPUBMetadata,
  chapters: EPUBChapter[]
): string {
  const navPoints = chapters.map((chapter, index) => {
    const fileName = chapter.fileName || `chapter_${chapter.order.toString().padStart(3, '0')}.xhtml`;
    return `
    <navPoint id="navPoint-${index + 1}" playOrder="${index + 1}">
      <navLabel>
        <text>${escapeXML(chapter.title)}</text>
      </navLabel>
      <content src="text/${fileName}"/>
    </navPoint>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${metadata.identifier || generateUUID()}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${escapeXML(metadata.title)}</text>
  </docTitle>
  <docAuthor>
    <text>${escapeXML(metadata.author)}</text>
  </docAuthor>
  <navMap>${navPoints}
  </navMap>
</ncx>`;
}

function generateTOC(
  metadata: EPUBMetadata,
  chapters: EPUBChapter[],
  options: EPUBExportOptions
): string {
  const tocItems = chapters.map(chapter => {
    const fileName = chapter.fileName || `chapter_${chapter.order.toString().padStart(3, '0')}.xhtml`;
    const displayTitle = options.includeChapterNumbers
      ? `Chapter ${chapter.order}: ${chapter.title}`
      : chapter.title;
    return `      <li><a href="${fileName}">${escapeXML(displayTitle)}</a></li>`;
  }).join('\n');

  const landmarks = options.generateLandmarks ? `
    <nav epub:type="landmarks" hidden="">
      <h2>Landmarks</h2>
      <ol>
        <li><a epub:type="toc" href="toc.xhtml">Table of Contents</a></li>
        ${chapters.length > 0 ? `<li><a epub:type="bodymatter" href="text/${chapters[0].fileName || 'chapter_001.xhtml'}">Start of Content</a></li>` : ''}
      </ol>
    </nav>` : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${metadata.language}">
<head>
  <meta charset="UTF-8"/>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="../styles/main.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
${tocItems}
    </ol>
  </nav>
${landmarks}
</body>
</html>`;
}

function generateCoverPage(metadata: EPUBMetadata, coverImage: EPUBImage): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${metadata.language}">
<head>
  <meta charset="UTF-8"/>
  <title>Cover</title>
  <link rel="stylesheet" type="text/css" href="../styles/main.css"/>
</head>
<body class="cover">
  <div class="cover-image">
    <img src="../images/${coverImage.fileName}" alt="Cover"/>
  </div>
</body>
</html>`;
}

function generateChapterXHTML(
  chapter: EPUBChapter,
  metadata: EPUBMetadata,
  options: EPUBExportOptions
): string {
  const displayTitle = options.includeChapterNumbers
    ? `Chapter ${chapter.order}: ${chapter.title}`
    : chapter.title;

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${metadata.language}">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeXML(displayTitle)}</title>
  <link rel="stylesheet" type="text/css" href="../styles/main.css"/>
</head>
<body>
  <section epub:type="chapter" id="${chapter.id}">
    <h1>${escapeXML(displayTitle)}</h1>
    ${chapter.content}
  </section>
</body>
</html>`;
}

function generateStylesheet(options: EPUBExportOptions): string {
  const themeColors = {
    light: { bg: '#ffffff', text: '#1a1a1a', heading: '#000000' },
    dark: { bg: '#1a1a1a', text: '#e0e0e0', heading: '#ffffff' },
    sepia: { bg: '#f4ecd8', text: '#5b4636', heading: '#3d2914' },
  };

  const colors = themeColors[options.theme];

  return `/* EPUB Stylesheet */
@charset "UTF-8";

/* Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Body */
body {
  font-family: ${options.fontFamily};
  font-size: ${options.fontSize};
  line-height: ${options.lineHeight};
  background-color: ${colors.bg};
  color: ${colors.text};
  padding: 1em;
  max-width: 40em;
  margin: 0 auto;
}

/* Headings */
h1, h2, h3, h4, h5, h6 {
  color: ${colors.heading};
  margin: 1.5em 0 0.5em;
  line-height: 1.2;
}

h1 {
  font-size: 2em;
  text-align: center;
  margin-top: 2em;
  margin-bottom: 1em;
}

h2 {
  font-size: 1.5em;
}

h3 {
  font-size: 1.25em;
}

/* Paragraphs */
p {
  margin: 0;
  text-indent: 1.5em;
}

p + p {
  margin-top: 0;
}

p.first, h1 + p, h2 + p, h3 + p {
  text-indent: 0;
}

/* Scene breaks */
.scene-break {
  text-align: center;
  margin: 2em 0;
  font-size: 1.5em;
}

.scene-break::before {
  content: "* * *";
}

/* Dialogue */
.dialogue {
  margin: 0.5em 0;
}

.speaker {
  font-weight: bold;
  text-transform: uppercase;
  margin-top: 1em;
}

.dialogue-text {
  margin-left: 2em;
}

/* Stage directions / action */
.action {
  margin: 1em 0;
  font-style: italic;
}

/* Cover page */
.cover {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.cover-image {
  text-align: center;
}

.cover-image img {
  max-width: 100%;
  max-height: 100vh;
  object-fit: contain;
}

/* Table of Contents */
nav#toc h1 {
  margin-bottom: 1em;
}

nav#toc ol {
  list-style-type: none;
  padding-left: 0;
}

nav#toc li {
  margin: 0.5em 0;
}

nav#toc a {
  color: inherit;
  text-decoration: none;
}

nav#toc a:hover {
  text-decoration: underline;
}

/* Blockquotes */
blockquote {
  margin: 1em 2em;
  padding-left: 1em;
  border-left: 3px solid ${colors.text}40;
  font-style: italic;
}

/* Emphasis */
em, i {
  font-style: italic;
}

strong, b {
  font-weight: bold;
}

/* Images */
img {
  max-width: 100%;
  height: auto;
}

figure {
  margin: 1em 0;
  text-align: center;
}

figcaption {
  font-size: 0.9em;
  font-style: italic;
  margin-top: 0.5em;
}

/* Page breaks */
.page-break {
  page-break-before: always;
}
`;
}

// ============================================================================
// EPUB Builder Class
// ============================================================================

export class EPUBBuilder {
  private options: EPUBExportOptions;
  private metadata: EPUBMetadata | null = null;
  private chapters: EPUBChapter[] = [];
  private images: EPUBImage[] = [];

  constructor(options: Partial<EPUBExportOptions> = {}) {
    this.options = { ...DEFAULT_EPUB_OPTIONS, ...options };
  }

  /**
   * Set book metadata
   */
  setMetadata(metadata: EPUBMetadata): EPUBBuilder {
    this.metadata = metadata;
    return this;
  }

  /**
   * Add a chapter
   */
  addChapter(chapter: EPUBChapter): EPUBBuilder {
    this.chapters.push(chapter);
    return this;
  }

  /**
   * Add multiple chapters
   */
  addChapters(chapters: EPUBChapter[]): EPUBBuilder {
    this.chapters.push(...chapters);
    return this;
  }

  /**
   * Add an image
   */
  addImage(image: EPUBImage): EPUBBuilder {
    this.images.push(image);
    return this;
  }

  /**
   * Set cover image
   */
  setCoverImage(
    fileName: string,
    mimeType: string,
    data: ArrayBuffer | Blob
  ): EPUBBuilder {
    this.images.push({
      id: 'cover-image',
      fileName,
      mimeType,
      data,
      isCover: true,
    });
    return this;
  }

  /**
   * Build the EPUB file
   */
  async build(): Promise<EPUBGeneratorResult> {
    if (!this.metadata) {
      throw new Error('Metadata is required. Call setMetadata() first.');
    }

    if (this.chapters.length === 0) {
      throw new Error('At least one chapter is required. Call addChapter() first.');
    }

    // Sort chapters by order
    const sortedChapters = [...this.chapters].sort((a, b) => a.order - b.order);

    // Assign filenames
    sortedChapters.forEach((chapter, index) => {
      if (!chapter.fileName) {
        chapter.fileName = `chapter_${(index + 1).toString().padStart(3, '0')}.xhtml`;
      }
    });

    // Dynamically import JSZip
    let JSZipModule: JSZipType;
    try {
      // @ts-expect-error - JSZip may not be installed
      JSZipModule = (await import(/* webpackIgnore: true */ 'jszip')).default;
    } catch {
      throw new Error('JSZip library is required for EPUB export. Install it with: npm install jszip');
    }

    // Create ZIP structure
    const zip = new JSZipModule();

    // Add mimetype (must be first, uncompressed)
    zip.file('mimetype', MIMETYPE, { compression: 'STORE' });

    // Add META-INF
    zip.file('META-INF/container.xml', CONTAINER_XML);

    // Add OEBPS content
    const oebps = zip.folder('OEBPS')!;

    // Add OPF file
    oebps.file('content.opf', generateOPF(this.metadata, sortedChapters, this.images, this.options));

    // Add NCX file
    oebps.file('toc.ncx', generateNCX(this.metadata, sortedChapters));

    // Add stylesheet
    const styles = oebps.folder('styles')!;
    styles.file('main.css', generateStylesheet(this.options));

    // Add text content
    const text = oebps.folder('text')!;

    // Add TOC
    if (this.options.includeTableOfContents) {
      text.file('toc.xhtml', generateTOC(this.metadata, sortedChapters, this.options));
    }

    // Add cover page
    const coverImage = this.images.find(img => img.isCover);
    if (coverImage && this.options.includeCover) {
      text.file('cover.xhtml', generateCoverPage(this.metadata, coverImage));
    }

    // Add chapters
    for (const chapter of sortedChapters) {
      const content = generateChapterXHTML(chapter, this.metadata, this.options);
      text.file(chapter.fileName!, content);
    }

    // Add images
    if (this.images.length > 0) {
      const imagesFolder = oebps.folder('images')!;
      for (const image of this.images) {
        imagesFolder.file(image.fileName, image.data);
      }
    }

    // Generate blob
    const blob = await zip.generateAsync({
      type: 'blob',
      mimeType: MIMETYPE,
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });

    // Calculate word count
    const wordCount = sortedChapters.reduce((count, chapter) => {
      const text = chapter.content.replace(/<[^>]*>/g, '');
      return count + text.split(/\s+/).length;
    }, 0);

    const filename = sanitizeFilename(this.metadata.title) + '.epub';

    return {
      blob,
      filename,
      chapterCount: sortedChapters.length,
      wordCount,
    };
  }

  /**
   * Reset the builder
   */
  reset(): EPUBBuilder {
    this.metadata = null;
    this.chapters = [];
    this.images = [];
    return this;
  }

  /**
   * Update options
   */
  setOptions(options: Partial<EPUBExportOptions>): EPUBBuilder {
    this.options = { ...this.options, ...options };
    return this;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase();
}

/**
 * Convert script blocks to EPUB chapters
 */
export function convertToEPUBChapters(
  scenes: Array<{
    id: string;
    name: string;
    blocks: Array<{
      type: string;
      content: string;
      speaker?: string;
    }>;
  }>
): EPUBChapter[] {
  return scenes.map((scene, index) => {
    const contentParts: string[] = [];

    for (const block of scene.blocks) {
      switch (block.type) {
        case 'scene-header':
          // Already used as chapter title
          break;
        case 'description':
        case 'content':
          contentParts.push(`<p>${escapeXML(block.content)}</p>`);
          break;
        case 'dialogue':
          if (block.speaker) {
            contentParts.push(`<p class="speaker">${escapeXML(block.speaker)}</p>`);
          }
          contentParts.push(`<p class="dialogue-text">${escapeXML(block.content)}</p>`);
          break;
        case 'direction':
          contentParts.push(`<p class="action">${escapeXML(block.content)}</p>`);
          break;
      }
    }

    return {
      id: `chapter-${scene.id}`,
      title: scene.name,
      content: contentParts.join('\n'),
      order: index + 1,
    };
  });
}

// Export singleton builder
export const epubBuilder = new EPUBBuilder();

// Export default options
export { DEFAULT_EPUB_OPTIONS };
