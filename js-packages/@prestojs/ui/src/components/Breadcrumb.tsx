import React from 'react';
import { useCurrentRoute, Link } from 'react-navi';

function AndParent({ Crumb, namedUrls, current, params }): React.ReactElement {
    const { name, parent, validArgNames } = namedUrls.get(current);
    const kwargs = {};
    validArgNames.forEach(arg => (kwargs[arg] = params[arg]));
    const url = namedUrls.get(current).resolve(kwargs);
    return (
        <>
            {parent && (
                <AndParent Crumb={Crumb} namedUrls={namedUrls} current={parent} params={params} />
            )}
            <Crumb>
                <Link href={url}>{name}</Link>
            </Crumb>
        </>
    );
}

export default function Breadcrumb({ Crumb }): React.ReactElement {
    const {
        data: { _routeParent, _routeNamedUrls },
        title,
        lastChunk: {
            // error: TS2339 - Property 'params' does not exist on type 'NaviRequest<any> | undefined'.
            // this's weird: NaviRequest has `readonly params: { [name: string]: string }`. umm. what am i missing?
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            request: { params },
        },
    } = useCurrentRoute();
    return (
        <>
            {_routeParent && (
                <AndParent
                    Crumb={Crumb}
                    namedUrls={_routeNamedUrls}
                    current={_routeParent}
                    params={params}
                />
            )}
            <Crumb>{title}</Crumb>
        </>
    );
}
