/* eslint-disable no-console */
const { loadEnvConfig } = require('@next/env');
// eslint-disable-next-line no-unused-vars
const fetch = require('isomorphic-unfetch'); // fetch required for urql
const { createClient, gql } = require('urql');
const { writeFile } = require('fs').promises;
const path = require('path');
const has = require('lodash/has');

const projectDir = process.cwd();

// Load environment variables.
loadEnvConfig(projectDir);

// Run.
(async () => {
    const urqlClient = createClient({ url: process.env.NEXT_PUBLIC_API_GRAPHQL_URL });

    // Initialize global data manifest object.
    const globalDataManifest = {};

    // Get header menu.
    try {
        const { data } = await urqlClient
            .query(
                gql`
                    query {
                        menus(where: { slug: "header" }) {
                            nodes {
                                menuItems(first: 100) {
                                    nodes {
                                        key: id
                                        parentId
                                        title: label
                                        url
                                    }
                                }
                            }
                        }
                    }
                `
            )
            .toPromise();

        if (has(data, 'menus.nodes[0].menuItems.nodes'))
            globalDataManifest.headerMenuItems = data.menus.nodes[0].menuItems.nodes;
        else console.log('Header menu query returned no results.');
    } catch (err) {
        console.log('Unable to query for header menu:', err);
    }

    // Create global data manifest.
    try {
        await writeFile(path.join(projectDir, 'globalDataManifest.json'), JSON.stringify(globalDataManifest));
        console.log('Global data manifest created successfully.');
    } catch (err) {
        console.error('Error writing global data manifest file:', err);
    }
})();
