# Changelog

## [0.0.24] - 2021-12-13

### Changed

* `@prestojs/util` is now a peerDep of `@prestojs/viewmodel`. Prior to this version `@prestojs/viewmodel` may have had an old version of `@prestojs/util` installed even after upgrading to the latest.

## [0.0.23] - 2021-11-30

### Changed

* [SelectAsyncChoicesWidget](https://prestojs.com/docs/ui-antd/widgets/SelectAsyncChoicesWidget/) fixes:
  * Clears keywords on close or select. This avoids display bug where keywords overlap with selected item and works better for multi-select.
  * Fix bug where closing dropdown immediately after typing could cause component to crash
* Fix [useAsyncListing](https://prestojs.com/docs/util/useAsyncListing) to avoid infinite loop if `query` object changed every render but had same field/values

## [0.0.22] - 2021-11-17

### Added

* Add [boundRecord](https://prestojs.com/docs/viewmodel/fields/Field/#var-boundRecord) to `Field`. This can be used to access the record a field is attached to when using the [_f](https://prestojs.com/docs/viewmodel/viewModelFactory#var-_f) shortcut

## [0.0.21] - 2021-11-01

### Changed

* (types) Fix types on `Endpoint.resolveUrl` - it was missing the last parameter `baseUrl`
* (types) Fix bad outputted types for ImageWidget that included a relative import that would not resolve in the distributed build

## [0.0.20] - 2021-10-21

### Changed

* (bugfix) Fix bug when using [ManyRelatedViewModelField](https://prestojs.com/docs/viewmodel/fields/ManyRelatedViewModelField/) that meant deleting a related record broke caching
* Improve [viewModelCachingMiddleware](https://prestojs.com/docs/rest/viewModelCachingMiddleware/) so that on a single listener call is made for each model even if multiple changes are made (eg. when `deleteViewModel` is specified).

## [0.0.19] - 2021-09-30

### Changed

* (bugfix) Fix bug in [useUrlQueryState](https://prestojs.com/docs/routing/useUrlQueryState/) where it would incorrectly replace existing URL query parameters with the initial version in a conflict.
* (bugfix) Fix bug in [detectBadPaginationMiddleware](https://prestojs.com/docs/rest/detectBadPaginationMiddleware/#main-content) that would break on non-JSON responses

## [0.0.18] - 2021-07-27

### Changed

* The `response` key in the return value for [useAsync](https://prestojs.com/docs/util/useAsync) has been renamed to `result`. `response` is now deprecated; it will still work but any use will result in a warning.
* Fixed `InferredPaginator` to correctly infer `PageNumberPaginator` instead of `LimitOffsetPaginator`
* Add better warnings when `paginationMiddleware` or `viewModelCachingMiddleware` are not setup correctly

## [0.0.17] - 2021-06-28

### Added

* Add [CheckboxChoicesWidget](https://prestojs.com/docs/ui-antd/widgets/CheckboxChoicesWidget/)
* Add [ChoicesWidget](https://prestojs.com/docs/ui-antd/widgets/ChoicesWidget/)
* Add [parseTime](https://prestojs.com/docs/util/parseTime/) and [formatTime](https://prestojs.com/docs/util/formatTime/)
* Add [resultPath](https://prestojs.com/docs/rest/paginationMiddleware/) option to `paginationMiddleware`. This allows pagination to be handled on a sub-key of the data.
* Add [SkipToResponse](https://prestojs.com/docs/rest/SkipToResponse/) for use in middleware to bypass the rest of the middleware chain
* Add [addFetchStartListener](https://prestojs.com/docs/rest/MiddlewareContext/#method-addFetchStartListener)
* Add [batchMiddleware](https://prestojs.com/docs/rest/batchMiddleware)

### Changed

* [getWidgetForField](https://prestojs.com/docs/ui-antd/getWidgetForField/#main-content) better handling for [ListField](https://prestojs.com/docs/viewmodel/fields/ListField/#main-content) and `choice` fields in general
* `IntegerChoicesWidget` and `CharChoicesWidget` now use [ChoicesWidget](https://prestojs.com/docs/ui-antd/widgets/ChoicesWidget/)
* Renamed `RadioChoiceWidget` to `RadioChoicesWidget`
* Renamed `SelectChoiceWidget` to `SelectChoicesWidget`
* Renamed `SelectAsyncChoiceWidget` to `SelectAsyncChoicesWidget`
* Add missing static `fieldClassName` property to some fields  
* [FieldWidget](https://prestojs.com/docs/ui/FieldWidget/#main-content) now memo's the selected widget. This solves a bug that could result in the selected component being unmounted and remounted every render.
* Type changes
  * `onBlur` and `onFocus` are no longer required on `input` specified by `FieldWidgetInterface`
  * `WidgetProps` now supports `SingleValue` generic type to support fields with an array of values but type `choices` correctly
* Fix bug that prevented [TimeFormatter](https://prestojs.com/docs/ui/formatters/TimeFormatter/) from working in Safari
* [RadioChoicesWidget](https://prestojs.com/docs/ui-antd/widgets/RadioChoicesWidget/) now supports `radioComponent` & `choicesProps` props
* Types for all provided Formatter components in `@prestojs/ui` have been updated to have correct return types for typescript
* [BooleanFormatter](https://prestojs.com/docs/ui/formatters/BooleanFormatter/) now accepts `trueLabel` and `falseLabel`
* [CharFormatter](https://prestojs.com/docs/ui/formatters/CharFormatter/) now accepts `blankLabel`
* [ChoiceFormatter](https://prestojs.com/docs/ui/formatters/ChoiceFormatter/) now accepts `blankLabel`, `invalidChoiceLabel` and `warnOnInvalidChoice`
* [DateFormatter](https://prestojs.com/docs/ui/formatters/DateFormatter/) and [DateTimeFormatter](https://prestojs.com/docs/ui/formatters/DateTimeFormatter/) now accept `blankLabel` and `invalidDateLabel`
* [ImageFormatter](https://prestojs.com/docs/ui/formatters/ImageFormatter/) now accepts `blankLabel` and types updated to accept valid `img` props. It also accepts a `Blob` or `File` as a value.
* [LinkFormatter](https://prestojs.com/docs/ui/formatters/LinkFormatter/) now accepts `blankLabel` and `linkComponent` 
* [NumberFormatter](https://prestojs.com/docs/ui/formatters/NumberFormatter/) now accepts `blanklabel` and `invalidValueLabel`
* [RangeFormatter](https://prestojs.com/docs/ui/formatters/RangeFormatter/) now accepts `blanklabel`, `boundsFormatterProps`, `lowerFormatterProps`, `upperFormatterProps`. `baseFormatter` was renamed `boundsFormatter`.
* [TimeFormatter](https://prestojs.com/docs/ui/formatters/TimeFormatter/) now accepts `blanklabel` and `invalidValueLabel` and can parse times in more formats.
* [DecimalField](https://prestojs.com/docs/viewmodel/fields/DecimalField/) previously required you to pass `props` even if it was empty. This is now optional.
* Second parameter of [paginationMiddleware](https://prestojs.com/docs/rest/paginationMiddleware/) is now an options object. If you used this option previous change:
  ```js
  // before
  paginationMiddleware(PageNumberPaginator, getPaginationState);
  // after
  paginationMiddleware(PageNumberPaginator, { getPaginationState });
  ```
* Fix bug in [dedupeInFlightRequestsMiddleware](https://prestojs.com/docs/rest/dedupeInFlightRequestsMiddleware/) that meant deduped calls didn't have all the expected keys in the returned object (eg. `response`).

## [0.0.16] - 2021-04-26

### Added

* Add [PasswordField](https://prestojs.com/docs/viewmodel/fields/PasswordField/) and [PasswordWidget](https://prestojs.com/docs/ui-antd/widgets/PasswordWidget/)
* Add [DecimalRangeField](https://prestojs.com/docs/viewmodel/fields/DecimalRangeField/) [DecimalRangeWidget](https://prestojs.com/docs/ui-antd/widgets/DecimalRangeWidget/) 

### Changed

* [getWidgetForField](https://prestojs.com/docs/ui-antd/getWidgetForField/#main-content) handles [ListField](https://prestojs.com/docs/viewmodel/fields/ListField/#main-content) with `asyncChoices` or `choices`. Will currently throw for other types of `ListField`.
* Avoid passing through `meta` to widgets in `@prestojs/ui-antd`. This avoids having invalid `meta` prop set on DOM elements.
* [FileWidget](https://prestojs.com/docs/ui-antd/widgets/FileWidget) had a bug that would break in some browsers when loading an initial value. This has been resolved.
* Removed defaults for `getFormatterForField`, `getWidgetForField`, `formItemComponent` and `formComponent` from [AntdUiProvider](https://prestojs.com/docs/ui-antd/AntdUiProvider/). You must explicitly pass these now.

## [0.0.15] - 2021-04-14

### Changed

The structure of the published packages has changed with this release. Previously it looked like:

* `build/module` - ESM build
* `build/cjs` - commonjs build

Now the ESM build appears in the root and commonjs in immediate `cjs` sub directory.

If you only ever imported directly from the package root (eg. `import { UiProvider } from '@prestojs/ui'`) then no changes are required.

Otherwise change any imports of the form:

* `'@prestojs/<package>/build/module/<module>'` to `'@prestojs/<package>/<module>'`
* `'@prestojs/<package>/build/cjs/<module>'` to `'@prestojs/<package>/cjs/<module>'`

## [0.0.14] - 2021-04-12

### Added

* Add [AntdUiProvider](https://prestojs.com/docs/ui-antd/AntdUiProvider/) with support for `datePickerComponent` and `timePickerComponent`
  * This makes it easy to switch out the concrete implementation of date/time picker using preferred date library of choice

### Changed

* Fix `useUrlQueryState` to return `initialState` on first render
* Add React 17 as valid peerDep version
* Update to support antd 4.15+
* `DurationWidget` no longer uses TimePicker - it accepts input instead
* All range widgets fixed to properly accept constructor arguments
* `RangeWidget` now has classes for styling
* `DateRangeWidget` and `DateTimeRangeWidget` now using `datePickerComponent` from [AntdUiProvider](https://prestojs.com/docs/ui-antd/AntdUiProvider/)

## [0.0.13] - 2021-03-22

### Added

* Add [detectBadPaginationMiddleware](https://prestojs.com/docs/rest/detectbadpaginationmiddleware/) to highlight when either `paginator` hasn't been supplied or `paginationMiddelware` is not specified. Without this `viewModelCachingMiddleware` will give cryptic errors (eg. primary key value not supplied) as it will attempt to convert the paginated response to a record rather than each result in the paginated response.

### Changed

* Removed `getPaginationState` and references to a non-existant `Endpoint.defaultConfig.getPaginationState`
* Add `getPaginationState` to the Paginator class instead
* Default `PageNumberPagination` `page` to `1` rather than `null` when used without an explicit `page` being specified.
* Fix `SelectAsyncChoiceWidget` to work when `allowClear` is passed

## [0.0.12] - 2021-03-17

### Added

* If `viewModelCachingMiddleware` and `paginationMiddleware` appear in the incorrect order this is now detected when the endpoint is defined

### Changed

* Fix issue with `useViewModelCache` that could cause a render after unmount
* (breaking) Removed `RequestError` from `Endpoint`. Instead `Endpoint` will now throw the error raised by `fetch` directly - either `TypeError` or `AbortError`.
* Fix bugs with `RelatedViewModelField` and `ManyRelatedViewModelField` where things could break if value was `null` or `[]`
* Fix bug with `ViewModelCache` when passing a record with nested related fields to `get` or `getList` that meant it only traversed 1 level deep which meant the returned record could be different to the passed record.
* Fix issues with paginator where if multiple state transitions were called before the previous committed then only the last would be retained. This is fixed, eg. the following now works:
    ```js
    function onChange(page, pageSize) {
        paginator.setPage(page);
        if (pageSize) {
            paginator.setPageSize(pageSize);
        }
    }
    ``` 

## [0.0.11] - 2021-03-01

### Added

* Add `deleteViewModel` option to [viewModelCachingMiddleware](https://prestojs.com/docs/rest/viewmodelcachingmiddleware) by [@jasongi-alliance](https://github.com/jasongi-alliance)

### Changed

* Fix `getAll` to work with ViewModel's that have compound primary keys by [@liz-johnson-alliance](https://github.com/liz-johnson-alliance)
