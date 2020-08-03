# Presto DRF

Integration package for using [django-rest-framework](https://www.django-rest-framework.org) with [prestojs](https://github.com/prestojs/)

## Installation

```
pip install presto_drf
```

## API

### Mixins

#### SerializerOptInFieldsMixin

Regulates fields exposed on a Serializer by default & as requested based on query parameters or context.

* Pass 'include_fields' / 'opt_in_fields' thru query params or context to use.
* multiple fields can either be separated by comma eg, `/?include_fields=first_name,email&opt_in_fields=gait_recognition_prediction`
* or passed in the traditional list fashion eg, `/?include_fields=first_name&include_fields=email&opt_in_fields=gait_recognition_prediction`
* or mixed eg, `/?include_fields=first_name,email&include_fields=boo`
* By default, all "fields" defined in serializer, minus those listed in "opt_in_fields" would be returned.
* If "include_fields" is supplied, only fields requested this way would be returned.
* If "opt_in_fields" is supplied, fields requested this way PLUS fields from #1 or #2 would be returned.
* Pinned fields are always returned (defaults to primary key)

Usage:

```python
class UserSerializer(SerializerOptInFieldsMixin, ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "first_name",
            "last_name",
            "email",
            "region",
            "activated_at",
            "is_staff",
        )
        # These fields only returned if explicitly requested
        opt_in_only_fields = ["activated_at", "is_staff"]
```
