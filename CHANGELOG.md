# Changelog

## Unreleased

### Added

* If `viewModelCachingMiddleware` and `paginationMiddleware` appear in the incorrect order this is now detected when the endpoint is defined

### Changed

* Fix issue with `useViewModelCache` that could cause a render after unmount
* (breaking) Removed `RequestError` from `Endpoint`. Instead `Endpoint` will now throw the error raised by `fetch` directly - either `TypeError` or `AbortError`.
* Fix bugs with `RelatedViewModelField` and `ManyRelatedViewModelField` where things could break if value was `null` or `[]`
* Fix bug with `ViewModelCache` when passing a record with nested related fields to `get` or `getList` that meant it only traversed 1 level deep which meant the returned record could be different to the passed record.

## [0.0.11] - 2021-03-01

### Added

* Add `deleteViewModel` option to [viewModelCachingMiddleware](https://prestojs.com/docs/rest/viewmodelcachingmiddleware) by [@jasongi-alliance](https://github.com/jasongi-alliance)

### Changed

* Fix `getAll` to work with ViewModel's that have compound primary keys by [@liz-johnson-alliance](https://github.com/liz-johnson-alliance)
