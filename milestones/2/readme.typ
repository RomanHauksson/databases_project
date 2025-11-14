#set document(
  title: [Library System Programming Project]
)

#title()

#show link: underline

Our project is written in #link("https://nextjs.org")[Next.js], a meta-framework for #link("http://react.dev/")[React]. We've already implemented some of the GUI functionality, which you can try out at the following URL: https://databases-project.vercel.app.

= Functionality

Each of the functions required for Milestone 2 are implemented as server actions, which are written in #link("https://www.typescriptlang.org/")[TypeScript] and stored in `/src/actions/`. When our GUI calls these functions, they get executed in a #link("https://nodejs.org/en")[Node] runtime by our hosting platform #link("https://vercel.com/")[Vercel] and query our Postgres database.


We're using #link("https://orm.drizzle.team/")[Drizzle] for object-relational mapping. It has very similar syntax to basic SQL, but it enables us to write both queries and surrounding logic in TypeScript, while preserving type safety.

= Building the project

First, #link("https://nodejs.org/en/download")[install Node.js] if you haven't already. Verify that you're using Node version 24, which is the latest LTS version, using #link("https://github.com/nvm-sh/nvm")[Node Version Manager].

```bash
# Download and install Node.js:
nvm install 24
# Verify the Node.js version:
node -v # Should print "v24.11.1".
# Verify npm version:
npm -v # Should print "11.6.2".
```

Install the Node dependencies for this project.

```bash
npm install
```

This command installs the following dependencies listed in `/package.json`.

```json
  "dependencies": {
    "@neondatabase/serverless": "^1.0.2",
    "dotenv": "^17.2.3",
    "drizzle-orm": "^0.44.7",
    "next": "16.0.1",
    "react": "19.2.0",
    "react-dom": "19.2.0"
  },
  "devDependencies": {
    "@biomejs/biome": "2.2.0",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "babel-plugin-react-compiler": "1.0.0",
    "drizzle-kit": "^0.31.6",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
```

To build the project, run the following command. This runs the build script listed in `/package.json`, which is simply `next build`.

```bash
npm run build
```

= Interacting directly with our database

Our project uses #link("https://neon.tech")[Neon] to host our Postgres database. If you send me your email address, I can share the Neon project with you so you can interact with it using Neon's UI, which includes an SQL editor to run queries. You won't see the shared project on your Neon homepage, but you can access it via #link("https://console.neon.tech/app/projects/spring-salad-20344932")[this link].

Alternatively, you can connect to the database directly in your terminal:

```bash
source .env
psql $DATABASE_URL
```