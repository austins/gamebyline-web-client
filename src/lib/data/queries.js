import { gql } from 'graphql-request';

// Fragments
export const commentFieldsFragment = gql`
    fragment commentFields on Comment {
        id
        databaseId
        parentId
        content
        author {
            node {
                name
                ... on User {
                    avatar(size: 42) {
                        url
                        width
                        height
                    }
                    slug
                    posts(where: { status: PUBLISH }, first: 1) {
                        nodes {
                            id
                        }
                    }
                }
            }
        }
        dateGmt
    }
`;

// Queries
export const pageQuery = gql`
    query ($slug: String!) {
        pageBy(uri: $slug) {
            title
            content
            seo {
                fullHead
            }
        }
    }
`;

export const csgoCrosshairsQuery = gql`
    query {
        csgoCrosshairs(first: 100, where: { orderby: { field: TITLE, order: ASC } }) {
            nodes {
                id
                title
                featuredImage {
                    node {
                        mediaDetails {
                            width
                            height
                        }
                        mediaItemUrl
                    }
                }
                csgoCrosshair {
                    code
                    style
                }
            }
        }
    }
`;

export const postsQuery = gql`
    query ($categorySlug: String, $authorSlug: String, $search: String, $size: Int!, $offset: Int) {
        posts(
            where: {
                status: PUBLISH
                orderby: { field: DATE, order: DESC }
                categoryName: $categorySlug
                authorName: $authorSlug
                search: $search
                offsetPagination: { size: $size, offset: $offset }
            }
        ) {
            pageInfo {
                offsetPagination {
                    hasMore
                    hasPrevious
                }
            }
            edges {
                node {
                    id
                    slug
                    dateGmt
                    title
                    excerpt
                    content
                    author {
                        node {
                            name
                            slug
                        }
                    }
                    categories {
                        nodes {
                            name
                            slug
                        }
                    }
                    featuredImage {
                        node {
                            mediaItemUrl
                        }
                    }
                }
            }
        }
    }
`;

export const postQuery = gql`
    ${commentFieldsFragment}

    query ($slug: String!) {
        postBy(slug: $slug) {
            id
            databaseId
            guid
            status
            title
            content
            dateGmt
            author {
                node {
                    name
                    slug
                    description
                    avatar(size: 60) {
                        url
                        width
                        height
                    }
                }
            }
            categories {
                nodes {
                    name
                    slug
                }
            }
            commentCount
            comments(first: 100, where: { order: ASC, orderby: COMMENT_DATE_GMT, parent: 0 }) {
                edges {
                    node {
                        ...commentFields
                        replies(first: 100, where: { order: ASC, orderby: COMMENT_DATE_GMT }) {
                            edges {
                                node {
                                    ...commentFields
                                }
                            }
                        }
                    }
                }
            }
            seo {
                fullHead
            }
        }
    }
`;
