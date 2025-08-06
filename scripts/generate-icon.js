// This is a placeholder script for generating the Bello app icon
// In a real project, you would use a tool like @expo/configure-splash-screen
// or create the icon manually in a design tool

console.log('To create the Bello app icon:');
console.log('1. Use a design tool like Figma, Sketch, or Canva');
console.log('2. Create a 1024x1024px icon with the open sack design');
console.log('3. Use colors: Primary #2563EB, Background #FFFFFF');
console.log('4. Save as icon.png in assets/images/');
console.log('5. Generate different sizes for iOS/Android using expo-cli');
console.log('');
console.log('Icon design elements:');
console.log('- Open burlap sack with rolled-down top');
console.log('- Small coins/items spilling out the top');
console.log('- Simple, clean design that works at small sizes');
console.log('- Brand color (#2563EB) with light background');

// Simple SVG template for the icon
const iconSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#EFF6FF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FFFFFF;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1024" height="1024" fill="url(#bg)" rx="180"/>
  
  <!-- Sack body -->
  <path d="M256 384C256 362 274 344 296 344H728C750 344 768 362 768 384V768C768 825 722 872 664 872H360C302 872 256 825 256 768V384Z" fill="#2563EB" opacity="0.2"/>
  
  <!-- Sack opening -->
  <path d="M192 320C192 298 210 280 232 280H792C814 280 832 298 832 320V384C832 406 814 424 792 424H232C210 424 192 406 192 384V320Z" fill="#2563EB"/>
  
  <!-- Sack outline -->
  <path d="M256 384V768C256 825 302 872 360 872H664C722 872 768 825 768 768V384M192 320C192 298 210 280 232 280H792C814 280 832 298 832 320V384C832 406 814 424 792 424H232C210 424 192 406 192 384V320Z" stroke="#2563EB" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  
  <!-- Coins spilling out -->
  <circle cx="640" cy="200" r="32" fill="#2563EB" opacity="0.6"/>
  <circle cx="720" cy="240" r="24" fill="#2563EB" opacity="0.4"/>
  <circle cx="560" cy="160" r="20" fill="#2563EB" opacity="0.5"/>
  <circle cx="680" cy="160" r="16" fill="#2563EB" opacity="0.7"/>
  
  <!-- Sack tie -->
  <path d="M424 280V200C424 178 442 160 464 160H560C582 160 600 178 600 200V280" stroke="#2563EB" stroke-width="24" stroke-linecap="round" fill="none"/>
</svg>
`;

console.log('\nSVG template saved. Convert this to PNG for app icon.');
