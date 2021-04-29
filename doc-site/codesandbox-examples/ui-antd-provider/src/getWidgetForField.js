import { getWidgetForField as getAntdWidgetForField } from "@prestojs/ui-antd";

export default function getWidgetForField(field) {
  // Add any app specific customisations here, eg
  // if (field instanceof BooleanField) {
  //    return CustomBooleanWidget;
  // }
  // Otherwise fall back to specific UI library defaults
  let widget;
  if ((widget = getAntdWidgetForField(field)))
    return widget;
  // ... if integrating any other libraries add them here ...

  // Fall through to any parent UiProvider. If there is none or they
  // don't provide a widget for this field then an error will be thrown
}
