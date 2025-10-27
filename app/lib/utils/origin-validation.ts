export function isOriginAllowed(origin: string | null, requestUrl: string): boolean {
  if (!origin) return true; // Allow requests without origin
  
  const allowedOrigins = [
    process.env.NEXTAUTH_URL,
    process.env.ADMIN_URL,
    new URL(requestUrl).origin,
  ].filter(Boolean);
  
  // Also add HTTP/HTTPS variants
  const expandedOrigins = [...allowedOrigins];
  allowedOrigins.forEach(url => {
    if (url!.startsWith('https://')) {
      expandedOrigins.push(url!.replace('https://', 'http://'));
    } else if (url!.startsWith('http://')) {
      expandedOrigins.push(url!.replace('http://', 'https://'));
    }
  });
  
  console.log(`[ORIGIN DEBUG] Checking origin: ${origin} against allowed: ${expandedOrigins.join(', ')}`);
  
  const isAllowed = expandedOrigins.some(allowedOrigin => 
    origin === allowedOrigin || origin.startsWith(allowedOrigin!)
  );
  
  console.log(`[ORIGIN DEBUG] Origin allowed: ${isAllowed}`);
  
  return isAllowed;
}
