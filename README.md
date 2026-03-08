# CCS Department Website

A static front-end website for the **College of Computer Studies (CCS)** department at Saint Joseph College — Maasin City.  
Built with plain HTML, CSS, and JavaScript — no frameworks or build tools required.

---

## Pages

| File | Description |
|------|-------------|
| `index.html` | Home page — hero, officer showcase, news |
| `pages/about.html` | About CCS |
| `pages/programs.html` | BSCS, BSIT & ACT programs |
| `pages/faculty.html` | Faculty directory |
| `pages/enroll.html` | Enrollment guide |
| `pages/news.html` | News & events |
| `pages/contact.html` | Contact information |

## Assets

| Path | Description |
|------|-------------|
| `assets/css/styles.css` | Global stylesheet |
| `assets/css/chatbot.css` | Chatbot widget styles |
| `assets/js/main.js` | Navbar, transitions, officer carousel, counters |
| `assets/js/chatbot.js` | AI chatbot (Gemini-powered) |
| `assets/data/ccs-knowledge.js` | Chatbot knowledge base |
| `assets/images/` | Logos, faculty photos, officer photos |

---

## Chatbot — API Key Setup

The AI chatbot uses the **Google Gemini API**. You must supply your own key(s) before the chatbot will work.

### Steps

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey) and create one or more API keys.
2. Open `assets/js/chatbot.js`.
3. Find the `keys` array near the top of the file:

```js
window.CCS_CONFIG = {
  model: 'gemini-3-flash-preview',
  keys: [
    // Add your Gemini API key(s) here
    // e.g. 'AIzaSy...'
  ],
  ...
};
```

4. Add your key(s) inside the array:

```js
keys: [
  'AIzaSy_YOUR_KEY_HERE',
  // add more keys for automatic rotation on rate-limit
],
```

> **Security note:** Never commit real API keys to a public repository.  
> Consider using a backend proxy or environment variable injection for production deployments.

---

## Usage

Open `index.html` directly in a browser — no server needed.  
For the chatbot to function, add your Gemini API key(s) as described above.
