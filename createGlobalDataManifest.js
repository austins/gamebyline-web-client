/* eslint-disable no-console */
const { loadEnvConfig } = require('@next/env');
const { request, gql } = require('graphql-request');
const has = require('lodash/has');
const path = require('path');
const { writeFile } = require('fs').promises;

const projectDir = process.cwd();

// Load environment variables.
loadEnvConfig(projectDir);

// Run.
(async () => {
    // Initialize global data manifest object.
    const globalDataManifest = {};

    // Get header menu.
    try {
        const data = await request(
            process.env.NEXT_PUBLIC_API_GRAPHQL_URL,
            gql`
                query {
                    menus(where: { slug: "header" }) {
                        nodes {
                            menuItems(first: 100) {
                                nodes {
                                    id
                                    parentId
                                    label
                                    url
                                }
                            }
                        }
                    }
                }
            `
        );

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
