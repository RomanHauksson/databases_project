This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, [install Node.js](https://nodejs.org/en/download) if you haven't already. Verify that you're using Node version 24, which is the latest LTS version, using [Node Version Manager](https://github.com/nvm-sh/nvm).

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
cd gui # Make sure you're in the `gui` subdirectory, not the root directory
npm install
```

To begin development, start the development server.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Deployment

Whenever you push changes to the `main` branch, [Vercel](https://vercel.com/) will automatically rebuild the project and deploy it to https://databases-project.vercel.app/. Vercel requires a paid plan to add multiple collaborators to the project. Let me know if you want to manage the deployments as well, and I can look into deploying this with a different service.

## Learn More

This website is built with Next.js, the most popular meta-framework for React. To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Neon

We're using [Neon](https://neon.tech), a service that hosts a Postgres database for us. I shared the Neon project with each of you via email. You can't see the shared project on your Neon homepage, but you can access it directly via [this link](https://console.neon.tech/app/projects/spring-salad-20344932).

You need to add a file `.env` that specifies the database connection string. Check the group chat for this.

```
DATABASE_URL="..."
```

## Drizzle

We're using [Drizzle](https://orm.drizzle.team/) for object-relational mapping. This makes it easier to write functions that query the database, since we can write the queries in Typescript right in this repository.

To make changes to the database schema, edit `schema.ts`, then run this command to push this change to the database:

```bash
npx drizzle-kit push
```

[Here's the documentation on writing queries using Drizzle](https://orm.drizzle.team/docs/rqb), and [here's the documentation on fetching data using an ORM in Next.js](https://nextjs.org/docs/app/getting-started/fetching-data#with-an-orm-or-database).