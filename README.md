***

# Who Said It? 🕵️‍♂️

A Wordle-style daily guessing game for Discord servers. The game presents a random message or image from your server's history, and players have 5 tries to guess which user sent it.

**Features:**
*   **Daily Puzzle:** A new message is selected every day (synced to midnight local time).
*   **Smart Hints:**
    *   **Rank:** Tells you if the target user has a higher or lower role hierarchy than your guess.
    *   **Join Date:** Tells you if the target joined the server earlier or later.
    *   **Shared Roles:** Highlights specific "Clue Roles" (e.g., games played, interests) shared between users.
*   **Shareable Results:** Generates an emoji grid (🟩⬆️⬇️) to share scores without spoiling the answer.
*   **Autocomplete:** Search by username, display name, or server nickname.

---

## How to Host This for Your Own Server

You can easily host this game for your friend group! You will need **Python** (to scrape the data) and a **GitHub account** (to host the website).

### Prerequisites
1.  **Python 3.8+** installed.
2.  **Node.js & npm** installed (for testing locally, though GitHub Actions handles the build online).
3.  A **Discord Bot Token** (Guide below).

---

### Step 1: Fork & Clone
1.  **Fork** this repository to your own GitHub account.
2.  Clone it to your local machine:
    ```bash
    git clone https://github.com/YOUR_USERNAME/who-said-it.git
    cd who-said-it
    ```

### Step 2: Create a Discord Bot
1.  Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2.  Click **New Application**, give it a name, and go to the **Bot** tab.
3.  **Reset Token** to get your Token (Save this!).
4.  **IMPORTANT:** Scroll down to **Privileged Gateway Intents** and enable:
    *   `Server Members Intent`
    *   `Message Content Intent`
5.  Invite the bot to your server using OAuth2 (Select `bot` scope and `Administrator` or `Read Messages/History` permissions).

### Step 3: Configure the Scraper
Open `generate_data.py` in a text editor. You need to fill in your specific server details in the `CONFIGURATION` section at the top:

```python
# ================= CONFIGURATION =================
TOKEN = 'YOUR_BOT_TOKEN_HERE'  # Paste your Bot Token inside the quotes
GUILD_ID = 123456789012345678  # Your Server ID (Right-click server icon -> Copy ID)

# Map human-readable names to Channel IDs
CHANNEL_MAP = {
    "general": 123456789,
    "memes": 987654321,
    "clips": 1122334455
}

# List your role names from HIGHEST rank to LOWEST rank
# Used to give "Higher/Lower" hints
RANK_ORDER = ["Admin", "Moderator", "OG", "Member"] 

# List specific roles you want to use as hints (e.g. games, hobbies)
CLUE_ROLES = ["Valorant", "League of Legends", "Artist", "Coder"]
# =================================================
```

### Step 4: Generate the Game Data
This script scrapes your server and creates the database (`public/game_data.json`) used by the website.

1.  Install the required library:
    ```bash
    pip install discord.py
    ```
2.  Run the script:
    ```bash
    python generate_data.py
    ```
    *Depending on how many messages you have, this may take a few minutes.*

### Step 5: Configure the Website
1.  Open `vite.config.js`.
2.  Change the `base` line to match your repository name:
    ```javascript
    base: '/YOUR-REPO-NAME/', 
    ```
3.  (Optional) Open `src/App.jsx` to tweak game settings:
    *   `MAX_GUESSES = 5` (Change difficulty)
    *   `WIN_MESSAGES` / `LOSE_MESSAGES` (Change flavor text)

### Step 6: Deploy to GitHub Pages
1.  Commit and push your changes (including the new `public/game_data.json`).
    *   *Note: Be careful not to commit your `generate_data.py` if it contains your actual Bot Token. It is recommended to use environment variables or a `.gitignore` if the repo is public.*
2.  Go to your repository on GitHub.
3.  Navigate to **Settings** > **Pages**.
4.  Under **Build and deployment**, select **GitHub Actions** as the source.
5.  The included `.github/workflows/deploy.yml` will automatically build and deploy your site.
6.  Once finished, your game will be live at `https://YOUR_USERNAME.github.io/YOUR-REPO-NAME/`!

---

## ⚠️ Important Privacy Warning

**If you make this repository Public, anyone can download your `game_data.json`.**

This file contains message content, user IDs, and avatars from the channels you scraped.

---

## Updating the Game
To add new messages to the pool or update users (ranks, avatars, etc.):
1.  Run `python generate_data.py` locally.
2.  Push the updated `public/game_data.json` to GitHub.
3.  The site will automatically rebuild with the new data.