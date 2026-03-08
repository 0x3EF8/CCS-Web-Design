# CCS Department Website

A static front-end website for the **College of Computer Studies (CCS)** department at **Saint Joseph College — Maasin City**.  
Built with plain HTML, CSS, and JavaScript — no frameworks or build tools required.

---

## Pages

| File | Description |
|------|-------------|
| `index.html` | Home — hero with officer showcase, news, testimonials |
| `pages/about.html` | About CCS — mission, vision, accreditations |
| `pages/programs.html` | BSCS, BSIT & ACT programs |
| `pages/faculty.html` | Faculty diamond grid + modals |
| `pages/enroll.html` | Enrollment guide |
| `pages/news.html` | News & events |
| `pages/contact.html` | Contact information |
| `pages/chat.html` | AI chatbot (Gemini-powered) |

## Assets

| Path | Description |
|------|-------------|
| `assets/css/styles.css` | Global stylesheet |
| `assets/css/chatbot.css` | Chatbot UI styles |
| `assets/js/main.js` | Boot screen, navbar, transitions, hero carousel |
| `assets/js/chatbot.js` | AI chatbot logic (Gemini API) |
| `assets/data/ccs-knowledge.js` | CCS knowledge base fed to the chatbot |
| `assets/images/` | Logos, faculty photos, officer photos |

---

## Setup — AI Chatbot (Gemini API Keys)

The chatbot in `pages/chat.html` uses the **Google Gemini API**.  
API keys are **not included** in this repo for security. Follow these steps to add yours:

### 1. Get a free API key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API key"** — it's free

### 2. Add the key to the project
Open `assets/js/chatbot.js` and find the `keys` array near the top of the file:

```js
window.CCS_CONFIG = {
  model:  'gemini-3-flash-preview',
  keys: [
    // Add your Gemini API key(s) here
    // e.g. 'AIzaSy...'
  ],
  ...
};
```

Replace the comment with your key(s):

```js
  keys: [
    'AIzaSyYOUR_KEY_HERE'
  ],
```

You can add **multiple keys** — the chatbot will automatically rotate between them if one hits the rate limit.

### 3. Done
Open `index.html` or `pages/chat.html` in a browser. No server needed.

> **Security note:** Never commit real API keys to a public repository.  
> If you accidentally push a key, revoke it immediately in [Google AI Studio](https://aistudio.google.com/app/apikey) and generate a new one.

---

## Usage

Open `index.html` directly in a browser — no server or build step needed.
