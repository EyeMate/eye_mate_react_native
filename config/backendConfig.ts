// Backend Configuration
// Update this with your computer's IP address

export const BACKEND_CONFIG = {
  // Florence-2 backend base URL (deployed server)
  BASE_URL: 'http://20.19.32.74:8000',
  ENDPOINT: '/infer',
  
  // Full URL
  get FULL_URL() {
    return `${this.BASE_URL}${this.ENDPOINT}`;
  },
  
  // Analysis prompt (Florence-2 compatible)
PROMPT: 'Describe in detail what you see in this image, including objects, colors, and their positions.',
  
  // Delay between requests (in milliseconds)
  REQUEST_DELAY: 500,
};

// If you redeploy the backend, update BASE_URL with the new host (e.g. http://<ip>:<port>)
