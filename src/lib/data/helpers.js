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

        const { key: id, parentId = 0 } = newItem;
        childrenOf[id] = childrenOf[id] || [];
        newItem.children = childrenOf[id];
        parentId ? (childrenOf[parentId] = childrenOf[parentId] || []).push(newItem) : tree.push(newItem);
    });

    return tree;
}
