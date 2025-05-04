# 📧 Gmail Agent 🤖

A Node.js/TypeScript project that uses the Gmail API and OpenAI to summarize unread emails and draft polite replies automatically.

## 🚀 Setup Instructions

### 1. Clone the Repository

```sh
git clone https://github.com/punyajain1/AI_Gmail_Agent.git
cd AI_Gmail_Agent
```

### 2. Install Dependencies

```sh
npm install
```

### 3. Configure Environment Variables

- Copy `.env.example` to `.env`:

```sh
cp .env.example .env
```

- Fill in your OpenAI API key and base URL in the `.env` file.

### 4. Set Up Gmail API Credentials

- Go to the [Google Cloud Console](https://console.cloud.google.com/) 🌐
- Create a new project (or use an existing one).
- Enable the Gmail API for your project.
- Create OAuth 2.0 credentials (Desktop client) 🖥️
- Download the `client.json` file and place it in the project root directory.

### 5. Run the Project

```sh
npm run dev
```

- On first run, you will see a URL in the terminal 🔗
- Open the URL in your browser, log in with your Gmail account, and allow access.
- Copy the `code` parameter from the redirected URL and paste it into the CLI prompt.
- This will generate a `token.json` file for future authentication 🔑

### 6. Usage

- The script will summarize unread emails and save them as a CSV file 📄
- It will also draft polite replies for each unread email and save them to your Gmail Drafts folder ✉️

---

**Note:**  
- Do not share your `.env` or `client.json` files ⚠️
- Your Gmail and OpenAI credentials are sensitive.  
- The `client.json` and `.env` files are already in `.gitignore`.

---
