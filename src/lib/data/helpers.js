import { has } from 'lodash';
import parse, { attributesToProps } from 'html-react-parser';
import pick from 'lodash/pick';
import Image from 'next/image';
import isString from 'lodash/isString';

export function flattenEdges(data) {
    return data.edges.reduce((accumulator, obj) => {
        accumulator.push(obj.node);

        return accumulator;
    }, []);
}

export function mapMenuItemsChildrenToParents(menuItemsNodes) {
    const siteUrlObj = new URL(process.env.NEXT_PUBLIC_SITE_URL);
    const tree = [];
    const childrenOf = {};

    menuItemsNodes.forEach(item => {
        const newItem = { ...item };

        if (newItem.url !== null) {
            const urlHost = new URL(newItem.url).host;

            // Set internal url to the path only.
            if (urlHost === siteUrlObj.host) {
                newItem.url = new URL(newItem.url).pathname;
                newItem.isExternal = false;
            } else {
                newItem.isExternal = true;
            }
        }

        const { id, parentId = 0 } = newItem;
        childrenOf[id] = childrenOf[id] || [];
        newItem.children = childrenOf[id];
        parentId ? (childrenOf[parentId] = childrenOf[parentId] || []).push(newItem) : tree.push(newItem);
    });

    return tree;
}

export async function generateFeaturedImagePlaceholders(getPlaiceholder, postsEdges) {
    for (const edge of postsEdges) {
        const post = edge.node;
        if (has(post, 'featuredImage.node.mediaItemUrl')) {
            const { base64 } = await getPlaiceholder(post.featuredImage.node.mediaItemUrl);
            post.featuredImage.node.blurDataURL = base64;
        }
    }
}

export function parseImages(text) {
    if (!isString(text) || text === '') return '';

    return parse(text, {
        replace: ({ name, attribs, parent }) => {
            const allowedParentDomNodes = ['figure', 'div', 'a'];
            if (name === 'img' && allowedParentDomNodes.includes(parent.name) && attribs) {
                const imageProps = attributesToProps(pick(attribs, ['class', 'src', 'width', 'height', 'alt']));

                if (
                    !imageProps.className ||
                    !imageProps.className.split(' ').some(className => className.startsWith('wp-image-')) ||
                    !imageProps.width ||
                    !imageProps.height
                )
                    return;

                if (!imageProps.alt) imageProps.alt = '';

                // eslint-disable-next-line consistent-return
                return (
                    <Image
                        {...imageProps}
                        quality={100}
                        unoptimized={
                            !new URL(imageProps.src).host.includes(new URL(process.env.NEXT_PUBLIC_SITE_URL).host)
                        }
                    />
                );
            }
        },
    });
}
