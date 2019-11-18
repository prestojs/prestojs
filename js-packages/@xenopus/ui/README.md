# UI

Base types and components for UI integration with Xenopus.

To use wrap your app with the `UiProvider`:

```js
import { render } from 'react-dom';
import { UiProvider } from '@xenopus/ui';
import { getWidgetForField as getAntdWidget } from '@xenopus/ui-antd';

import App from './App';


function getWidgetForField(field) {
    // Add any client specific customisations here
    // ...
    // Otherwise fall back to specific UI library defualts, eg. antd
    return getAntdWidget(field);
}


render(
    <UiProvider getWidgetForField={getWidgetFromField}>
        <App />
    </UiProvider>,
    document.getElementById('root')
);
```
