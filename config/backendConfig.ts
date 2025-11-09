// Backend Configuration
// Update this with your computer's IP address

export const BACKEND_CONFIG = {
  // Your computer's IP address (found with ifconfig)
  BASE_URL: 'http://192.168.1.14:8002',
  ENDPOINT: '/infer',
  
  // Full URL
  get FULL_URL() {
    return `${this.BASE_URL}${this.ENDPOINT}`;
  },
  
  // Analysis prompt (Florence-2 compatible)
  PROMPT: 'What do you see in this image?',
  
  // Delay between requests (in milliseconds)
  REQUEST_DELAY: 3000,
};

// Instructions for finding your IP:
// Windows: ipconfig
// Mac/Linux: ifconfig
// Look for "IPv4 Address" or "inet" under your WiFi/Ethernet adapter
// Example: 192.168.1.100, 10.0.0.50, etc.
