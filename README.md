# TrackIndia

TrackIndia brings Indian-market news, IPO updates, and policy-related headlines together with source links and AI-generated summaries and tags. AI tags are estimates, not forecasts or investment recommendations.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://trackmarket.live

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cdea9cdf-8b30-4ec3-aa0a-7273c2f53d6c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Scheduled route secret

Before applying the scheduled-job migration, configure the same high-entropy `CRON_SECRET` in the Lovable server environment and in Supabase Vault under the name `CRON_SECRET`. Do not commit the secret. Scheduled routes fail closed until both locations are configured.
