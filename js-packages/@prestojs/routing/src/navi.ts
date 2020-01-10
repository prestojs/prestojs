import { mount as naviMount, route as naviRoute, NaviRequest, Matcher } from 'navi';

interface NaviRouteProps<Data extends object = any> {
    data?: Data;
    error?: any;
    head?: any;
    headers?: { [name: string]: string };
    state?: any;
    status?: number;
    title?: string;
    view?: any;
}

function refineNaviProps(namedUrls, name, naviProps, req?: NaviRequest): NaviRouteProps {
    const resolveStringLiteral = (str, vars): string =>
        str.replace(/\${(.*?)}/g, (x, v) => vars[v]);

    if (namedUrls.get(name).name && !naviProps.title) {
        naviProps.title = req
            ? resolveStringLiteral(namedUrls.get(name).name, req.params)
            : namedUrls.get(name).name;
    }

    naviProps.data = naviProps.data ? { ...naviProps.data } : {};

    naviProps.data._routeNamedUrls = namedUrls;

    if (namedUrls.get(name).parent) {
        naviProps.data._routeParent = namedUrls.get(name).parent;
    }

    return naviProps;
}

export function mount(simplifiedRoutes, namedUrls): Matcher<any> {
    const routes = {};
    for (const r of Object.keys(simplifiedRoutes)) {
        if (typeof simplifiedRoutes[r] !== 'function') {
            routes[namedUrls.get(r).pattern] = naviRoute(
                refineNaviProps(namedUrls, r, simplifiedRoutes[r])
            );
        } else {
            routes[namedUrls.get(r).pattern] = naviRoute(req =>
                refineNaviProps(namedUrls, r, simplifiedRoutes[r](req), req)
            );
        }
    }
    return naviMount(routes);
}
