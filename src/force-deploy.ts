// Emergency force deploy file
export const deployTimestamp = `${new Date().toISOString()}`;
console.log('Force deploy:', deployTimestamp);

// Force reload per production
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    console.log('Emergency fix applied at:', deployTimestamp);
  });
}
