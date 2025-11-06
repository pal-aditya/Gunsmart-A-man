declare module '*.css' {
  // Use 'any' or 'unknown' if you expect to read exports, 
  // but typically CSS imports are for side-effects only.
  const content: any;
  export default content; 
}