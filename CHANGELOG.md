# Changelog

## Unreleased

### Added

* `ViewModelCache` now has a `deleteAll` method to clear the cache

### Changed

* `useViewModelCache` now longer relies on `useLayoutEffect` and so works better with server-side rendering.

## [0.0.35] - 2023-02-13

### Added

* Paginator classes now have `hasPreviousPage` to match `hasNextPage`

### Changed

* `useListChangeObserver` now uses the `Identifiable` interface and as such by default expects items to have a `_key` property. Previously
  it worked with `_key` or `id`. You can pass `getId` if you need the old behaviour.
* Passing `type="checkbox"` to `Field` will now work properly when using `BooleanWidget`.
* `NullableBooleanField` has been removed. Use `BooleanField({ blank: true })` instead. `NullableBooleanWidget` still exists and is used
  for `BooleanField` when `blank` is `true`.
* Removed `DurationField`, `UUIDField`, `IPAddressField` and `SlugField`. You can replace usage of these with `CharField` or a custom field. These were
  removed as Presto provided no extra functionality for these.
* Removed `DurationWidget`, `UUIDWidget`, `IPAddressWidget`, `URLWidget` and `SlugWidget`. Usages of these can be replaced with `CharWidget` or a custom widget.
* Removed `CurrencyField`. You can replace usage of this with `DecimalField` or a custom field. These were removed as Presto provided no extra functionality
  over the base field.
* Removed `CurrencyWidget`. Usages of this can be replaced with `DecimalWidget` or a custom widget.
* Add `JsonFormatter` and use it as default formatter for `JsonField`.
* `DateWidget` and `DateTimeWidget` previously accepted the `format` option under the `input` object. This must now be passed at the top level, e.g. `<DateWidget format="..." />` rather than `<DateWidget input={{ format: '...' }} />`.
* RangeField changes
  * `RangeField` no longer accepts `bounds` - ranges are assumed to be inclusive.
  * `RangeField` now requires a `boundsField` to be specified to be used for the lower & upper bounds of the range.
  * `DateRangeField`, `DateTimeRangeField`, `IntegerRangeField`, `DecimalRangeField`, `FloatRangeField` now all accept a `boundsFieldProps` prop that will be passed to the `boundsField` used. Each
    of these fields specifies the appropriate `boundsField` to use.
  * `getFormatterForField` will set the appropriate `boundsFormatter` based on the `boundsField`
  * `RangeWidget` no longer accepts `ref`. `lowerRef` and `upperRef` can be passed to attach refs to the lower and upper bound inputs.
* Types for many widgets in `@prestojs/ui-antd` have been updated. Previously, many of the props were typed as `any`. These have been updated to be more specific.
* `FormField` and `FormItem`, and their associated types, are no longer generic. Previously, they were generic on the value accepted
  by the `Field` but this caused problems in various situations and provided little benefit. If you were explicitly using the generic 
  types you will need to remove them.
* `SelectAsyncChoicesWidget` will now call `asyncChoices.parseValue` for each value in `value` if `multiple` is `true`. Fixes [#186](https://github.com/prestojs/prestojs/issues/186).
* `Form` incorrectly had `initialValues` type that claimed it supported a viewmodel. This has been removed. Fixes [#172](https://github.com/prestojs/prestojs/issues/172).

## [0.0.34] - 2022-10-07

### Changed

* Fix to `InferredPaginator` that meant accessing state could be stale due to React 18 batching causing problems (eg. in `useAsyncListing`). 
* Fix types for `getFormatterForField`. Previously required props to extend `HTMLElement` which didn't make sense - see [#179](https://github.com/prestojs/prestojs/issues/179)
* Fix `Paginator` to ensure current page is set after response received
* `Form` no longer pretends to accept a ViewModel in `initialValues` (it claimed it did but would break if passed).
* Update types for `Form` to accept prop type for `formProps`

## [0.0.33] - 2022-08-31

### Changed

* Fix to paginators that meant `responseIsSet` was stale due to React 18 batching causing problems (eg. in `useAsyncListing`). 

## [0.0.32] - 2022-08-29

### Added

* Added [AsyncChoices.parseValue](https://prestojs.com/docs/viewmodel/fields/AsyncChoices#Method-parseValue)

### Changed

* [EmailWidget](https://prestojs.com/docs/ui-antd/widgets/EmailWidget) now uses `type="email"`
* Fixed useAsyncValue `existingValues` to work with complex keys
* Fix bug in view model caching when retrieving nested records with many related fields with no values set. Previously
  if it was initialised with an empty array retrieving from the cache explicitly naming those fields (or using *) would
  result in a cache miss.
* [UrlPattern](https://prestojs.com/docs/routing/UrlPattern#UrlPattern) now supports specifying options in the constructor. All options can be overridden in the call to `resolve`.
  * `baseUrl` - if specified this will be prefixed to resolved pattern
  * `query` - any query parameters to be included in any urls resolved from this pattern
  * `mergeQuery` - If true (the default) then any query parameters provided to the constructor will be merged with any provided to resolve.
* [Endpoint.prepare](https://prestojs.com/docs/rest/Endpoint#Method-prepare) now returns a function that can be called directly (previously it was an object with an `execute` method). 
  * This changes usage from `endpoint.prepare().execute()` to `endpoint.prepare()()` (but the former will still work with a deprecation notice)
  * This makes usage with useAsync much easier, eg. `useAsync(endpoint.prepare(), { trigger: 'SHALLOW' })` will work now
* [Endpoint](https://prestojs.com/docs/rest/Endpoint#api) now accepts a `string` or `UrlPattern` as the URL. If a `string` is passed it will be converted to a `UrlPattern`.

### Types

* [CharWidget](https://prestojs.com/docs/ui-antd/widgets/CharWidget) & [EmailWidget](https://prestojs.com/docs/ui-antd/widgets/EmailWidget) types now accept all props antd `Input` does (you could previously pass and it would work but type checking would fail)
* [NumberField](https://prestojs.com/docs/viewmodel/fields/NumberField) `minValue` and `maxValue` now accept `string` or `number`

## [0.0.31] - 2022-06-14

### Added

* [Field](https://prestojs.com/docs/viewmodel/fields/Field) supports `widgetProps` & `formatterProps` 

### Changed

* Support for `React.StrictMode`.
  * `useAsync` will no longer prevent `setState` calls happening after component is unmounted. If you are using < React18 you can manually do this yourself
     using the `abort` method in the calling component/hook.
  * If using @prestojs/ui-antd requires antd >= 4.20
* [IntegerField](https://prestojs.com/docs/viewmodel/fields/IntegerField) & [FloatField](https://prestojs.com/docs/viewmodel/fields/FloatField) now parses string inputs into numbers
  when instantiating a model. Invalid values will cause an error to be thrown.
* [IntegerField](https://prestojs.com/docs/viewmodel/fields/IntegerField), [FloatField](https://prestojs.com/docs/viewmodel/fields/FloatField) & [DecimalField](https://prestojs.com/docs/viewmodel/fields/DecimalField)
  used with their default widgets will use `minValue` & `maxValue` to limit the input range
* [DecimalField](https://prestojs.com/docs/viewmodel/fields/DecimalField) used with [DecimalWidget](https://prestojs.com/docs/ui-antd/widgets/DecimalWidget) will use `decimalPlaces` to limit precision
* [DecimalWidget](https://prestojs.com/docs/ui-antd/widgets/DecimalWidget) now stores values as a string to allow high precision.
* [IntegerWidget](https://prestojs.com/docs/ui-antd/widgets/IntegerWidget) now forces entered value to be an integer (ie. decimal places are removed)
* [NumberField](https://prestojs.com/docs/viewmodel/fields/NumberField) now accepts either string or number for `minValue` & `maxValue` to support strings that may come from `DecimalField`.
* [DateField](https://prestojs.com/docs/viewmodel/fields/DateField) & [DateTimeField](https://prestojs.com/docs/viewmodel/fields/DateTimeField) now consider dates that represent the same value to be equal
  * Without this change if a record with one of these fields was to be updated via `viewModelCachingMiddleware` and it was identical it would still always replace the existing record.

## [0.0.30] - 2022-04-13

### Changed

* Fix bug that meant changes to a record referenced by `RelatedViewModelField` or `ManyRelatedViewModelField` would not reflect in the parent record (even if you refetch it)

## [0.0.29] - 2022-03-21

### Changed

* Fix bugs that could occur when using `ManyRelatedViewModelField` with recursive relations (ie. a model has a direct or indirect relation to itself)

## [0.0.28] - 2022-03-08

### Changed

* Fix bug when constructing a record with nested `ManyRelatedViewModelField` data that in turn had related fields that were null
  * <details>
      <summary>Click here for an example</summary>
    For example previously constructing a record with 

      ```
      {
      relatedRecords:
        [
          {
            id: 1,
            nestedRecordId: null,
            nestedRecord: null,
          },
          {
            id: 2,
            nestedRecordId: 1,
            nestedRecord: {
              id: 1,
              name: 'Nested Record 1',
            },
          },
        ]
      }
      ```

    would result in

      ```
      {
      relatedRecords:
        [
          {
            id: 1,
            nestedRecordId: null,
          },
          {
            id: 2,
            nestedRecordId: 1,
          },
        ]
      }
      ```

    which lost the nested record due to one of the records having a `null` value. This is now resolved.

    </details>
    
## [0.0.27] - 2022-02-21

### Changed

* Fix bug in caching where updating nested records could cause the cache to return incorrect results

## [0.0.26] - 2022-02-13

### Changed

* `@prestojs/final-form` now specifies `final-form` and `react-final-form` as a peer dependency rather than a dependency. This avoids
  the case where multiple versions of these packages could be installed which causes issues with context not working. To upgrade
  make sure these packages are installed as direct dependencies.

## [0.0.25] - 2022-02-13

### Changed

* ViewModelCache rewritten to resolve some longstanding bugs and make implementation easier to maintain
  * The private `cache` attribute on the ViewModelCache has been renamed to `fieldNameCache`. Ideally you should not access this as it may change in the future but if you rely on it update to use the new name.
    * If you just need the id's that are cached you can use `model.cache.getAll(model.pkFieldNames).map(record => record._key)`
  * The accepted values for specifying the field paths to retrieves is more strict for related records. If you wish to retrieve all fields on a related record you could previously specify it as a nested array with a single element, eg
    `[['members']]`. Now you must specify it without the redundant array: `['members']`.
  * Previously it was common to type field names to pass to `ViewModelCache` like: `const projectFieldNames = ['title', 'clientTitle'] as const;`. You can now type them as `const projectFieldNames: FieldPath<typeof Project>[] = ['title', 'clientTitle'];` which will check all fields specified are valid.
  * To get the best typing on the default cache for a ViewModel explicitly assign it as shown below
  
    ```typescript
    export default class Timecard extends viewModelFactory({ ...}, { ... }) {
        static cache: ViewModelCache<typeof Timecard> = new ViewModelCache(Timecard);
    }
    ```
  * ViewModelFactory adds some new properties to the ViewModel class
    * You must now always pass `pkFieldName` and the old implicit foreign key support has been removed. This was done to greatly simplify types and implementation.
      * If you are using codegen to create models then you likely do not need to do anything at all. For any manually created classes check that the `id` field is explicitly defined and `pkFieldName` is passed.
    * [_assignedFieldsDeep](https://prestojs.com/docs/viewmodel/viewModelFactory/#var-_assignedFieldsDeep) - Deep field names set on this record. If no relations are set this is the same as `_assignedFields`.
    * [_assignedFieldPaths](https://prestojs.com/docs/viewmodel/viewModelFactory/#var-_assignedFieldPaths) - A new structure that is unique based on the fields set. If 2 records have the same fields set then this will be the same instance so can be compared directly.
    * Various typing improvements
  * Added the `cache` option to [RelatedViewModelField](https://prestojs.com/docs/viewmodel/fields/RelatedViewModelField/#constructor)

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
