# Changelog

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
