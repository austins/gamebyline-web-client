# gamebyline-web-client

The frontend for _[Game Byline](https://gamebyline.com)_, powered by Next.js, React, GraphQL with graphql-request and SWR, and Bootstrap. Based on [austinsdev-web-client](https://github.com/austins/austinsdev-web-client).

The goal of this project is to abstract the frontend away from WordPress, improve performance (such as time to first byte), eliminate the usage of frontend plugins that slow down WordPress, and allow further customization for the intended website.

Pages are statically generated at build-time except for the search page. They may be server-side rendered during revalidation or if a requested page doesn't exist. This app is required to be rebuilt when content is changed in the WordPress backend.

## Requirements

- Node.js (LTS v14.17.0 is the minimum version necessary)
- A backend powered by WordPress with these plugins at the minimum:
  - [WPGraphQL](https://wordpress.org/plugins/wp-graphql/), [WPGraphQL Offset Pagination](https://github.com/valu-digital/wp-graphql-offset-pagination), [Custom Post Type UI](https://wordpress.org/plugins/custom-post-type-ui/), [Advanced Custom Fields](https://wordpress.org/plugins/advanced-custom-fields/), [WPGraphQL for Advanced Custom Fields](https://github.com/wp-graphql/wp-graphql-acf), [Yoast SEO](https://wordpress.org/plugins/wordpress-seo/), and [WPGraphQL Yoast SEO Addon](https://wordpress.org/plugins/add-wpgraphql-seo/). 

## Development

1. Create a `.env.local` file (see the provided example file) with the required environment variables set.
2. Run the development server: `npm run dev`
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

Dockerization is WIP.

For a self-hosted server, it should be configured with Linux, [Node.js (LTS)](https://github.com/nodesource/distributions/blob/master/README.md) with [pm2](https://github.com/Unitech/pm2) installed, and [webhook](https://github.com/adnanh/webhook).
- After cloning the repo onto the server, create a `.env.local` and `ecosystem.config.js` file (see the provided example files) with the environment variables set. Run `npm ci && npm run build` and then `pm2 start ecosystem.config.js` to start the app with load-balancing. The server can be configured to auto-start the app with pm2.
- webhook must be set up to run a script to run `git pull && npm ci && npm run build && pm2 reload gamebyline-web-client`.

With the above configuration, continuous delivery of new code changes can be achieved by:
1. Pushing changes to `master` branch of this repo.
2. GitHub posts to a set webhook.
3. Server receives webhook post and runs a script to pull, build, and reload the app.
4. Changes will appear on the website within minutes with zero-downtime thanks to the pm2 cluster load-balancing.

WordPress should be configured to post to a webhook as well when posts are changed.

## License

See LICENSE file in this repo.

This app has been developed by Austin S.

You may contribute code to this app. You may fork, modify, and use this app as a basis for your own project. You may not use the name and content of _Game Byline_ for any derivatives of this project.
