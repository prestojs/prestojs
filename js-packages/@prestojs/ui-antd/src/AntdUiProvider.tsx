import { getFormatterForField, UiProvider, UiProviderProps } from '@prestojs/ui';

import type {
    PickerBaseProps,
    PickerDateProps,
    PickerTimeProps,
} from 'antd/es/date-picker/generatePicker';
import type { ComponentClass, ForwardRefExoticComponent, LazyExoticComponent } from 'react';
import React, { useContext, useMemo } from 'react';
import FormItemWrapper from './FormItemWrapper';
import FormWrapper from './FormWrapper';
import getWidgetForField from './getWidgetForField';

type _DatePickerComponent<T> = ComponentClass<
    PickerBaseProps<T> | PickerDateProps<T> | PickerTimeProps<T>,
    any
>;
type DatePickerComponent<T> =
    | _DatePickerComponent<T>
    | LazyExoticComponent<_DatePickerComponent<T>>;

type _TimePickerComponent<T> = ForwardRefExoticComponent<
    Omit<PickerTimeProps<T>, 'picker'> & React.RefAttributes<any>
>;
type TimePickerComponent<T> =
    | _TimePickerComponent<T>
    | LazyExoticComponent<_TimePickerComponent<T>>;

interface AntdUiConfigComponents {
    DatePicker?: DatePickerComponent<any>;
    TimePicker?: TimePickerComponent<any>;
}

/**
 * Class to store current antd config created by [AntdUiProvider](doc:AntdUiProvider).
 *
 * To get the current config see [useAntdUiConfig](doc:useAntdUiConfig).
 *
 * @extract-docs
 */
export class AntdUiConfig {
    components: AntdUiConfigComponents;

    constructor(components: AntdUiConfigComponents) {
        this.components = components;
    }

    /**
     * Get the `DatePicker` component to use. This is used by all date/datetime based widgets (eg. [DateWidget](doc:DateWidget])).
     */
    getDatePicker<T>(): DatePickerComponent<T> {
        if (!this.components.DatePicker) {
            throw new Error(`To use components that use DatePicker you must first configure @prestojs/ui-antd so it knows the type to use. To set the default moment based datepicker add the following to your app before any widgets are used:

    import { DatePicker } from 'antd';

    <AntdUiProvider datePickerComponent={DatePicker}>...</AntdUiProvider>

See https://prestojs.com/docs/ui-antd/ for instructions on setting up @prestojs/ui-antd and 
https://ant.design/docs/react/replace-moment#DatePicker for options in customising the DatePicker.

Note that it's recommended not to choose Moment for new projects (see https://momentjs.com/docs/#/-project-status/) -
consider using one of the suggested alternatives instead.
`);
        }
        return this.components.DatePicker;
    }

    /**
     * Get the `TimePicker` component to use. This is used by all time based widgets (eg. [TimeWidget](doc:TimeWidget])).
     */
    getTimePicker<T>(): TimePickerComponent<T> {
        if (!this.components.TimePicker) {
            throw new Error(`To use components that use TimePicker you must first configure @prestojs/ui-antd so it knows the type to use. To set the default moment based timepicker add the following to your app before any widgets are used:

    import { TimePicker } from 'antd';

    <AntdUiProvider timePickerComponent={TimePicker}>...</AntdUiProvider>

See https://prestojs.com/docs/ui-antd/ for instructions on setting up @prestojs/ui-antd and 
https://ant.design/docs/react/replace-moment#TimePicker for options in customising the TimePicker

Note that it's recommended not to choose Moment for new projects (see https://momentjs.com/docs/#/-project-status/) -
consider using one of the suggested alternatives instead.
`);
        }
        return this.components.TimePicker;
    }
}

/**
 * @expand-properties
 */
type AntdUiProviderProps = {
    /**
     * The DatePicker component to use for components like [DateWidget](doc:DateWidget). If you don't use any of
     * these components you don't have to provide this option.
     *
     * You can pass the antd [DatePicker](https://ant.design/components/date-picker/) directly
     * or [create your own version](https://ant.design/docs/react/replace-moment#DatePicker)
     */
    datePickerComponent?: DatePickerComponent<any>;
    /**
     * The TimePicker component to use for components like [TimeWidget](doc:TimeWidget). If you don't use any of
     * these components you don't have to provide this option.
     *
     * You can pass the antd [TimePicker](https://ant.design/components/time-picker/) directly
     * or [create your own version](https://ant.design/docs/react/replace-moment#TimePicker)
     */
    timePickerComponent?: TimePickerComponent<any>;
} & UiProviderProps;

export const AntdUiContext = React.createContext<AntdUiConfig | null>(null);

/**
 * Get the current [AntdUiConfig](doc:AntdUiConfig) provided by [AntdUiProvider](doc:AntdUiProvider)
 *
 * ```js
 * function MyComponent(props) {
 *     const config = useAntdUiConfig();
 *     const DatePicker = config.getDatePicker();
 *
 *     return <DatePicker {...props} >
 * }
 * ```
 *
 * @extract-docs
 */
export function useAntdUiConfig(): AntdUiConfig {
    const context = useContext(AntdUiContext);
    if (!context) {
        throw new Error(
            'useAntdUiConfig can only be used within a AntdUiProvider. Ensure your app is wrapped in AntUiProvider.'
        );
    }
    return context;
}

/**
 * [antd](https://ant.design) specific version of [UiProvider](doc:UiProvider). Provides default antd components to use
 * to [UiProvider](doc:UiProvider) and supports some extra options specific to antd.
 *
 * ```jsx
 * import React from 'react';
 * import { AntdUiProvider } from '@prestojs/ui-antd';
 * export default function Root() {
 *   return (
 *     <AntdUiProvider>
 *        <YourApp />
 *     </UiProvider>
 *   );
 * }
 * ```
 *
 * All props from [UiProvider](doc:UiProvider) are supported and default to:
 *
 * * `formComponent` is set to [FormWrapper](doc:FormWrapper)
 * * `formItemComponent` is set to [FormItemWrapper](doc:FormItemWrapper)
 * * `getWidgetForField` is set to [getWidgetForField](doc:getWidgetForField)
 * * `getFormatterForField` is set to [getFormatterForField](doc:getFormatterForField)
 *
 * If you use date or time widgets in the system you should pass through the `datePickerComponent` and `timePickerComponent`
 * props. Without this when [DateWidget](doc:DateWidget), [TimeWidget](doc:TimeWidget) or other date/time based components
 * are used they will throw an error. The reason for this is to configure how you want dates to be handled. The default
 * provided by antd is to use momentjs but you may wish to switch this to date-fns or dayjs. To use the default (moment)
 * based components do:
 *
 * ```jsx
 * import React from 'react';
 * import { DatePicker, TimePicker} from 'antd';
 * import { AntdUiProvider } from '@prestojs/ui-antd';
 *
 * export default function Root() {
 *   return (
 *     <AntdUiProvider datePickerComponent={datePickerComponent} timePickerComponent={timePickerComponent} >
 *        <YourApp />
 *     </UiProvider>
 *   );
 * }
 * ```
 *
 * See the antd [replace moment](https://ant.design/docs/react/replace-moment#DatePicker) docs for defining components
 * that use other date libraries.
 *
 * @extract-docs
 */
export default function AntdUiProvider(props: AntdUiProviderProps): React.ReactElement {
    const { datePickerComponent, timePickerComponent, ...rest } = props;
    const providedContext = useMemo(() => {
        return new AntdUiConfig({
            DatePicker: datePickerComponent,
            TimePicker: timePickerComponent,
        });
    }, [datePickerComponent, timePickerComponent]);
    return (
        <AntdUiContext.Provider value={providedContext}>
            <UiProvider
                getFormatterForField={getFormatterForField}
                getWidgetForField={getWidgetForField}
                formItemComponent={FormItemWrapper}
                formComponent={FormWrapper}
                {...rest}
            />
        </AntdUiContext.Provider>
    );
}
