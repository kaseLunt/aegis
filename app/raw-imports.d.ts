// Vite `?raw` imports resolve to the file's text at build time (W5 S6 plan §3): the
// Workers runtime has no filesystem, so fixture bytes are bundled at build. Byte identity
// holds because `.gitattributes` marks data/** -text (no eol translation, ever).
declare module "*?raw" {
  const text: string;
  export default text;
}
