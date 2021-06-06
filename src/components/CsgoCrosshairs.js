import { Table } from 'react-bootstrap';

export default function CsgoCrosshairs({ csgoCrosshairs }) {
    return (
        <Table size="sm" variant="dark" bordered responsive>
            <thead>
                <tr>
                    <th>Preview</th>
                    <th>Name</th>
                    <th>Style</th>
                    <th>Code</th>
                </tr>
            </thead>

            <tbody>
                {csgoCrosshairs.map(csgoCrosshair => (
                    <tr key={csgoCrosshair.id}>
                        <td>
                            {csgoCrosshair.featuredImage && (
                                <img src={csgoCrosshair.featuredImage.node.mediaItemUrl} alt={csgoCrosshair.title} />
                            )}
                        </td>
                        <td>{csgoCrosshair.title}</td>
                        <td>{csgoCrosshair.csgoCrosshair.style}</td>
                        <td>
                            <code>{csgoCrosshair.csgoCrosshair.code}</code>
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
}
