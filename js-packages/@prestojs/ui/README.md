# UI

Base types and components for UI integration with prestojs.

To use wrap your app with the `UiProvider`:

```js
import { render } from 'react-dom';
import { UiProvider } from '@prestojs/ui';
import { getWidgetForField as getDateWidget } from 'customdatepackage';
import { getWidgetForField as getAntdWidget } from '@prestojs/ui-antd';

import App from './App';

function getWidgetForField(field) {
    // Add any app specific customisations here
    if (field instanceof BooleanField) {
        return CustomBooleanWidget;
    }
    // Otherwise fall back to specific UI library defaults
    let widget;
    if ((widget = getDateWidget(field))) return widget;
    if ((widget = getAntdWidget(field))) return widget;

    // Fall through to any parent UiProvider. If there is none or they
    // don't provide a widget for this field then an error will be thrown
}

render(
    <UiProvider getWidgetForField={getWidgetFromField}>
        <App />
    </UiProvider>,
    document.getElementById('root')
);
```
