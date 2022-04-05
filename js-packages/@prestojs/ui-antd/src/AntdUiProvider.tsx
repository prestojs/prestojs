import { UiProvider, UiProviderProps } from '@prestojs/ui';

import {
    PickerBaseProps,
    PickerDateProps,
    PickerTimeProps,
} from 'antd/es/date-picker/generatePicker';
import React, {
    ComponentClass,
    ForwardRefExoticComponent,
    LazyExoticComponent,
    useContext,
    useMemo,
} from 'react';

type _DatePickerComponent<T> = ComponentClass<
    PickerBaseProps<T> | PickerDateProps<T> | PickerTimeProps<T>,
    any
>;
export type DatePickerComponent<T> =
    | _DatePickerComponent<T>
    | LazyExoticComponent<_DatePickerComponent<T>>;
type _TimePickerComponent<T> = ForwardRefExoticComponent<
    Omit<PickerTimeProps<T>, 'picker'> & React.RefAttributes<any>
>;
export type TimePickerComponent<T> =
    | _TimePickerComponent<T>
    | LazyExoticComponent<_TimePickerComponent<T>>;

/**
 * @expand-properties
 */
interface AntdUiConfigComponents {
    /**
     * The DatePicker component to use. This can be [DatePicker](https://ant.design/components/date-picker/) or an
     * alternative as described in the [replace moment.js documentation](https://ant.design/docs/react/replace-moment#DatePicker.tsx).
     */
    DatePicker?: DatePickerComponent<any>;
    /**
     * The TimePicker component to use. This can be [TimePicker](https://ant.design/components/time-picker/) or an
     * alternative as described in the [replace moment.js documentation](https://ant.design/docs/react/replace-moment#TimePicker.tsx).
     */
    TimePicker?: TimePickerComponent<any>;
}

/**
 * Class to store current antd config created by [AntdUiProvider](doc:AntdUiProvider).
 *
 * To get the current config use [useAntdUiConfig](doc:useAntdUiConfig).
 *
 * @extract-docs
 * @menu-group Configuration
 */
export class AntdUiConfig {
    components: AntdUiConfigComponents;

    constructor(components: AntdUiConfigComponents) {
        this.components = components;
    }

    /**
     * Get the `DatePicker` component to use. This is used by all date/datetime based widgets (eg. [DateWidget](doc:DateWidget)).
     *
     * @return-type-name DatePickerComponent
     * @returns {DatePickerComponent} This returns the `datePickerComponent` passed to [AntdUiProvider](doc:AntdUiProvider) or throws an error if no `datePickerComponent` has been defined.
     */
    getDatePicker<T>(): DatePickerComponent<T> {
        if (!this.components.DatePicker) {
            throw new Error(`To use components that use DatePicker you must first configure @prestojs/ui-antd so it knows the type to use. To set the default moment based datepicker add the following to your app before any widgets are used:

    import { DatePicker } from 'antd';

    <AntdUiProvider datePickerComponent={DatePicker}>...</AntdUiProvider>

See https://prestojs.com/docs/ui-antd/ for instructions on setting up @prestojs/ui-antd and 
https://ant.design/docs/react/replace-moment#DatePicker.tsx for options in customising the DatePicker.

Note that it's recommended not to choose Moment for new projects (see https://momentjs.com/docs/#/-project-status/) -
consider using one of the suggested alternatives instead.
`);
        }
        return this.components.DatePicker;
    }

    /**
     * Get the `TimePicker` component to use. This is used by all time based widgets (eg. [TimeWidget](doc:TimeWidget)).
     *
     * @return-type-name DatePickerComponent
     * @returns {DatePickerComponent} This returns the `timePickerComponent` passed to [AntdUiProvider](doc:AntdUiProvider) or throws an error if no `timePickerComponent` has been defined.
     */
    getTimePicker<T>(): TimePickerComponent<T> {
        if (!this.components.TimePicker) {
            throw new Error(`To use components that use TimePicker you must first configure @prestojs/ui-antd so it knows the type to use. To set the default moment based timepicker add the following to your app before any widgets are used:

    import { TimePicker } from 'antd';

    <AntdUiProvider timePickerComponent={TimePicker}>...</AntdUiProvider>

See https://prestojs.com/docs/ui-antd/ for instructions on setting up @prestojs/ui-antd and 
https://ant.design/docs/react/replace-moment#TimePicker.tsx for options in customising the TimePicker

Note that it's recommended not to choose Moment for new projects (see https://momentjs.com/docs/#/-project-status/) -
consider using one of the suggested alternatives instead.
`);
        }
        return this.components.TimePicker;
    }
}

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
 * @menu-group Configuration
 */
export function useAntdUiConfig(): AntdUiConfig {
    const context = useContext(AntdUiContext);
    if (!context) {
        throw new Error(
            'useAntdUiConfig can only be used within a AntdUiProvider. Ensure your app is wrapped in AntdUiProvider.'
        );
    }
    return context;
}

/**
 * @expand-properties
 */
export type AntdUiProviderProps = {
    /**
     * The DatePicker component to use for components like [DateWidget](doc:DateWidget). If you don't use any of
     * these components you don't have to provide this option.
     *
     * You can pass the antd [DatePicker](https://ant.design/components/date-picker/) directly
     * or [create your own version](https://ant.design/docs/react/replace-moment#DatePicker.tsx)
     */
    datePickerComponent?: DatePickerComponent<any>;
    /**
     * The TimePicker component to use for components like [TimeWidget](doc:TimeWidget). If you don't use any of
     * these components you don't have to provide this option.
     *
     * You can pass the antd [TimePicker](https://ant.design/components/time-picker/) directly
     * or [create your own version](https://ant.design/docs/react/replace-moment#TimePicker.tsx)
     */
    timePickerComponent?: TimePickerComponent<any>;
} & UiProviderProps;

/**
 * Version of [UiProvider](doc:UiProvider) that supports some extra options specific to antd.
 *
 * If you use date or time widgets in the system you should pass through the `datePickerComponent` and `timePickerComponent`
 * props. Without this when [DateWidget](doc:DateWidget), [TimeWidget](doc:TimeWidget) or other date/time based components
 * are used they will throw an error. The reason for this is to configure how you want dates to be handled. The default
 * `DatePicker` and `TimePicker` components provided by antd use momentjs but it is [recommended you use date-fns or dayjs](https://ant.design/docs/react/replace-moment)
 * instead.
 *
 * ### Recommended Setup
 *
 * To setup form components, widgets and formatters with sensible defaults we recommend the following:
 *
 * ```jsx
 * import React from 'react';
 * import { AntdUiProvider } from '@prestojs/ui-antd';
 * import { getFormatterForField as defaultGetFormatterForField } from '@prestojs/ui';
 * import { getWidgetForField as defaultGetWidgetForField } from '@prestojs/ui-antd';
 *
 * const DatePicker = React.lazy(() => import('./DatePicker'));
 * const TimePicker = React.lazy(() => import('./TimePicker'));
 * const FormItemWrapper = React.lazy(() => import('@prestojs/ui-antd/FormItemWrapper'));
 * const FormWrapper = React.lazy(() => import('@prestojs/ui-antd/FormWrapper'));
 *
 * function getWidgetForField(field) {
 *    // Add any app specific customisations here, eg
 *    // if (field instanceof BooleanField) {
 *    //    return CustomBooleanWidget;
 *    // }
 *    // Otherwise fall back to specific UI library defaults
 *    let widget;
 *    if ((widget = getAntdWidget(field))) return widget;
 *    // ... if integrating any other libraries add them here ...
 *
 *    // Fall through to any parent UiProvider. If there is none or they
 *    // don't provide a widget for this field then an error will be thrown
 * }
 *
 * function getFormatterForField(field) {
 *     // Add any app specific customisations here, eg
 *     // if (field instanceof BooleanField) {
 *     //    return CustomBooleanFormatter;
 *     // }
 *     // Otherwise fall back to specific UI library defaults
 *     let formatter;
 *     if ((formatter = defaultGetFormatterForField(field))) return formatter;
 *     // ... if integrating any other libraries add them here ...
 *
 *     // Fall through to any parent UiProvider. If there is none or they
 *     // don't provide a formatter for this field then an error will be thrown
 * }
 *
 * export default function Root() {
 *   return (
 *     <AntdUiProvider
 *         datePickerComponent={datePickerComponent}
 *         timePickerComponent={timePickerComponent}
 *         getFormatterForField={getFormatterForField}
 *         getWidgetForField={getWidgetForField}
 *         formItemComponent={FormItemWrapper}
 *         formComponent={FormWrapper}
 *     >
 *         <YourApp />
 *     </AntdUiProvider>
 *   );
 * }
 * ```
 *
 * This recommended setup sets:
 *
 * * `formComponent` is set to [FormWrapper](doc:FormWrapper)
 * * `formItemComponent` is set to [FormItemWrapper](doc:FormItemWrapper)
 * * `getWidgetForField` is set to [getWidgetForField](doc:getWidgetForField)
 * * `getFormatterForField` is set to [getFormatterForField](doc:getFormatterForField)
 * * `datePickerComponent` and `timePickerComponent` are components you create according to the [antd documentation]((https://ant.design/docs/react/replace-moment))
 *
 * > **NOTE**
 * > The components here are loaded using [React.lazy](https://reactjs.org/docs/code-splitting.html). Your build must support
 * > this otherwise it is recommended to implement your own version of [getWidgetForField](doc:getWidgetForField) and
 * > [getFormatterForField](doc:getFormatterForField).
 *
 * @extract-docs
 * @menu-group Configuration
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
            <UiProvider {...rest} />
        </AntdUiContext.Provider>
    );
}
